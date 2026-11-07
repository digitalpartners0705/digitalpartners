const { query } = require('../config/db')

const isUuid = (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(value || '').trim())

const mapUser = (row) => ({
  id: row.id,
  fullName: row.full_name || '',
  email: row.email || '',
  phone: row.phone || '',
  country: row.country || '',
  state: row.state || '',
  knowledgePackage: row.knowledge_package || '',
  referralCode: row.referral_code || '',
  active: row.is_active !== false,
  disabledAt: row.disabled_at || null,
  orderCount: Number(row.order_count || 0),
  referralCount: Number(row.referral_count || 0),
  earningsTotal: Number(row.earnings_total || 0),
  createdAt: row.created_at,
})

const listUsers = async (req, res) => {
  try {
    const search = String(req.query.search || '').trim().toLowerCase()
    const status = String(req.query.status || 'all').trim().toLowerCase()
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize, 10) || 20))

    const params = []
    const clauses = [`COALESCE(u.role, 'student') <> 'admin'`]

    if (search) {
      params.push(`%${search}%`)
      const idx = params.length
      clauses.push(`(
        LOWER(COALESCE(u.full_name, '')) LIKE $${idx} OR
        LOWER(COALESCE(u.email, '')) LIKE $${idx} OR
        LOWER(COALESCE(u.phone, '')) LIKE $${idx} OR
        LOWER(COALESCE(u.referral_code, '')) LIKE $${idx}
      )`)
    }

    if (status === 'active') {
      clauses.push(`COALESCE(u.is_active, TRUE) = TRUE`)
    } else if (status === 'disabled') {
      clauses.push(`u.is_active = FALSE`)
    }

    const whereClause = `WHERE ${clauses.join(' AND ')}`

    const countResult = await query(`SELECT COUNT(*)::int AS count FROM users u ${whereClause}`, params)
    const total = countResult.rows[0]?.count || 0

    const statsResult = await query(
      `SELECT
         COUNT(*)::int AS total,
         COUNT(*) FILTER (WHERE COALESCE(is_active, TRUE) = TRUE)::int AS active,
         COUNT(*) FILTER (WHERE is_active = FALSE)::int AS disabled,
         COUNT(*) FILTER (
           WHERE NULLIF(TRIM(COALESCE(knowledge_package, '')), '') IS NOT NULL
         )::int AS with_package
       FROM users
       WHERE COALESCE(role, 'student') <> 'admin'`,
    )
    const statsRow = statsResult.rows[0] || { total: 0, active: 0, disabled: 0, with_package: 0 }

    const listParams = [...params, pageSize, (page - 1) * pageSize]
    const limitIdx = params.length + 1
    const offsetIdx = params.length + 2

    const result = await query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.phone,
         u.country,
         u.state,
         u.knowledge_package,
         u.referral_code,
         u.is_active,
         u.disabled_at,
         u.created_at,
         (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = u.id) AS order_count,
         (SELECT COUNT(*)::int FROM users d WHERE d.referred_by = u.id) AS referral_count,
         COALESCE((
           SELECT SUM(e.amount)
           FROM affiliate_earnings e
           WHERE e.user_id = u.id
         ), 0) AS earnings_total
       FROM users u
       ${whereClause}
       ORDER BY u.created_at DESC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      listParams,
    )

    return res.json({
      users: result.rows.map(mapUser),
      stats: {
        total: statsRow.total || 0,
        active: statsRow.active || 0,
        disabled: statsRow.disabled || 0,
        withPackage: statsRow.with_package || 0,
      },
      total,
      page,
      pageSize,
    })
  } catch (error) {
    console.error('List users error:', error.message)
    return res.status(500).json({ message: 'Could not load accounts' })
  }
}

const updateUserStatus = async (req, res) => {
  try {
    const userId = String(req.params.id || '').trim()
    if (!isUuid(userId)) return res.status(400).json({ message: 'Account not found' })
    if (userId === req.user?.id) {
      return res.status(400).json({ message: 'You cannot disable the account you are signed in with' })
    }

    const active = Boolean(req.body?.active)
    const found = await query(
      `SELECT id, full_name, email, role, is_active, disabled_at, created_at,
              knowledge_package, referral_code, phone, country, state
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [userId],
    )
    const user = found.rows[0]
    if (!user) return res.status(404).json({ message: 'Account not found' })
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Admin accounts cannot be changed from this page' })
    }

    const alreadyActive = user.is_active !== false
    if (alreadyActive === active) {
      return res.json({
        message: active ? 'Account is already active' : 'Account is already disabled',
        user: mapUser({
          ...user,
          order_count: 0,
          referral_count: 0,
          earnings_total: 0,
        }),
      })
    }

    const result = await query(
      `UPDATE users
       SET is_active = $1,
           disabled_at = CASE WHEN $1 THEN NULL ELSE NOW() END
       WHERE id = $2
       RETURNING id, full_name, email, phone, country, state, knowledge_package,
                 referral_code, is_active, disabled_at, created_at`,
      [active, userId],
    )
    const updated = result.rows[0]

    return res.json({
      message: active ? 'Account re-enabled' : 'Account disabled',
      user: mapUser({
        ...updated,
        order_count: 0,
        referral_count: 0,
        earnings_total: 0,
      }),
    })
  } catch (error) {
    console.error('Update user status error:', error.message)
    return res.status(500).json({ message: 'Could not update this account' })
  }
}

module.exports = { listUsers, updateUserStatus }
