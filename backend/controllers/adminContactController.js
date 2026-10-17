const { query } = require('../config/db')

const isUuid = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(val || '').trim())

const listContactRequests = async (req, res) => {
  try {
    const status = String(req.query.status || 'all').trim().toLowerCase()
    const search = String(req.query.search || '').trim().toLowerCase()
    const exportAll = req.query.all === 'true' || req.query.export === 'true'
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20))

    const params = []
    const clauses = []

    if (status && status !== 'all') {
      params.push(status)
      clauses.push(`status = $${params.length}`)
    }

    if (search) {
      params.push(`%${search}%`)
      const idx = params.length
      clauses.push(`(
        LOWER(name) LIKE $${idx} OR
        LOWER(email) LIKE $${idx} OR
        LOWER(COALESCE(phone, '')) LIKE $${idx} OR
        LOWER(message) LIKE $${idx} OR
        LOWER(COALESCE(admin_notes, '')) LIKE $${idx}
      )`)
    }

    const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : ''

    // Total count matching filters
    const countResult = await query(
      `SELECT COUNT(*)::int AS count FROM contact_requests ${whereClause}`,
      params
    )
    const total = countResult.rows[0]?.count || 0

    // Overall stats across all requests
    const statsResult = await query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'resolved')::int AS resolved,
        COUNT(*) FILTER (WHERE (created_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date)::int AS today
      FROM contact_requests
    `)
    const stats = statsResult.rows[0] || { total: 0, pending: 0, resolved: 0, today: 0 }

    // Fetch rows
    let rowsQuery = `
      SELECT id, name, email, phone, message, status, admin_notes, resolved_at, created_at, updated_at
      FROM contact_requests
      ${whereClause}
      ORDER BY created_at DESC
    `

    let rows
    if (exportAll) {
      const result = await query(rowsQuery, params)
      rows = result.rows
    } else {
      const offset = (page - 1) * pageSize
      params.push(pageSize)
      const limitIdx = params.length
      params.push(offset)
      const offsetIdx = params.length
      rowsQuery += ` LIMIT $${limitIdx} OFFSET $${offsetIdx}`
      const result = await query(rowsQuery, params)
      rows = result.rows
    }

    const totalPages = Math.max(1, Math.ceil(total / pageSize))

    return res.json({
      requests: rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone || '',
        message: r.message,
        status: r.status,
        adminNotes: r.admin_notes || '',
        resolvedAt: r.resolved_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      stats,
    })
  } catch (error) {
    console.error('List contact requests error:', error.message)
    return res.status(500).json({ message: 'Could not load contact requests' })
  }
}

const updateContactRequest = async (req, res) => {
  try {
    const { id } = req.params
    if (!isUuid(id)) {
      return res.status(400).json({ message: 'Invalid contact request ID' })
    }

    const currentResult = await query(`SELECT * FROM contact_requests WHERE id = $1`, [id])
    if (currentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Contact request not found' })
    }

    const current = currentResult.rows[0]
    const nextStatus = req.body.status !== undefined ? String(req.body.status).trim().toLowerCase() : current.status
    const nextNotes = req.body.adminNotes !== undefined ? String(req.body.adminNotes).trim() : current.admin_notes

    const validStatuses = ['pending', 'resolved']
    if (!validStatuses.includes(nextStatus)) {
      return res.status(400).json({ message: 'Status must be pending or resolved' })
    }

    const resolvedAt = nextStatus === 'resolved' ? (current.resolved_at || new Date().toISOString()) : null

    const updateResult = await query(
      `UPDATE contact_requests
       SET status = $1, admin_notes = $2, resolved_at = $3, updated_at = NOW()
       WHERE id = $4
       RETURNING id, name, email, phone, message, status, admin_notes, resolved_at, created_at, updated_at`,
      [nextStatus, nextNotes || null, resolvedAt, id]
    )

    const updated = updateResult.rows[0]
    return res.json({
      success: true,
      request: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone || '',
        message: updated.message,
        status: updated.status,
        adminNotes: updated.admin_notes || '',
        resolvedAt: updated.resolved_at,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      },
    })
  } catch (error) {
    console.error('Update contact request error:', error.message)
    return res.status(500).json({ message: 'Could not update contact request' })
  }
}

const deleteContactRequest = async (req, res) => {
  try {
    const { id } = req.params
    if (!isUuid(id)) {
      return res.status(400).json({ message: 'Invalid contact request ID' })
    }

    const result = await query(`DELETE FROM contact_requests WHERE id = $1 RETURNING id`, [id])
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Contact request not found' })
    }

    return res.json({ success: true, message: 'Contact request deleted successfully' })
  } catch (error) {
    console.error('Delete contact request error:', error.message)
    return res.status(500).json({ message: 'Could not delete contact request' })
  }
}

module.exports = {
  listContactRequests,
  updateContactRequest,
  deleteContactRequest,
}
