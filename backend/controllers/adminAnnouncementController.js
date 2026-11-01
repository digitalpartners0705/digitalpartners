const { query } = require('../config/db')

const KINDS = new Set(['featured', 'notice'])
const STATUSES = new Set(['draft', 'published'])
const PANELS = new Set(['courses', 'files'])
const ICONS = new Set(['rooms', 'shield', 'note', 'link', 'megaphone'])

const isUuid = (val) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(val || '').trim())

const mapAnnouncement = (row) => ({
  id: row.id,
  kind: row.kind,
  tag: row.tag || '',
  title: row.title,
  body: row.body,
  panel: row.panel || null,
  icon: row.icon || null,
  displayDate: row.display_date || '',
  status: row.status,
  sortOrder: Number(row.sort_order) || 0,
  publishedAt: row.published_at,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const normalizePayload = (body = {}) => {
  const kind = String(body.kind || 'notice').trim().toLowerCase()
  const status = String(body.status || 'draft').trim().toLowerCase()
  const title = String(body.title || '').trim()
  const text = String(body.body || body.text || '').trim()
  const tag = String(body.tag || '').trim() || null
  const displayDate = String(body.displayDate || body.date || '').trim() || null
  let panel = String(body.panel || '').trim().toLowerCase() || null
  let icon = String(body.icon || '').trim().toLowerCase() || null
  const sortOrderRaw = body.sortOrder
  const sortOrder = Number.isFinite(Number(sortOrderRaw)) ? Math.trunc(Number(sortOrderRaw)) : 0

  if (!KINDS.has(kind)) return { error: 'Kind must be featured or notice' }
  if (!STATUSES.has(status)) return { error: 'Status must be draft or published' }
  if (!title) return { error: 'Title is required' }
  if (!text) return { error: 'Body text is required' }

  if (kind === 'featured') {
    if (!panel || !PANELS.has(panel)) panel = 'courses'
    icon = null
  } else {
    panel = null
    if (!icon || !ICONS.has(icon)) icon = 'megaphone'
  }

  return {
    kind,
    status,
    title,
    body: text,
    tag: kind === 'featured' ? tag || 'Update' : null,
    panel,
    icon,
    displayDate,
    sortOrder,
  }
}

const listAnnouncements = async (req, res) => {
  try {
    const status = String(req.query.status || 'all').trim().toLowerCase()
    const kind = String(req.query.kind || 'all').trim().toLowerCase()
    const search = String(req.query.search || '').trim().toLowerCase()

    const params = []
    const clauses = []

    if (status !== 'all' && STATUSES.has(status)) {
      params.push(status)
      clauses.push(`status = $${params.length}`)
    }
    if (kind !== 'all' && KINDS.has(kind)) {
      params.push(kind)
      clauses.push(`kind = $${params.length}`)
    }
    if (search) {
      params.push(`%${search}%`)
      const idx = params.length
      clauses.push(
        `(LOWER(title) LIKE $${idx} OR LOWER(body) LIKE $${idx} OR LOWER(COALESCE(tag, '')) LIKE $${idx})`,
      )
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const result = await query(
      `SELECT *
       FROM announcements
       ${where}
       ORDER BY kind ASC, sort_order ASC, COALESCE(published_at, created_at) DESC`,
      params,
    )

    const statsResult = await query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'published')::int AS published,
        COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
        COUNT(*) FILTER (WHERE kind = 'featured')::int AS featured,
        COUNT(*) FILTER (WHERE kind = 'notice')::int AS notice
      FROM announcements
    `)

    return res.json({
      announcements: result.rows.map(mapAnnouncement),
      stats: statsResult.rows[0] || { total: 0, published: 0, draft: 0, featured: 0, notice: 0 },
    })
  } catch (error) {
    console.error('List announcements error:', error.message)
    return res.status(500).json({ message: 'Could not load announcements' })
  }
}

const listPublishedAnnouncements = async (_req, res) => {
  try {
    const result = await query(
      `SELECT *
       FROM announcements
       WHERE status = 'published'
       ORDER BY kind ASC, sort_order ASC, COALESCE(published_at, created_at) DESC`,
    )

    const rows = result.rows.map(mapAnnouncement)
    return res.json({
      featured: rows.filter((item) => item.kind === 'featured'),
      notices: rows.filter((item) => item.kind === 'notice'),
      announcements: rows,
    })
  } catch (error) {
    console.error('Published announcements error:', error.message)
    return res.status(500).json({ message: 'Could not load announcements' })
  }
}

const createAnnouncement = async (req, res) => {
  try {
    const payload = normalizePayload(req.body)
    if (payload.error) return res.status(400).json({ message: payload.error })

    const publishedAt = payload.status === 'published' ? new Date().toISOString() : null
    const result = await query(
      `INSERT INTO announcements (
         kind, tag, title, body, panel, icon, display_date, status, sort_order, published_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        payload.kind,
        payload.tag,
        payload.title,
        payload.body,
        payload.panel,
        payload.icon,
        payload.displayDate,
        payload.status,
        payload.sortOrder,
        publishedAt,
      ],
    )

    return res.status(201).json({ announcement: mapAnnouncement(result.rows[0]) })
  } catch (error) {
    console.error('Create announcement error:', error.message)
    return res.status(500).json({ message: 'Could not create announcement' })
  }
}

const updateAnnouncement = async (req, res) => {
  try {
    const id = String(req.params.id || '').trim()
    if (!isUuid(id)) return res.status(400).json({ message: 'Invalid announcement id' })

    const existing = await query(`SELECT * FROM announcements WHERE id = $1 LIMIT 1`, [id])
    if (!existing.rows[0]) return res.status(404).json({ message: 'Announcement not found' })

    const payload = normalizePayload({
      ...mapAnnouncement(existing.rows[0]),
      ...req.body,
      body: req.body.body ?? req.body.text ?? existing.rows[0].body,
      displayDate: req.body.displayDate ?? req.body.date ?? existing.rows[0].display_date,
      sortOrder: req.body.sortOrder ?? existing.rows[0].sort_order,
    })
    if (payload.error) return res.status(400).json({ message: payload.error })

    let publishedAt = existing.rows[0].published_at
    if (payload.status === 'published' && !publishedAt) {
      publishedAt = new Date().toISOString()
    }
    if (payload.status === 'draft') {
      publishedAt = publishedAt || null
    }

    const result = await query(
      `UPDATE announcements
       SET kind = $1,
           tag = $2,
           title = $3,
           body = $4,
           panel = $5,
           icon = $6,
           display_date = $7,
           status = $8,
           sort_order = $9,
           published_at = $10,
           updated_at = NOW()
       WHERE id = $11
       RETURNING *`,
      [
        payload.kind,
        payload.tag,
        payload.title,
        payload.body,
        payload.panel,
        payload.icon,
        payload.displayDate,
        payload.status,
        payload.sortOrder,
        publishedAt,
        id,
      ],
    )

    return res.json({ announcement: mapAnnouncement(result.rows[0]) })
  } catch (error) {
    console.error('Update announcement error:', error.message)
    return res.status(500).json({ message: 'Could not update announcement' })
  }
}

const deleteAnnouncement = async (req, res) => {
  try {
    const id = String(req.params.id || '').trim()
    if (!isUuid(id)) return res.status(400).json({ message: 'Invalid announcement id' })

    const result = await query(`DELETE FROM announcements WHERE id = $1 RETURNING id`, [id])
    if (!result.rows[0]) return res.status(404).json({ message: 'Announcement not found' })
    return res.json({ ok: true })
  } catch (error) {
    console.error('Delete announcement error:', error.message)
    return res.status(500).json({ message: 'Could not delete announcement' })
  }
}

module.exports = {
  listAnnouncements,
  listPublishedAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
}
