const { leaderboardWindows } = require('../services/leaderboardWindow')
const { INCOME_LEVELS, PACKAGE_NAMES, commissionPlanFor } = require('../data/commissions')
const { query } = require('../config/db')
const storage = require('../services/storage')

const rankBoard = async (window, viewerId) => {
  const params = []
  const filters = [`e.status = 'credited'`]

  if (window.from) {
    params.push(window.from)
    filters.push(`(e.earned_at AT TIME ZONE 'Asia/Kolkata')::date >= $${params.length}::date`)
  }
  if (window.to) {
    params.push(window.to)
    filters.push(`(e.earned_at AT TIME ZONE 'Asia/Kolkata')::date <= $${params.length}::date`)
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
  const result = await query(
    `SELECT
       e.user_id,
       u.full_name,
       u.avatar_key,
       SUM(e.amount)::NUMERIC AS amount
     FROM affiliate_earnings e
     JOIN users u ON u.id = e.user_id
     ${where}
     GROUP BY e.user_id, u.full_name, u.avatar_key
     HAVING SUM(e.amount) > 0
     ORDER BY amount DESC, u.full_name ASC
     LIMIT 10`,
    params,
  )

  const rows = []
  for (let index = 0; index < result.rows.length; index += 1) {
    const row = result.rows[index]
    rows.push({
      rank: index + 1,
      name: row.full_name,
      amount: Number(row.amount),
      avatarUrl: await storage.signedGet(row.avatar_key),
      you: row.user_id === viewerId,
    })
  }
  return rows
}

const leaderboard = async (req, res) => {
  try {
    const windows = leaderboardWindows(new Date())
    const viewerId = req.user.id

    const [weekly, monthly, overall] = await Promise.all([
      rankBoard(windows.weekly, viewerId),
      rankBoard(windows.monthly, viewerId),
      rankBoard(windows.overall, viewerId),
    ])

    return res.json({
      windows,
      weekly,
      monthly,
      overall,
    })
  } catch (error) {
    console.error('Leaderboard error:', error.message)
    return res.status(500).json({ message: 'Could not load the leaderboard' })
  }
}

const linkKit = async (req, res) => {
  try {
    const result = await query(
      `SELECT referral_code FROM users WHERE id = $1`,
      [req.user.id],
    )
    const referralCode = result.rows[0]?.referral_code
    if (!referralCode) {
      return res.status(404).json({ message: 'Referral code not found' })
    }

    const packages = PACKAGE_NAMES.map((name) => {
      const plan = commissionPlanFor(name)
      return {
        id: plan.packageId,
        name,
        listedPrice: plan.listedPrice,
        netAmount: plan.netAmount,
        levels: plan.levels.map((level) => ({
          level: level.level,
          incomeType: level.incomeType,
          percent: level.commissionPercent,
          amount: level.amount,
        })),
      }
    })

    return res.json({
      referralCode,
      packages,
    })
  } catch (error) {
    console.error('Link kit error:', error.message)
    return res.status(500).json({ message: 'Could not load referral links' })
  }
}

const sumAmount = (rows) => rows.reduce((total, row) => total + Number(row.amount || 0), 0)

const myEarnings = async (req, res) => {
  try {
    const result = await query(
      `SELECT
         e.id,
         e.amount,
         e.package_name,
         e.income_type,
         e.commission_percent,
         e.net_amount,
         e.country,
         e.earned_at,
         u.full_name AS buyer_name,
         u.state AS buyer_state
       FROM affiliate_earnings e
       LEFT JOIN users u ON u.id = e.buyer_id
       WHERE e.user_id = $1 AND e.status = 'credited'
       ORDER BY e.earned_at DESC`,
      [req.user.id],
    )

    const rows = result.rows
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const sevenDaysAgo = new Date(startOfToday)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const thirtyDaysAgo = new Date(startOfToday)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

    const inRange = (row, from) => {
      const earnedAt = new Date(row.earned_at)
      return earnedAt >= from
    }

    const todayRows = rows.filter((row) => inRange(row, startOfToday))
    const weekRows = rows.filter((row) => inRange(row, sevenDaysAgo))
    const monthRows = rows.filter((row) => inRange(row, thirtyDaysAgo))

    const packageTotals = PACKAGE_NAMES.map((name) => {
      const matched = rows.filter((row) => row.package_name === name)
      return {
        name,
        sales: matched.length,
        amount: sumAmount(matched),
      }
    })
    const totalPackageAmount = packageTotals.reduce((total, item) => total + item.amount, 0)

    const stateMap = new Map()
    rows.forEach((row) => {
      const state = row.buyer_state || row.country || 'Unknown'
      const current = stateMap.get(state) || { name: state, sales: 0, amount: 0 }
      current.sales += 1
      current.amount += Number(row.amount || 0)
      stateMap.set(state, current)
    })
    const byState = [...stateMap.values()].sort((a, b) => b.sales - a.sales || b.amount - a.amount)

    const byIncomeType = INCOME_LEVELS.map((config) => {
      const matched = rows.filter((row) => row.income_type === config.incomeType)
      return {
        incomeType: config.incomeType,
        level: config.level,
        label: config.label,
        sales: matched.length,
        amount: sumAmount(matched),
      }
    })

    return res.json({
      totals: {
        today: sumAmount(todayRows),
        last7Days: sumAmount(weekRows),
        last30Days: sumAmount(monthRows),
        allTime: sumAmount(rows),
        commissionCount: rows.length,
      },
      byIncomeType,
      packages: packageTotals.map((item) => ({
        ...item,
        share: totalPackageAmount ? Math.round((item.amount / totalPackageAmount) * 100) : 0,
      })),
      byState,
      recent: rows.slice(0, 20).map((row) => ({
        id: row.id,
        amount: Number(row.amount),
        packageName: row.package_name,
        incomeType: row.income_type,
        commissionPercent: row.commission_percent != null ? Number(row.commission_percent) : null,
        netAmount: row.net_amount != null ? Number(row.net_amount) : null,
        country: row.country,
        buyerName: row.buyer_name,
        buyerState: row.buyer_state,
        earnedAt: row.earned_at,
      })),
      commissions: rows.map((row) => ({
        id: row.id,
        amount: Number(row.amount),
        packageName: row.package_name,
        incomeType: row.income_type,
        commissionPercent: row.commission_percent != null ? Number(row.commission_percent) : null,
        netAmount: row.net_amount != null ? Number(row.net_amount) : null,
        country: row.country,
        buyerName: row.buyer_name,
        buyerState: row.buyer_state,
        earnedAt: row.earned_at,
      })),
    })
  } catch (error) {
    console.error('Earnings error:', error.message)
    return res.status(500).json({ message: 'Could not load earnings' })
  }
}

const LEAD_TYPE_LABEL = {
  joining: 'Joining Link',
  package: 'Package Link',
}

const myLeads = async (req, res) => {
  try {
    const result = await query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.phone,
         u.country,
         u.state,
         u.knowledge_package,
         u.referral_source,
         u.created_at,
         COALESCE(SUM(e.amount), 0) AS earned_from_lead
       FROM users u
       LEFT JOIN affiliate_earnings e
         ON e.buyer_id = u.id AND e.user_id = $1 AND e.status = 'credited'
       WHERE u.referred_by = $1
       GROUP BY u.id
       ORDER BY u.created_at DESC`,
      [req.user.id],
    )

    const leads = result.rows.map((row) => ({
      id: row.id,
      name: row.full_name,
      email: row.email,
      phone: row.phone,
      country: row.country,
      state: row.state,
      packageName: row.knowledge_package,
      type: row.referral_source || 'joining',
      typeLabel: LEAD_TYPE_LABEL[row.referral_source] || LEAD_TYPE_LABEL.joining,
      earned: Number(row.earned_from_lead || 0),
      createdAt: row.created_at,
    }))

    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thirtyDaysAgo = new Date(startOfToday)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)

    return res.json({
      totals: {
        allTime: leads.length,
        today: leads.filter((lead) => new Date(lead.createdAt) >= startOfToday).length,
        last30Days: leads.filter((lead) => new Date(lead.createdAt) >= thirtyDaysAgo).length,
        converted: leads.filter((lead) => lead.packageName).length,
      },
      leads,
    })
  } catch (error) {
    console.error('Leads error:', error.message)
    return res.status(500).json({ message: 'Could not load your leads' })
  }
}

const myRefInfo = async (req, res) => {
  try {
    const result = await query(
      `SELECT
         u.id,
         u.full_name,
         u.email,
         u.phone,
         u.country,
         u.knowledge_package,
         u.created_at
       FROM users u
       WHERE u.referred_by = $1
       ORDER BY u.created_at DESC`,
      [req.user.id],
    )

    const referrals = result.rows.map((row) => ({
      id: row.id,
      name: row.full_name,
      phone: row.phone || '—',
      email: row.email,
      date: row.created_at,
      country: row.country || '—',
      package: row.knowledge_package || '—',
    }))

    // Payout transfer flow is not built yet — return an empty live list
    // so the UI never falls back to sample rows.
    return res.json({
      packages: PACKAGE_NAMES,
      referrals,
      payouts: [],
    })
  } catch (error) {
    console.error('Ref info error:', error.message)
    return res.status(500).json({ message: 'Could not load referral info' })
  }
}

module.exports = { leaderboard, linkKit, myEarnings, myLeads, myRefInfo }
