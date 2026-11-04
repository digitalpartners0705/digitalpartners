const { query } = require('../config/db')

const isUuid = (val) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(val || '').trim())

const mapAffiliate = (row) => ({
  id: row.id,
  fullName: row.full_name || '',
  email: row.email || '',
  phone: row.phone || '',
  referralCode: row.referral_code || '',
  knowledgePackage: row.knowledge_package || '',
  hidden: Boolean(row.leaderboard_hidden),
  totalEarned: Number(row.total_earned || 0),
  createdAt: row.created_at,
})

const listLeaderboardVisibility = async (req, res) => {
  try {
    const search = String(req.query.search || '').trim().toLowerCase()
    const visibility = String(req.query.visibility || 'all').trim().toLowerCase()
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

    if (visibility === 'hidden') {
      clauses.push(`u.leaderboard_hidden = TRUE`)
    } else if (visibility === 'visible') {
      clauses.push(`COALESCE(u.leaderboard_hidden, FALSE) = FALSE`)
    }

    const whereClause = `WHERE ${clauses.join(' AND ')}`

    const countResult = await query(
      `SELECT COUNT(*)::int AS count FROM users u ${whereClause}`,
      params,
    )
    const total = countResult.rows[0]?.count || 0

    const statsResult = await query(
      `SELECT
         COUNT(*) FILTER (WHERE COALESCE(leaderboard_hidden, FALSE) = FALSE)::int AS visible,
         COUNT(*) FILTER (WHERE leaderboard_hidden = TRUE)::int AS hidden
       FROM users
       WHERE COALESCE(role, 'student') <> 'admin'`,
    )
    const stats = statsResult.rows[0] || { visible: 0, hidden: 0 }

    params.push(pageSize)
    const limitIdx = params.length
    params.push((page - 1) * pageSize)
    const offsetIdx = params.length

    const result = await query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.phone,
         u.referral_code,
         u.knowledge_package,
         u.leaderboard_hidden,
         u.created_at,
         COALESCE((
           SELECT SUM(e.amount)::NUMERIC
           FROM affiliate_earnings e
           WHERE e.user_id = u.id AND e.status = 'credited'
         ), 0) AS total_earned
       FROM users u
       ${whereClause}
       ORDER BY u.leaderboard_hidden DESC, total_earned DESC, u.full_name ASC
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params,
    )

    return res.json({
      affiliates: result.rows.map(mapAffiliate),
      total,
      page,
      pageSize,
      stats: {
        visible: stats.visible || 0,
        hidden: stats.hidden || 0,
      },
    })
  } catch (error) {
    console.error('List leaderboard visibility error:', error.message)
    return res.status(500).json({ message: 'Could not load leaderboard visibility' })
  }
}

const updateLeaderboardVisibility = async (req, res) => {
  try {
    const userId = String(req.params.userId || '').trim()
    if (!isUuid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' })
    }

    if (typeof req.body.hidden !== 'boolean') {
      return res.status(400).json({ message: 'Send hidden as true or false' })
    }

    const result = await query(
      `UPDATE users
       SET leaderboard_hidden = $1
       WHERE id = $2 AND COALESCE(role, 'student') <> 'admin'
       RETURNING
         id,
         full_name,
         email,
         phone,
         referral_code,
         knowledge_package,
         leaderboard_hidden,
         created_at`,
      [req.body.hidden, userId],
    )

    const row = result.rows[0]
    if (!row) {
      return res.status(404).json({ message: 'Affiliate not found' })
    }

    const earnedResult = await query(
      `SELECT COALESCE(SUM(amount), 0)::NUMERIC AS total_earned
       FROM affiliate_earnings
       WHERE user_id = $1 AND status = 'credited'`,
      [userId],
    )

    return res.json({
      affiliate: mapAffiliate({
        ...row,
        total_earned: earnedResult.rows[0]?.total_earned || 0,
      }),
    })
  } catch (error) {
    console.error('Update leaderboard visibility error:', error.message)
    return res.status(500).json({ message: 'Could not update leaderboard visibility' })
  }
}

module.exports = {
  listLeaderboardVisibility,
  updateLeaderboardVisibility,
}
