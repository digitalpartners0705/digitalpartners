const { pool, query } = require('../config/db')

const MAX_PAGE_SIZE = 100
const MAX_UPLINE_WALK = 64

const trimmed = (value) => String(value ?? '').trim()
const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed(value))

const mapAffiliate = (row) => {
  if (!row) return null
  return {
    id: row.id,
    name: row.full_name || '',
    email: row.email || '',
    phone: row.phone || '',
    referralCode: row.referral_code || '',
    knowledgePackage: row.knowledge_package || '',
    active: row.is_active !== false,
    referralCount: Number(row.referral_count || 0),
  }
}

const mapChange = (row) => ({
  id: row.id,
  reason: row.reason || '',
  createdAt: row.created_at,
  affiliate: {
    id: row.user_id,
    name: row.user_name || '',
    email: row.user_email || '',
    phone: row.user_phone || '',
    referralCode: row.user_code || '',
  },
  oldReferrer: row.old_referrer_id
    ? {
        id: row.old_referrer_id,
        name: row.old_name || '',
        email: row.old_email || '',
        referralCode: row.old_code || '',
      }
    : null,
  newReferrer: {
    id: row.new_referrer_id,
    name: row.new_name || '',
    email: row.new_email || '',
    referralCode: row.new_code || '',
  },
  createdBy: row.created_by
    ? {
        id: row.created_by,
        name: row.admin_name || '',
      }
    : null,
})

const findAffiliate = async (identifier) => {
  const value = trimmed(identifier)
  if (!value) return null

  if (isUuid(value)) {
    const byId = await query(
      `SELECT
         u.id, u.full_name, u.email, u.phone, u.referral_code, u.knowledge_package,
         u.role, u.is_active, u.referred_by,
         (SELECT COUNT(*)::int FROM users d WHERE d.referred_by = u.id) AS referral_count
       FROM users u
       WHERE u.id = $1
       LIMIT 1`,
      [value],
    )
    return byId.rows[0] || null
  }

  const result = await query(
    `SELECT
       u.id, u.full_name, u.email, u.phone, u.referral_code, u.knowledge_package,
       u.role, u.is_active, u.referred_by,
       (SELECT COUNT(*)::int FROM users d WHERE d.referred_by = u.id) AS referral_count
     FROM users u
     WHERE LOWER(u.email) = $1 OR u.referral_code = $2 OR u.phone = $2
     LIMIT 1`,
    [value.toLowerCase(), value],
  )
  return result.rows[0] || null
}

const loadReferrer = async (id) => {
  if (!id) return null
  const result = await query(
    `SELECT
       u.id, u.full_name, u.email, u.phone, u.referral_code, u.knowledge_package,
       u.role, u.is_active,
       (SELECT COUNT(*)::int FROM users d WHERE d.referred_by = u.id) AS referral_count
     FROM users u
     WHERE u.id = $1
     LIMIT 1`,
    [id],
  )
  return result.rows[0] || null
}

/**
 * Walk up the new referrer's chain. If we hit the affiliate being moved,
 * the new parent sits inside their downline and the change would create a loop.
 */
const wouldCreateCycle = async (affiliateId, newReferrerId) => {
  let currentId = newReferrerId
  const visited = new Set()

  for (let step = 0; step < MAX_UPLINE_WALK && currentId; step += 1) {
    if (currentId === affiliateId) return true
    if (visited.has(currentId)) return true
    visited.add(currentId)

    const result = await query(`SELECT referred_by FROM users WHERE id = $1 LIMIT 1`, [currentId])
    currentId = result.rows[0]?.referred_by || null
  }

  return false
}

const searchAffiliates = async (req, res) => {
  try {
    const search = trimmed(req.query.search).toLowerCase()
    if (search.length < 2) return res.json({ users: [] })

    const excludeId = isUuid(req.query.excludeId) ? trimmed(req.query.excludeId) : null
    const params = [`%${search}%`]
    const clauses = [
      `COALESCE(u.role, 'student') <> 'admin'`,
      `(
        LOWER(COALESCE(u.full_name, '')) LIKE $1 OR
        LOWER(COALESCE(u.email, '')) LIKE $1 OR
        LOWER(COALESCE(u.phone, '')) LIKE $1 OR
        LOWER(COALESCE(u.referral_code, '')) LIKE $1
      )`,
    ]

    if (excludeId) {
      params.push(excludeId)
      clauses.push(`u.id <> $${params.length}`)
    }

    const result = await query(
      `SELECT
         u.id, u.full_name, u.email, u.phone, u.referral_code, u.knowledge_package, u.is_active,
         (SELECT COUNT(*)::int FROM users d WHERE d.referred_by = u.id) AS referral_count
       FROM users u
       WHERE ${clauses.join(' AND ')}
       ORDER BY u.full_name ASC
       LIMIT 8`,
      params,
    )

    return res.json({ users: result.rows.map(mapAffiliate) })
  } catch (error) {
    console.error('Search affiliates for referrer change error:', error.message)
    return res.status(500).json({ message: 'Could not search affiliates' })
  }
}

const getAffiliateReferrer = async (req, res) => {
  try {
    const affiliate = await findAffiliate(req.params.userId || req.query.userId)
    if (!affiliate) return res.status(404).json({ message: 'Affiliate not found' })
    if (affiliate.role === 'admin') {
      return res.status(400).json({ message: 'Admin accounts are not part of the referral chain' })
    }

    const currentReferrer = await loadReferrer(affiliate.referred_by)

    return res.json({
      affiliate: mapAffiliate(affiliate),
      currentReferrer: mapAffiliate(currentReferrer),
    })
  } catch (error) {
    console.error('Get affiliate referrer error:', error.message)
    return res.status(500).json({ message: 'Could not load this affiliate' })
  }
}

const listReferrerChanges = async (req, res) => {
  try {
    const search = trimmed(req.query.search).toLowerCase()
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(req.query.pageSize, 10) || 25))

    const params = []
    const clauses = []

    if (isUuid(req.query.userId)) {
      params.push(trimmed(req.query.userId))
      clauses.push(`c.user_id = $${params.length}`)
    }

    if (search) {
      params.push(`%${search}%`)
      const idx = params.length
      clauses.push(`(
        LOWER(COALESCE(u.full_name, '')) LIKE $${idx} OR
        LOWER(COALESCE(u.email, '')) LIKE $${idx} OR
        LOWER(COALESCE(u.referral_code, '')) LIKE $${idx} OR
        LOWER(COALESCE(old_ref.full_name, '')) LIKE $${idx} OR
        LOWER(COALESCE(old_ref.email, '')) LIKE $${idx} OR
        LOWER(COALESCE(new_ref.full_name, '')) LIKE $${idx} OR
        LOWER(COALESCE(new_ref.email, '')) LIKE $${idx} OR
        LOWER(COALESCE(c.reason, '')) LIKE $${idx}
      )`)
    }

    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
    const joinSql = `
      FROM referrer_changes c
      LEFT JOIN users u ON u.id = c.user_id
      LEFT JOIN users old_ref ON old_ref.id = c.old_referrer_id
      LEFT JOIN users new_ref ON new_ref.id = c.new_referrer_id
      LEFT JOIN users admin ON admin.id = c.created_by
    `

    const countResult = await query(`SELECT COUNT(*)::int AS count ${joinSql} ${where}`, params)
    const total = countResult.rows[0]?.count || 0

    const statsResult = await query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (
           WHERE created_at >= date_trunc('day', NOW() AT TIME ZONE 'Asia/Kolkata')
             AT TIME ZONE 'Asia/Kolkata'
         )::int AS today
       FROM referrer_changes`,
    )
    const stats = statsResult.rows[0] || { total: 0, today: 0 }

    params.push(pageSize)
    const limitIdx = params.length
    params.push((page - 1) * pageSize)
    const offsetIdx = params.length

    const rows = await query(
      `SELECT
         c.id, c.user_id, c.old_referrer_id, c.new_referrer_id, c.reason, c.created_by, c.created_at,
         u.full_name AS user_name, u.email AS user_email, u.phone AS user_phone, u.referral_code AS user_code,
         old_ref.full_name AS old_name, old_ref.email AS old_email, old_ref.referral_code AS old_code,
         new_ref.full_name AS new_name, new_ref.email AS new_email, new_ref.referral_code AS new_code,
         admin.full_name AS admin_name
       ${joinSql}
       ${where}
       ORDER BY c.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params,
    )

    return res.json({
      changes: rows.rows.map(mapChange),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      stats: {
        total: stats.total || 0,
        today: stats.today || 0,
      },
    })
  } catch (error) {
    console.error('List referrer changes error:', error.message)
    return res.status(500).json({ message: 'Could not load referrer change history' })
  }
}

const changeReferrer = async (req, res) => {
  const client = await pool.connect()

  try {
    const reason = trimmed(req.body.reason) || trimmed(req.body.notes)
    if (!reason) {
      return res.status(400).json({ message: 'Enter a reason for changing the referrer' })
    }

    const affiliate = await findAffiliate(req.body.userId || req.body.affiliateId || req.body.affiliate)
    if (!affiliate) return res.status(404).json({ message: 'Affiliate not found' })
    if (affiliate.role === 'admin') {
      return res.status(400).json({ message: 'Admin accounts are not part of the referral chain' })
    }

    const newReferrer = await findAffiliate(
      req.body.newReferrerId || req.body.newReferrer || req.body.referrer,
    )
    if (!newReferrer) {
      return res.status(404).json({ message: 'New referrer not found' })
    }
    if (newReferrer.role === 'admin') {
      return res.status(400).json({ message: 'An admin account cannot be set as a referrer' })
    }
    if (newReferrer.is_active === false) {
      return res.status(400).json({ message: 'The new referrer account is disabled' })
    }
    if (newReferrer.id === affiliate.id) {
      return res.status(400).json({ message: 'An affiliate cannot be their own referrer' })
    }
    if (affiliate.referred_by && affiliate.referred_by === newReferrer.id) {
      return res.status(400).json({ message: 'That person is already the current referrer' })
    }

    if (await wouldCreateCycle(affiliate.id, newReferrer.id)) {
      return res.status(400).json({
        message:
          'That change would create a loop in the referral chain. The new referrer cannot be inside this affiliate\'s downline.',
      })
    }

    const oldReferrer = await loadReferrer(affiliate.referred_by)

    await client.query('BEGIN')

    const updated = await client.query(
      `UPDATE users
       SET referred_by = $1
       WHERE id = $2
       RETURNING id, referred_by`,
      [newReferrer.id, affiliate.id],
    )
    if (!updated.rows[0]) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Affiliate not found' })
    }

    const audit = await client.query(
      `INSERT INTO referrer_changes (user_id, old_referrer_id, new_referrer_id, reason, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, created_at`,
      [affiliate.id, oldReferrer?.id || null, newReferrer.id, reason, req.user.id],
    )

    await client.query('COMMIT')

    return res.json({
      message: 'Referrer updated. Past commissions stay with the old referrer; future sales follow the new chain.',
      change: {
        id: audit.rows[0].id,
        createdAt: audit.rows[0].created_at,
        reason,
        affiliate: mapAffiliate(affiliate),
        oldReferrer: mapAffiliate(oldReferrer),
        newReferrer: mapAffiliate(newReferrer),
      },
    })
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch {
      // Transaction already closed.
    }
    console.error('Change referrer error:', error.message)
    return res.status(500).json({ message: 'Could not change the referrer' })
  } finally {
    client.release()
  }
}

module.exports = {
  searchAffiliates,
  getAffiliateReferrer,
  listReferrerChanges,
  changeReferrer,
}
