const { query } = require('../config/db')

const STATUSES = new Set(['draft', 'published'])
const REWARD_TYPES = new Set(['none', 'trip', 'gift', 'bonus', 'other'])

const isUuid = (val) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(val || '').trim())

const mapMilestone = (row) => ({
  id: row.id,
  title: row.title,
  amount: Number(row.amount) || 0,
  note: row.note || '',
  rewardType: row.reward_type || 'none',
  rewardTitle: row.reward_title || '',
  rewardDescription: row.reward_description || '',
  status: row.status,
  sortOrder: Number(row.sort_order) || 0,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

const normalizePayload = (body = {}) => {
  const title = String(body.title || '').trim()
  const note = String(body.note || '').trim()
  const amount = Number(body.amount)
  const status = String(body.status || 'draft').trim().toLowerCase()
  let rewardType = String(body.rewardType || 'none').trim().toLowerCase()
  const rewardTitle = String(body.rewardTitle || '').trim() || null
  const rewardDescription = String(body.rewardDescription || '').trim() || null
  const sortOrder = Number.isFinite(Number(body.sortOrder)) ? Math.trunc(Number(body.sortOrder)) : 0

  if (!title) return { error: 'Title is required' }
  if (!Number.isFinite(amount) || amount <= 0) return { error: 'Amount must be greater than 0' }
  if (!STATUSES.has(status)) return { error: 'Status must be draft or published' }
  if (!REWARD_TYPES.has(rewardType)) rewardType = 'none'

  if (rewardType === 'none') {
    return {
      title,
      note,
      amount,
      status,
      rewardType: 'none',
      rewardTitle: null,
      rewardDescription: null,
      sortOrder,
    }
  }

  if (!rewardTitle) return { error: 'Reward title is required when a reward is offered' }

  return {
    title,
    note,
    amount,
    status,
    rewardType,
    rewardTitle,
    rewardDescription,
    sortOrder,
  }
}

const listMilestones = async (req, res) => {
  try {
    const status = String(req.query.status || 'all').trim().toLowerCase()
    const search = String(req.query.search || '').trim().toLowerCase()
    const params = []
    const clauses = []

    if (status !== 'all' && STATUSES.has(status)) {
      params.push(status)
      clauses.push(`status = $${params.length}`)
    }
    if (search) {
      params.push(`%${search}%`)
      const idx = params.length
      clauses.push(
        `(LOWER(title) LIKE $${idx} OR LOWER(note) LIKE $${idx} OR LOWER(COALESCE(reward_title, '')) LIKE $${idx})`,
      )
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const result = await query(
      `SELECT *
       FROM achievement_milestones
       ${where}
       ORDER BY sort_order ASC, amount ASC, created_at ASC`,
      params,
    )

    const statsResult = await query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'published')::int AS published,
        COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
        COUNT(*) FILTER (WHERE reward_type <> 'none')::int AS with_reward
      FROM achievement_milestones
    `)

    return res.json({
      milestones: result.rows.map(mapMilestone),
      stats: statsResult.rows[0] || { total: 0, published: 0, draft: 0, with_reward: 0 },
    })
  } catch (error) {
    console.error('List achievement milestones error:', error.message)
    return res.status(500).json({ message: 'Could not load achievements' })
  }
}

const listPublishedMilestones = async (_req, res) => {
  try {
    const result = await query(
      `SELECT *
       FROM achievement_milestones
       WHERE status = 'published'
       ORDER BY sort_order ASC, amount ASC, created_at ASC`,
    )
    return res.json({ milestones: result.rows.map(mapMilestone) })
  } catch (error) {
    console.error('Published achievements error:', error.message)
    return res.status(500).json({ message: 'Could not load achievements' })
  }
}

const createMilestone = async (req, res) => {
  try {
    const payload = normalizePayload(req.body)
    if (payload.error) return res.status(400).json({ message: payload.error })

    const result = await query(
      `INSERT INTO achievement_milestones (
         title, amount, note, reward_type, reward_title, reward_description, status, sort_order
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        payload.title,
        payload.amount,
        payload.note,
        payload.rewardType,
        payload.rewardTitle,
        payload.rewardDescription,
        payload.status,
        payload.sortOrder,
      ],
    )

    return res.status(201).json({ milestone: mapMilestone(result.rows[0]) })
  } catch (error) {
    console.error('Create achievement milestone error:', error.message)
    return res.status(500).json({ message: 'Could not create milestone' })
  }
}

const updateMilestone = async (req, res) => {
  try {
    const id = String(req.params.id || '').trim()
    if (!isUuid(id)) return res.status(400).json({ message: 'Invalid milestone id' })

    const existing = await query(`SELECT * FROM achievement_milestones WHERE id = $1 LIMIT 1`, [id])
    if (!existing.rows[0]) return res.status(404).json({ message: 'Milestone not found' })

    const current = mapMilestone(existing.rows[0])
    const payload = normalizePayload({
      ...current,
      ...req.body,
      amount: req.body.amount ?? current.amount,
      note: req.body.note ?? current.note,
      rewardType: req.body.rewardType ?? current.rewardType,
      rewardTitle: req.body.rewardTitle ?? current.rewardTitle,
      rewardDescription: req.body.rewardDescription ?? current.rewardDescription,
      sortOrder: req.body.sortOrder ?? current.sortOrder,
      status: req.body.status ?? current.status,
    })
    if (payload.error) return res.status(400).json({ message: payload.error })

    const result = await query(
      `UPDATE achievement_milestones
       SET title = $1,
           amount = $2,
           note = $3,
           reward_type = $4,
           reward_title = $5,
           reward_description = $6,
           status = $7,
           sort_order = $8,
           updated_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        payload.title,
        payload.amount,
        payload.note,
        payload.rewardType,
        payload.rewardTitle,
        payload.rewardDescription,
        payload.status,
        payload.sortOrder,
        id,
      ],
    )

    return res.json({ milestone: mapMilestone(result.rows[0]) })
  } catch (error) {
    console.error('Update achievement milestone error:', error.message)
    return res.status(500).json({ message: 'Could not update milestone' })
  }
}

const deleteMilestone = async (req, res) => {
  try {
    const id = String(req.params.id || '').trim()
    if (!isUuid(id)) return res.status(400).json({ message: 'Invalid milestone id' })

    const result = await query(`DELETE FROM achievement_milestones WHERE id = $1 RETURNING id`, [id])
    if (!result.rows[0]) return res.status(404).json({ message: 'Milestone not found' })
    return res.json({ ok: true })
  } catch (error) {
    console.error('Delete achievement milestone error:', error.message)
    return res.status(500).json({ message: 'Could not delete milestone' })
  }
}

module.exports = {
  listMilestones,
  listPublishedMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
}
