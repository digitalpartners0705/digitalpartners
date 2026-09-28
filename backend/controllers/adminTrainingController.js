const fs = require('fs')
const { query } = require('../config/db')
const storage = require('../services/storage')

const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime'])

const safeFileName = (fileName) =>
  String(fileName || 'file')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(-80)

const formatDuration = (seconds) => {
  const total = Math.max(0, Number(seconds) || 0)
  const minutes = Math.floor(total / 60)
  const secs = total % 60
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

const mapVideo = (row) => ({
  id: row.id,
  title: row.title,
  position: row.position,
  durationSeconds: row.duration_seconds,
  duration: formatDuration(row.duration_seconds),
  hasVideo: Boolean(row.storage_key),
})

const mapDay = (row) => ({
  id: row.id,
  dayNumber: row.day_number,
  title: row.title,
  status: row.status,
  videos: Number(row.video_count) || 0,
})

const readDayInput = (body) => {
  const dayNumber = Number(body.dayNumber)
  const title = String(body.title || '').trim()
  const status = body.status === 'draft' ? 'draft' : 'published'
  if (!Number.isInteger(dayNumber) || dayNumber < 1) return { message: 'Day number must be 1 or more' }
  if (!title) return { message: 'Title is required' }
  return { dayNumber, title, status }
}

const listDays = async (req, res) => {
  try {
    const result = await query(
      `SELECT d.id, d.day_number, d.title, d.status,
              (SELECT COUNT(*)::int FROM training_videos v WHERE v.day_id = d.id) AS video_count
       FROM training_days d
       ORDER BY d.day_number ASC`
    )
    return res.json({ days: result.rows.map(mapDay) })
  } catch (error) {
    console.error('List training days error:', error.message)
    return res.status(500).json({ message: 'Could not load training days' })
  }
}

const getDay = async (req, res) => {
  try {
    const dayResult = await query(
      `SELECT d.id, d.day_number, d.title, d.status,
              (SELECT COUNT(*)::int FROM training_videos v WHERE v.day_id = d.id) AS video_count
       FROM training_days d
       WHERE d.id = $1`,
      [req.params.id]
    )
    const row = dayResult.rows[0]
    if (!row) return res.status(404).json({ message: 'Training day not found' })

    const videos = await query(
      `SELECT id, title, position, duration_seconds, storage_key
       FROM training_videos
       WHERE day_id = $1
       ORDER BY position ASC, created_at ASC`,
      [row.id]
    )
    return res.json({
      day: mapDay(row),
      videos: videos.rows.map(mapVideo),
      storageConfigured: storage.isConfigured(),
    })
  } catch (error) {
    console.error('Get training day error:', error.message)
    return res.status(500).json({ message: 'Could not load this training day' })
  }
}

const createDay = async (req, res) => {
  try {
    const input = readDayInput(req.body)
    if (input.message) return res.status(400).json({ message: input.message })

    const result = await query(
      `INSERT INTO training_days (day_number, title, status)
       VALUES ($1, $2, $3)
       RETURNING id, day_number, title, status`,
      [input.dayNumber, input.title, input.status]
    )
    return res.status(201).json({ day: { ...mapDay(result.rows[0]), videos: 0 } })
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'That day number is already used' })
    console.error('Create training day error:', error.message)
    return res.status(500).json({ message: 'Could not create the training day' })
  }
}

const updateDay = async (req, res) => {
  try {
    const current = await query('SELECT id FROM training_days WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ message: 'Training day not found' })

    const input = readDayInput(req.body)
    if (input.message) return res.status(400).json({ message: input.message })

    const result = await query(
      `UPDATE training_days
       SET day_number = $1, title = $2, status = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, day_number, title, status`,
      [input.dayNumber, input.title, input.status, req.params.id]
    )
    const count = await query('SELECT COUNT(*)::int AS count FROM training_videos WHERE day_id = $1', [req.params.id])
    return res.json({ day: { ...mapDay(result.rows[0]), videos: count.rows[0].count } })
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'That day number is already used' })
    console.error('Update training day error:', error.message)
    return res.status(500).json({ message: 'Could not update the training day' })
  }
}

const deleteDay = async (req, res) => {
  try {
    const current = await query('SELECT id FROM training_days WHERE id = $1', [req.params.id])
    if (!current.rows[0]) return res.status(404).json({ message: 'Training day not found' })

    const videos = await query('SELECT storage_key FROM training_videos WHERE day_id = $1', [req.params.id])
    await query('DELETE FROM training_days WHERE id = $1', [req.params.id])
    await Promise.all(videos.rows.map((row) => storage.removeObject(row.storage_key).catch(() => {})))
    return res.json({ ok: true })
  } catch (error) {
    console.error('Delete training day error:', error.message)
    return res.status(500).json({ message: 'Could not delete the training day' })
  }
}

const uploadTrainingVideo = async (req, res) => {
  const tempPath = req.file?.path
  try {
    if (!storage.isConfigured()) {
      return res.status(503).json({ message: 'Storage is not configured yet. Add the bucket keys in backend/.env.' })
    }
    if (!req.file) return res.status(400).json({ message: 'Choose a file to upload' })

    const day = await query('SELECT id FROM training_days WHERE id = $1', [req.params.id])
    if (!day.rows[0]) return res.status(404).json({ message: 'Training day not found' })

    const contentType = req.file.mimetype || ''
    if (!VIDEO_TYPES.has(contentType)) {
      return res.status(400).json({ message: 'Use an mp4, webm, or mov video' })
    }

    const key = `trainings/${day.rows[0].id}/videos/${Date.now()}-${safeFileName(req.file.originalname)}`
    await storage.putObject(key, fs.createReadStream(tempPath), contentType)
    return res.json({ storageKey: key })
  } catch (error) {
    console.error('Training upload error:', error.message)
    return res.status(500).json({ message: 'Could not upload the video' })
  } finally {
    if (tempPath) fs.unlink(tempPath, () => {})
  }
}

const createVideo = async (req, res) => {
  try {
    const day = await query('SELECT id FROM training_days WHERE id = $1', [req.params.id])
    if (!day.rows[0]) return res.status(404).json({ message: 'Training day not found' })

    const title = String(req.body.title || '').trim()
    if (!title) return res.status(400).json({ message: 'Video title is required' })

    const durationSeconds = Math.max(0, Number(req.body.durationSeconds) || 0)
    const storageKey = req.body.storageKey || null
    if (storageKey && !String(storageKey).startsWith(`trainings/${day.rows[0].id}/`)) {
      return res.status(400).json({ message: 'Invalid video file' })
    }

    const position = await query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM training_videos WHERE day_id = $1',
      [day.rows[0].id]
    )
    const result = await query(
      `INSERT INTO training_videos (day_id, title, position, duration_seconds, storage_key)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, position, duration_seconds, storage_key`,
      [day.rows[0].id, title, position.rows[0].next, durationSeconds, storageKey]
    )
    return res.status(201).json({ video: mapVideo(result.rows[0]) })
  } catch (error) {
    console.error('Create training video error:', error.message)
    return res.status(500).json({ message: 'Could not add the video' })
  }
}

const updateVideo = async (req, res) => {
  try {
    const current = await query(
      'SELECT id, day_id, title, duration_seconds, storage_key FROM training_videos WHERE id = $1',
      [req.params.id]
    )
    const video = current.rows[0]
    if (!video) return res.status(404).json({ message: 'Video not found' })

    const title = String(req.body.title || video.title).trim()
    if (!title) return res.status(400).json({ message: 'Video title is required' })
    const durationSeconds = Object.prototype.hasOwnProperty.call(req.body, 'durationSeconds')
      ? Math.max(0, Number(req.body.durationSeconds) || 0)
      : video.duration_seconds

    let storageKey = video.storage_key
    if (Object.prototype.hasOwnProperty.call(req.body, 'storageKey')) {
      const nextKey = req.body.storageKey || null
      if (nextKey && !String(nextKey).startsWith(`trainings/${video.day_id}/`)) {
        return res.status(400).json({ message: 'Invalid video file' })
      }
      if (video.storage_key && video.storage_key !== nextKey) {
        await storage.removeObject(video.storage_key).catch(() => {})
      }
      storageKey = nextKey
    }

    const result = await query(
      `UPDATE training_videos
       SET title = $1, duration_seconds = $2, storage_key = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, title, position, duration_seconds, storage_key`,
      [title, durationSeconds, storageKey, video.id]
    )
    return res.json({ video: mapVideo(result.rows[0]) })
  } catch (error) {
    console.error('Update training video error:', error.message)
    return res.status(500).json({ message: 'Could not update the video' })
  }
}

const deleteVideo = async (req, res) => {
  try {
    const current = await query('SELECT id, storage_key FROM training_videos WHERE id = $1', [req.params.id])
    const video = current.rows[0]
    if (!video) return res.status(404).json({ message: 'Video not found' })
    await query('DELETE FROM training_videos WHERE id = $1', [video.id])
    await storage.removeObject(video.storage_key).catch(() => {})
    return res.json({ ok: true })
  } catch (error) {
    console.error('Delete training video error:', error.message)
    return res.status(500).json({ message: 'Could not delete the video' })
  }
}

const reorderVideos = async (req, res) => {
  try {
    const day = await query('SELECT id FROM training_days WHERE id = $1', [req.params.id])
    if (!day.rows[0]) return res.status(404).json({ message: 'Training day not found' })
    const ids = Array.isArray(req.body.ids) ? req.body.ids : []
    for (let index = 0; index < ids.length; index += 1) {
      await query('UPDATE training_videos SET position = $1, updated_at = NOW() WHERE id = $2 AND day_id = $3', [
        index,
        ids[index],
        day.rows[0].id,
      ])
    }
    const videos = await query(
      `SELECT id, title, position, duration_seconds, storage_key
       FROM training_videos WHERE day_id = $1
       ORDER BY position ASC, created_at ASC`,
      [day.rows[0].id]
    )
    return res.json({ videos: videos.rows.map(mapVideo) })
  } catch (error) {
    console.error('Reorder training videos error:', error.message)
    return res.status(500).json({ message: 'Could not reorder videos' })
  }
}

const listPublished = async (req, res) => {
  try {
    const days = await query(
      `SELECT id, day_number, title, status
       FROM training_days
       WHERE status = 'published'
       ORDER BY day_number ASC`
    )
    const videos = await query(
      `SELECT id, day_id, title, position, duration_seconds, storage_key
       FROM training_videos
       ORDER BY position ASC, created_at ASC`
    )
    const byDay = new Map()
    for (const row of videos.rows) {
      const list = byDay.get(row.day_id) || []
      list.push(mapVideo(row))
      byDay.set(row.day_id, list)
    }
    return res.json({
      days: days.rows.map((row) => ({
        id: row.id,
        dayNumber: row.day_number,
        title: row.title,
        videos: byDay.get(row.id) || [],
      })),
    })
  } catch (error) {
    console.error('Public trainings error:', error.message)
    return res.status(500).json({ message: 'Could not load trainings' })
  }
}

const playVideo = async (req, res) => {
  try {
    const result = await query(
      `SELECT v.storage_key
       FROM training_videos v
       JOIN training_days d ON d.id = v.day_id
       WHERE v.id = $1 AND d.id = $2 AND d.status = 'published'`,
      [req.params.videoId, req.params.dayId]
    )
    const video = result.rows[0]
    if (!video?.storage_key) return res.status(404).json({ message: 'This video is not ready yet' })
    const url = await storage.signedGet(video.storage_key, 3600)
    if (!url) return res.status(503).json({ message: 'Video storage is not configured yet' })
    return res.json({ url, expiresIn: 3600 })
  } catch (error) {
    console.error('Play training video error:', error.message)
    return res.status(500).json({ message: 'Could not start this video' })
  }
}

module.exports = {
  listDays,
  getDay,
  createDay,
  updateDay,
  deleteDay,
  uploadTrainingVideo,
  createVideo,
  updateVideo,
  deleteVideo,
  reorderVideos,
  listPublished,
  playVideo,
}
