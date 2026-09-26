import { useEffect, useState } from 'react'
import { getLeaderboard } from '../../services/api'

const BOARDS = [
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'overall', label: 'Overall' },
]

function formatDay(iso) {
  if (!iso) return ''
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function formatMoney(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)
}

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function rangeLabel(window) {
  if (!window?.from) return 'All recorded earnings'
  return `${formatDay(window.from)} – ${formatDay(window.to)}`
}

function rankTone(rank) {
  if (rank === 1) return 'bg-amber-300 text-slate-900'
  if (rank === 2) return 'bg-slate-200 text-slate-900'
  if (rank === 3) return 'bg-orange-300 text-slate-900'
  return 'bg-[#10131c] text-slate-200 ring-1 ring-teal-200/50'
}

function Board({ label, window, rows }) {
  return (
    <section>
      <div className="text-center">
        <span className="inline-flex rounded-full bg-teal-300 px-5 py-1.5 text-sm font-semibold text-slate-900">{label}</span>
        <p className="mt-2 text-xs text-slate-500">{rangeLabel(window)}</p>
      </div>
      {rows.length === 0 ? (
        <p className="mt-5 rounded-xl border border-dashed border-teal-200/20 px-4 py-12 text-center text-sm text-slate-400">
          No earnings in this window yet.
        </p>
      ) : (
        <ol className="mt-5 space-y-3 pl-3">
          {rows.map((row) => (
            <li
              key={`${label}-${row.rank}`}
              className={`relative flex items-center gap-3 rounded-xl border bg-[#151a28] py-2.5 pl-5 pr-3 ${
                row.you || row.rank <= 3 ? 'border-teal-300/55' : 'border-teal-200/25'
              }`}
            >
              <span className={`absolute -left-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-xs font-bold ${rankTone(row.rank)}`}>
                {row.rank}
              </span>
              {row.avatarUrl ? (
                <img src={row.avatarUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white/15" />
              ) : (
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white ring-2 ring-white/15">
                  {initials(row.name)}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{row.name}</p>
                {row.you ? <p className="text-[11px] font-medium text-teal-300">You</p> : null}
              </div>
              <p className="shrink-0 text-sm font-semibold text-teal-100">{formatMoney(row.amount)}</p>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function AffiliateLeaderboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getLeaderboard()
      .then((payload) => {
        if (active) setData(payload)
      })
      .catch(() => {
        if (active) setError('Could not load the leaderboard.')
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="-mx-4 -my-8 min-h-[calc(100vh-4.25rem)] bg-[#10131c] px-4 py-8 text-slate-100 sm:-mx-8 sm:px-8">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Leaderboard</h1>
      <p className="mt-2 text-sm text-slate-400">Top 10 by commission. The dates under each board are the rolling window.</p>
      <div className="mt-6 h-px bg-gradient-to-r from-transparent via-teal-300/70 to-transparent" />

      {error ? <p className="mt-8 text-sm text-rose-300">{error}</p> : null}
      {!data && !error ? <p className="mt-8 text-sm text-slate-500">Loading ranks…</p> : null}

      {data ? (
        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {BOARDS.map((board) => (
            <Board key={board.key} label={board.label} window={data.windows[board.key]} rows={data[board.key]} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default AffiliateLeaderboard
