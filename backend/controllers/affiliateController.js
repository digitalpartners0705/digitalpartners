const { people, earnings } = require('../data/leaderboardTest')
const { leaderboardWindows, partsOf, addDays, toIso } = require('../services/leaderboardWindow')

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

module.exports = { leaderboard }
