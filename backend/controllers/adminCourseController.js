const { query, pool } = require('../config/db')
const catalog = require('../services/catalog')
const storage = require('../services/storage')
const { ACCENTS, DEFAULT_ACCENT, isAllowedAccent } = require('../data/accents')

const VIDEO_TYPES = new Set(['video/mp4', 'video/webm', 'video/quicktime'])
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)

const uniqueSlug = async (title, ignoreId) => {
  const base = slugify(title) || 'course'
  let slug = base
  let attempt = 1

  while (attempt < 50) {
    const existing = await query(
      'SELECT id FROM courses WHERE slug = $1 AND ($2::uuid IS NULL OR id <> $2::uuid)',
      [slug, ignoreId || null]
    )
    if (!existing.rows[0]) return slug
    attempt += 1
    slug = `${base}-${attempt}`
  }

  return `${base}-${Date.now()}`
}

const resolveCategory = async (name) => {
  const categoryName = String(name || '').trim()
  if (!categoryName) return null

  const existing = await query('SELECT id FROM categories WHERE lower(name) = lower($1)', [categoryName])
  if (existing.rows[0]) return existing.rows[0].id

  const created = await query(
    `INSERT INTO categories (name, sort_order)
     VALUES ($1, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM categories))
     RETURNING id`,
    [categoryName]
  )
  return created.rows[0].id
}

const resolvePackage = async (packageId) => {
  if (!packageId) return null
  const result = await query('SELECT id FROM packages WHERE id = $1', [packageId])
  return result.rows[0]?.id || null
}

const readCourseInput = (body) => {
  const title = String(body.title || '').trim()
  const instructor = String(body.instructor || '').trim()
  const description = String(body.description || '').trim()
  const category = String(body.category || '').trim()
  const hours = Number(body.hours)
  const accent = isAllowedAccent(body.accent) ? body.accent : DEFAULT_ACCENT
  const status = body.status === 'draft' ? 'draft' : 'published'
  const requiresUpgrade = Boolean(body.requiresUpgrade)

  return { title, instructor, description, category, hours, accent, status, requiresUpgrade }
}

const validateCourse = (input) => {
  if (!input.title) return 'Title is required'
  if (!input.instructor) return 'Instructor is required'
  if (!input.category) return 'Category is required'
  if (!Number.isFinite(input.hours) || input.hours < 0) return 'Hours must be a number'
  return ''
}

const safeFileName = (fileName) =>
  String(fileName || 'file')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(-80)

const getMeta = async (req, res) => {
  try {
    const [categories, packages] = await Promise.all([catalog.listCategories(), catalog.listPackages()])
    return res.json({
      categories,
      packages,
      accents: ACCENTS,
      storageConfigured: storage.isConfigured(),
    })
  } catch (error) {
    console.error('Admin meta error:', error.message)
    return res.status(500).json({ message: 'Could not load admin options' })
  }
}

const listCourses = async (req, res) => {
  try {
    const courses = await catalog.listCourses()
    return res.json({ courses })
  } catch (error) {
    console.error('Admin list error:', error.message)
    return res.status(500).json({ message: 'Could not load courses' })
  }
}

const getCourse = async (req, res) => {
  try {
    const row = await catalog.getCourseById(req.params.id)
    if (!row) return res.status(404).json({ message: 'Course not found' })
    const course = await catalog.mapCourse(row, { includeAdmin: true })
    const lessons = (await catalog.listLessons(row.id)).map(catalog.mapLesson)
    return res.json({ course, lessons })
  } catch (error) {
    console.error('Admin course error:', error.message)
    return res.status(500).json({ message: 'Could not load this course' })
  }
}

const createCourse = async (req, res) => {
  try {
    const input = readCourseInput(req.body)
    const message = validateCourse(input)
    if (message) return res.status(400).json({ message })

    const categoryId = await resolveCategory(input.category)
    const packageId = await resolvePackage(req.body.packageId || null)
    const slug = await uniqueSlug(input.title)
    const sort = await query('SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM courses')

    const result = await query(
      `INSERT INTO courses (
         slug, title, instructor, description, category_id, package_id,
         accent, hours, requires_upgrade, status, sort_order
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [
        slug,
        input.title,
        input.instructor,
        input.description,
        categoryId,
        packageId,
        input.accent,
        input.hours,
        input.requiresUpgrade,
        input.status,
        sort.rows[0].next,
      ]
    )

    const row = await catalog.getCourseById(result.rows[0].id)
    return res.status(201).json({ course: await catalog.mapCourse(row, { includeAdmin: true }) })
  } catch (error) {
    console.error('Create course error:', error.message)
    return res.status(500).json({ message: 'Could not create the course' })
  }
}

const updateCourse = async (req, res) => {
  try {
    const current = await catalog.getCourseById(req.params.id)
    if (!current) return res.status(404).json({ message: 'Course not found' })

    const input = readCourseInput(req.body)
    const message = validateCourse(input)
    if (message) return res.status(400).json({ message })

    const categoryId = await resolveCategory(input.category)
    const packageId = await resolvePackage(req.body.packageId || null)
    const slug = current.title === input.title ? current.slug : await uniqueSlug(input.title, current.id)

    let thumbnailKey = current.thumbnail_key
    if (Object.prototype.hasOwnProperty.call(req.body, 'thumbnailKey')) {
      const nextKey = req.body.thumbnailKey || null
      if (nextKey && !String(nextKey).startsWith(`courses/${current.id}/`)) {
        return res.status(400).json({ message: 'Invalid thumbnail' })
      }
      if (current.thumbnail_key && current.thumbnail_key !== nextKey) {
        await storage.removeObject(current.thumbnail_key).catch(() => {})
      }
      thumbnailKey = nextKey
    }

    await query(
      `UPDATE courses
       SET slug = $1, title = $2, instructor = $3, description = $4, category_id = $5,
           package_id = $6, accent = $7, hours = $8, requires_upgrade = $9, status = $10,
           thumbnail_key = $11, updated_at = NOW()
       WHERE id = $12`,
      [
        slug,
        input.title,
        input.instructor,
        input.description,
        categoryId,
        packageId,
        input.accent,
        input.hours,
        input.requiresUpgrade,
        input.status,
        thumbnailKey,
        current.id,
      ]
    )

    const row = await catalog.getCourseById(current.id)
    return res.json({ course: await catalog.mapCourse(row, { includeAdmin: true }) })
  } catch (error) {
    console.error('Update course error:', error.message)
    return res.status(500).json({ message: 'Could not update the course' })
  }
}

const deleteCourse = async (req, res) => {
  try {
    const current = await catalog.getCourseById(req.params.id)
    if (!current) return res.status(404).json({ message: 'Course not found' })

    const lessons = await catalog.listLessons(current.id)
    await query('DELETE FROM courses WHERE id = $1', [current.id])

    const keys = [current.thumbnail_key, ...lessons.map((lesson) => lesson.storage_key)].filter(Boolean)
    await Promise.all(keys.map((key) => storage.removeObject(key).catch(() => {})))

    return res.json({ ok: true })
  } catch (error) {
    console.error('Delete course error:', error.message)
    return res.status(500).json({ message: 'Could not delete the course' })
  }
}

const uploadFile = async (req, res) => {
  const tempPath = req.file?.path
  try {
    if (!storage.isConfigured()) {
      return res.status(503).json({ message: 'Lightsail storage is not configured yet. Add the bucket keys in backend/.env.' })
    }
    if (!req.file) return res.status(400).json({ message: 'Choose a file to upload' })

    const course = await catalog.getCourseById(req.body.courseId)
    if (!course) return res.status(404).json({ message: 'Course not found' })

    const kind = req.body.kind === 'thumbnail' ? 'thumbnail' : 'lesson'
    const contentType = req.file.mimetype || ''
    const allowed = kind === 'thumbnail' ? IMAGE_TYPES : VIDEO_TYPES
    if (!allowed.has(contentType)) {
      return res.status(400).json({ message: 'This file type is not supported' })
    }

    const key = `courses/${course.id}/${kind}/${Date.now()}-${safeFileName(req.file.originalname)}`
    await storage.putObject(key, require('fs').createReadStream(tempPath), contentType)
    return res.json({ storageKey: key })
  } catch (error) {
    console.error('Upload error:', error.message)
    return res.status(500).json({ message: 'Could not upload the file' })
  } finally {
    if (tempPath) require('fs').unlink(tempPath, () => {})
  }
}

const signUpload = async (req, res) => {
  try {
    if (!storage.isConfigured()) {
      return res.status(503).json({
        message: 'Lightsail storage is not configured yet. Add the bucket keys in backend/.env.',
      })
    }

    const course = await catalog.getCourseById(req.body.courseId)
    if (!course) return res.status(404).json({ message: 'Course not found' })

    const kind = req.body.kind === 'thumbnail' ? 'thumbnail' : 'lesson'
    const contentType = String(req.body.contentType || '')
    const allowed = kind === 'thumbnail' ? IMAGE_TYPES : VIDEO_TYPES
    if (!allowed.has(contentType)) {
      return res.status(400).json({ message: 'This file type is not supported' })
    }

    const key = `courses/${course.id}/${kind}/${Date.now()}-${safeFileName(req.body.fileName)}`
    const uploadUrl = await storage.signedPut(key, contentType)
    return res.json({ uploadUrl, storageKey: key, contentType })
  } catch (error) {
    console.error('Sign upload error:', error.message)
    return res.status(500).json({ message: 'Could not prepare the upload' })
  }
}

const createLesson = async (req, res) => {
  try {
    const course = await catalog.getCourseById(req.params.id)
    if (!course) return res.status(404).json({ message: 'Course not found' })

    const title = String(req.body.title || '').trim()
    if (!title) return res.status(400).json({ message: 'Lesson title is required' })

    const durationSeconds = Math.max(0, Number(req.body.durationSeconds) || 0)
    const storageKey = req.body.storageKey || null
    if (storageKey && !String(storageKey).startsWith(`courses/${course.id}/`)) {
      return res.status(400).json({ message: 'Invalid video file' })
    }

    const position = await query(
      'SELECT COALESCE(MAX(position), -1) + 1 AS next FROM lessons WHERE course_id = $1',
      [course.id]
    )

    const result = await query(
      `INSERT INTO lessons (course_id, title, description, position, duration_seconds, storage_key)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, title, description, position, duration_seconds, storage_key, external_url`,
      [course.id, title, String(req.body.description || '').trim(), position.rows[0].next, durationSeconds, storageKey]
    )

    return res.status(201).json({ lesson: catalog.mapLesson(result.rows[0]) })
  } catch (error) {
    console.error('Create lesson error:', error.message)
    return res.status(500).json({ message: 'Could not add the lesson' })
  }
}

const updateLesson = async (req, res) => {
  try {
    const current = await query(
      `SELECT id, course_id, title, description, position, duration_seconds, storage_key, external_url
       FROM lessons WHERE id = $1`,
      [req.params.id]
    )
    const lesson = current.rows[0]
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' })

    const title = String(req.body.title || lesson.title).trim()
    if (!title) return res.status(400).json({ message: 'Lesson title is required' })

    const durationSeconds = Object.prototype.hasOwnProperty.call(req.body, 'durationSeconds')
      ? Math.max(0, Number(req.body.durationSeconds) || 0)
      : lesson.duration_seconds

    let storageKey = lesson.storage_key
    let externalUrl = lesson.external_url
    if (Object.prototype.hasOwnProperty.call(req.body, 'storageKey')) {
      const nextKey = req.body.storageKey || null
      if (nextKey && !String(nextKey).startsWith(`courses/${lesson.course_id}/`)) {
        return res.status(400).json({ message: 'Invalid video file' })
      }
      if (lesson.storage_key && lesson.storage_key !== nextKey) {
        await storage.removeObject(lesson.storage_key).catch(() => {})
      }
      storageKey = nextKey
      if (nextKey) externalUrl = null
    }

    const result = await query(
      `UPDATE lessons
       SET title = $1, description = $2, duration_seconds = $3, storage_key = $4,
           external_url = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING id, title, description, position, duration_seconds, storage_key, external_url`,
      [title, String(req.body.description ?? lesson.description).trim(), durationSeconds, storageKey, externalUrl, lesson.id]
    )

    return res.json({ lesson: catalog.mapLesson(result.rows[0]) })
  } catch (error) {
    console.error('Update lesson error:', error.message)
    return res.status(500).json({ message: 'Could not update the lesson' })
  }
}

const deleteLesson = async (req, res) => {
  try {
    const current = await query('SELECT id, storage_key FROM lessons WHERE id = $1', [req.params.id])
    const lesson = current.rows[0]
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' })

    await query('DELETE FROM lessons WHERE id = $1', [lesson.id])
    await storage.removeObject(lesson.storage_key).catch(() => {})
    return res.json({ ok: true })
  } catch (error) {
    console.error('Delete lesson error:', error.message)
    return res.status(500).json({ message: 'Could not delete the lesson' })
  }
}

const reorderLessons = async (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : []
  const client = await pool.connect()

  try {
    const course = await catalog.getCourseById(req.params.id)
    if (!course) return res.status(404).json({ message: 'Course not found' })

    await client.query('BEGIN')
    for (let index = 0; index < ids.length; index += 1) {
      await client.query('UPDATE lessons SET position = $1, updated_at = NOW() WHERE id = $2 AND course_id = $3', [
        index,
        ids[index],
        course.id,
      ])
    }
    await client.query('COMMIT')

    const lessons = (await catalog.listLessons(course.id)).map(catalog.mapLesson)
    return res.json({ lessons })
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Reorder error:', error.message)
    return res.status(500).json({ message: 'Could not reorder lessons' })
  } finally {
    client.release()
  }
}

module.exports = {
  getMeta,
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadFile,
  signUpload,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
}
