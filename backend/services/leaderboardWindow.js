const ZONE = 'Asia/Kolkata'

const partsOf = (date) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const read = (type) => Number(parts.find((part) => part.type === type).value)
  return { year: read('year'), month: read('month'), day: read('day') }
}

const toIso = ({ year, month, day }) =>
  `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

const addDays = (date, days) => {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day))
  utc.setUTCDate(utc.getUTCDate() + days)
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() }
}

const addMonths = (date, months) => {
  const index = date.month - 1 + months
  const first = new Date(Date.UTC(date.year, index, 1))
  const year = first.getUTCFullYear()
  const month = first.getUTCMonth() + 1
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return { year, month, day: Math.min(date.day, lastDay) }
}

const leaderboardWindows = (now = new Date()) => {
  const today = partsOf(now)
  const to = toIso(today)
  return {
    weekly: { from: toIso(addDays(today, -7)), to },
    monthly: { from: toIso(addMonths(today, -1)), to },
    overall: { from: null, to },
  }
}

module.exports = { leaderboardWindows, addMonths, addDays, partsOf, toIso }
