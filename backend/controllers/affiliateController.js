const { people, earnings } = require('../data/leaderboardTest')
const { leaderboardWindows, partsOf, addDays, toIso } = require('../services/leaderboardWindow')
const { PACKAGE_NAMES, activeCommissionFor } = require('../data/commissions')
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
      const commission = activeCommissionFor(name)
      return {
        id: commission.packageId,
        name,
        listedPrice: commission.listedPrice,
        netAmount: commission.netAmount,
        activePercent: commission.commissionPercent,
        activeAmount: commission.amount,
      }
    })

    return res.json({
      referralCode,
      incomeType: 'active',
      packages,
    })
  } catch (error) {
    console.error('Link kit error:', error.message)
    return res.status(500).json({ message: 'Could not load referral links' })
  }
}

module.exports = { leaderboard, linkKit }
