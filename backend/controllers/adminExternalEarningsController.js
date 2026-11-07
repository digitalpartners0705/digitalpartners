const { query } = require('../config/db')

/**
 * External earnings are amounts an affiliate earned somewhere else (an older platform,
 * an offline programme) that the company agreed to show on this platform.
 *
 * They are stored in affiliate_earnings with source = 'external' so the affiliate
 * dashboard and leaderboard count them, but they are NEVER part of the payable balance.
 */
const EXTERNAL_SOURCE = 'external'
const EXTERNAL_INCOME_TYPE = 'external'
const MAX_AMOUNT = 10_000_000
const MAX_PAGE_SIZE = 100

const trimmed = (value) => String(value ?? '').trim()
const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed(value))
const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(trimmed(value))
const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100

const todayInKolkata = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())

const SELECT_SQL = `
  e.id, e.user_id, e.amount, e.earned_at, e.status, e.notes, e.reverse_reason,
  e.reversed_at, e.created_by,
  earner.full_name AS earner_name, earner.email AS earner_email,
  earner.phone AS earner_phone, earner.referral_code AS earner_code,
  earner.knowledge_package AS earner_package,
  admin.full_name AS created_by_name
`

const JOIN_SQL = `
  FROM affiliate_earnings e
  LEFT JOIN users earner ON earner.id = e.user_id
  LEFT JOIN users admin ON admin.id = e.created_by
`

const mapEntry = (row) => ({
  id: row.id,
  amount: Number(row.amount),
  earnedAt: row.earned_at,
  status: row.status || 'credited',
  notes: row.notes || '',
  reverseReason: row.reverse_reason || null,
  reversedAt: row.reversed_at || null,
  earner: {
    id: row.user_id,
    name: row.earner_name || '',
    email: row.earner_email || '',
    phone: row.earner_phone || '',
    referralCode: row.earner_code || '',
    knowledgePackage: row.earner_package || '',
  },
  createdBy: row.created_by ? { id: row.created_by, name: row.created_by_name || '' } : null,
})

const findUser = async (identifier) => {
  const value = trimmed(identifier)
  if (!value) return null
  if (isUuid(value)) {
    const byId = await query(
      `SELECT id, full_name, email, phone, referral_code, role, is_active
       FROM users WHERE id = $1 LIMIT 1`,
      [value],
    )
    return byId.rows[0] || null
  }
  const result = await query(
    `SELECT id, full_name, email, phone, referral_code, role, is_active
     FROM users
     WHERE LOWER(email) = $1 OR referral_code = $2 OR phone = $2
     LIMIT 1`,
    [value.toLowerCase(), value],
  )
  return result.rows[0] || null
}

const searchAffiliates = async (req, res) => {
  try {
    const search = trimmed(req.query.search).toLowerCase()
    if (search.length < 2) return res.json({ users: [] })

    const result = await query(
      `SELECT
         u.id, u.full_name, u.email, u.phone, u.referral_code, u.knowledge_package,
         COALESCE((
           SELECT SUM(e.amount) FROM affiliate_earnings e
           WHERE e.user_id = u.id AND e.status = 'credited' AND e.source = $2
         ), 0) AS external_total
       FROM users u
       WHERE COALESCE(u.role, 'student') <> 'admin'
         AND (
           LOWER(COALESCE(u.full_name, '')) LIKE $1 OR
           LOWER(COALESCE(u.email, '')) LIKE $1 OR
           LOWER(COALESCE(u.phone, '')) LIKE $1 OR
           LOWER(COALESCE(u.referral_code, '')) LIKE $1
         )
       ORDER BY u.full_name ASC
       LIMIT 8`,
      [`%${search}%`, EXTERNAL_SOURCE],
    )

    return res.json({
      users: result.rows.map((row) => ({
        id: row.id,
        name: row.full_name || '',
        email: row.email || '',
        phone: row.phone || '',
        referralCode: row.referral_code || '',
        knowledgePackage: row.knowledge_package || '',
        externalTotal: Number(row.external_total || 0),
      })),
    })
  } catch (error) {
    console.error('Search affiliates error:', error.message)
    return res.status(500).json({ message: 'Could not search affiliates' })
  }
}

const listExternalEarnings = async (req, res) => {
  try {
    const status = trimmed(req.query.status).toLowerCase()
    const search = trimmed(req.query.search).toLowerCase()
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.pageSize, 10) || 25))

    const params = [EXTERNAL_SOURCE]
    const clauses = ['e.source = $1']

    if (status === 'credited' || status === 'reversed') {
      params.push(status)
      clauses.push(`e.status = $${params.length}`)
    }

    if (isUuid(req.query.earnerId)) {
      params.push(trimmed(req.query.earnerId))
      clauses.push(`e.user_id = $${params.length}`)
    }

    if (search) {
      params.push(`%${search}%`)
      const idx = params.length
      clauses.push(`(
        LOWER(COALESCE(earner.full_name, '')) LIKE $${idx} OR
        LOWER(COALESCE(earner.email, '')) LIKE $${idx} OR
        LOWER(COALESCE(earner.phone, '')) LIKE $${idx} OR
        LOWER(COALESCE(earner.referral_code, '')) LIKE $${idx} OR
        LOWER(COALESCE(e.notes, '')) LIKE $${idx}
      )`)
    }

    const where = `WHERE ${clauses.join(' AND ')}`

    const countResult = await query(`SELECT COUNT(*)::int AS count ${JOIN_SQL} ${where}`, params)
    const total = countResult.rows[0]?.count || 0

    const statsResult = await query(
      `SELECT
         COUNT(*)::int AS entries,
         COUNT(*) FILTER (WHERE status = 'credited')::int AS credited_count,
         COUNT(*) FILTER (WHERE status = 'reversed')::int AS reversed_count,
         COALESCE(SUM(amount) FILTER (WHERE status = 'credited'), 0) AS credited,
         COUNT(DISTINCT user_id) FILTER (WHERE status = 'credited')::int AS affiliates
       FROM affiliate_earnings
       WHERE source = $1`,
      [EXTERNAL_SOURCE],
    )
    const stats = statsResult.rows[0] || {}

    params.push(pageSize)
    const limitIdx = params.length
    params.push((page - 1) * pageSize)
    const offsetIdx = params.length

    const rows = await query(
      `SELECT ${SELECT_SQL}
       ${JOIN_SQL}
       ${where}
       ORDER BY e.earned_at DESC, e.id DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params,
    )

    return res.json({
      entries: rows.rows.map(mapEntry),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      stats: {
        entries: stats.entries || 0,
        creditedCount: stats.credited_count || 0,
        reversedCount: stats.reversed_count || 0,
        credited: Number(stats.credited || 0),
        affiliates: stats.affiliates || 0,
      },
    })
  } catch (error) {
    console.error('List external earnings error:', error.message)
    return res.status(500).json({ message: 'Could not load external earnings' })
  }
}

const createExternalEarning = async (req, res) => {
  try {
    const earner = await findUser(req.body.earnerId || req.body.earner || req.body.email)
    if (!earner) {
      return res.status(404).json({ message: 'No affiliate found for that email, phone, or referral code' })
    }
    if (earner.role === 'admin') {
      return res.status(400).json({ message: 'External earnings cannot be added to an admin account' })
    }

    const rawAmount = Number(req.body.amount)
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return res.status(400).json({ message: 'Enter an amount greater than zero' })
    }
    if (rawAmount > MAX_AMOUNT) {
      return res.status(400).json({ message: 'Amount is too large. Split it into smaller entries if needed' })
    }

    const earnedOn = trimmed(req.body.earnedOn || req.body.earnedAt || req.body.date)
    if (!isIsoDate(earnedOn)) {
      return res.status(400).json({ message: 'Choose the date these earnings should count under' })
    }
    if (earnedOn > todayInKolkata()) {
      return res.status(400).json({ message: 'The earnings date cannot be in the future' })
    }

    const notes = trimmed(req.body.notes) || trimmed(req.body.reason)
    if (!notes) {
      return res.status(400).json({ message: 'Add a note, for example which platform these earnings came from' })
    }

    // Noon IST keeps the entry inside the chosen calendar day for every report window.
    const inserted = await query(
      `INSERT INTO affiliate_earnings (
         user_id, buyer_id, amount, package_name, income_type,
         commission_percent, net_amount, country, order_id, status,
         notes, source, created_by, earned_at
       )
       VALUES (
         $1, NULL, $2, NULL, $3,
         NULL, NULL, NULL, NULL, 'credited',
         $4, $5, $6,
         (($7::date + TIME '12:00') AT TIME ZONE 'Asia/Kolkata')
       )
       RETURNING id`,
      [earner.id, roundMoney(rawAmount), EXTERNAL_INCOME_TYPE, notes, EXTERNAL_SOURCE, req.user.id, earnedOn],
    )

    const detail = await query(`SELECT ${SELECT_SQL} ${JOIN_SQL} WHERE e.id = $1`, [inserted.rows[0].id])
    return res.status(201).json({ entry: mapEntry(detail.rows[0]) })
  } catch (error) {
    console.error('Create external earning error:', error.message)
    return res.status(500).json({ message: 'Could not add the external earnings' })
  }
}

/**
 * Entries are never hard-deleted. Removing marks the row reversed so the affiliate
 * stops seeing it while the record stays for audit.
 */
const removeExternalEarning = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) return res.status(404).json({ message: 'Entry not found' })

    const reason = trimmed(req.body?.reason)
    if (!reason) return res.status(400).json({ message: 'Enter a reason for removing this entry' })

    const updated = await query(
      `UPDATE affiliate_earnings
       SET status = 'reversed', reversed_at = NOW(), reverse_reason = $1
       WHERE id = $2 AND source = $3 AND status = 'credited'
       RETURNING id`,
      [reason, req.params.id, EXTERNAL_SOURCE],
    )

    if (!updated.rows[0]) {
      const existing = await query(`SELECT id, status, source FROM affiliate_earnings WHERE id = $1`, [req.params.id])
      const row = existing.rows[0]
      if (!row || row.source !== EXTERNAL_SOURCE) return res.status(404).json({ message: 'Entry not found' })
      return res.status(400).json({ message: 'This entry was already removed' })
    }

    const detail = await query(`SELECT ${SELECT_SQL} ${JOIN_SQL} WHERE e.id = $1`, [req.params.id])
    return res.json({ entry: mapEntry(detail.rows[0]) })
  } catch (error) {
    console.error('Remove external earning error:', error.message)
    return res.status(500).json({ message: 'Could not remove this entry' })
  }
}

module.exports = {
  EXTERNAL_SOURCE,
  EXTERNAL_INCOME_TYPE,
  searchAffiliates,
  listExternalEarnings,
  createExternalEarning,
  removeExternalEarning,
}
