const { people, earnings } = require('../data/leaderboardTest')
const { leaderboardWindows, partsOf, addDays, toIso } = require('../services/leaderboardWindow')
const { INCOME_LEVELS, PACKAGE_NAMES, commissionPlanFor } = require('../data/commissions')
const { query } = require('../config/db')

const peopleById = new Map(people.map((person) => [person.id, person]))

const inWindow = (iso, window) => {
  if (iso > window.to) return false
  if (!window.from) return true
  return iso >= window.from
}

const rankBoard = (window, today) => {
  const totals = new Map()

  earnings.forEach((entry) => {
    const iso = toIso(addDays(today, -entry.daysAgo))
    if (!inWindow(iso, window)) return
    const person = peopleById.get(entry.personId)
    if (!person) return
    const current = totals.get(entry.personId) || { name: person.name, avatarUrl: person.avatar, amount: 0 }
    current.amount += entry.amount
    totals.set(entry.personId, current)
  })

  return [...totals.values()]
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name))
    .slice(0, 10)
    .map((row, index) => ({
      rank: index + 1,
      name: row.name,
      amount: row.amount,
      avatarUrl: row.avatarUrl || null,
      you: false,
    }))
}

const leaderboard = async (req, res) => {
  try {
    const now = new Date()
    const windows = leaderboardWindows(now)
    const today = partsOf(now)

    return res.json({
      windows,
      weekly: rankBoard(windows.weekly, today),
      monthly: rankBoard(windows.monthly, today),
      overall: rankBoard(windows.overall, today),
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
       WHERE e.user_id = $1
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
         ON e.buyer_id = u.id AND e.user_id = $1
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

module.exports = { leaderboard, linkKit, myEarnings, myLeads }
