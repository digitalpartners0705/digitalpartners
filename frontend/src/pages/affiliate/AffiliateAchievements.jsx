import { useEffect, useMemo, useState } from 'react'
import { getAffiliateEarnings } from '../../services/api'

// Milestone targets are the plan rules — progress comes from live earnings.
const MILESTONES = [
  { id: 'first', title: 'First referral', amount: 5000, note: 'Your first solid commission from a paid signup.' },
  { id: 'ten', title: 'Working partner', amount: 10000, note: 'Commission crossed the first serious mark.' },
  { id: 'twentyfive', title: 'Steady month', amount: 25000, note: 'A full stretch of referrals, not a single sale.' },
  { id: 'fifty', title: 'Proven closer', amount: 50000, note: 'Enough commission to show a repeat habit.' },
  { id: 'lakh', title: 'One lakh', amount: 100000, note: 'A six-figure commission total.' },
  { id: 'two', title: 'Pace setter', amount: 200000, note: 'The highest mark on this board for now.' },
]

function formatMoney(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

function statusOf(earned, amount) {
  if (earned >= amount) return 'unlocked'
  const next = MILESTONES.find((item) => item.amount > earned)
  if (next && next.amount === amount) return 'current'
  return 'locked'
}

function AffiliateAchievements() {
  const [openId, setOpenId] = useState(null)
  const [earned, setEarned] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    getAffiliateEarnings()
      .then((payload) => {
        if (!active) return
        setEarned(Number(payload?.totals?.allTime || 0))
        setError('')
      })
      .catch((err) => {
        if (!active) return
        setError(err.response?.data?.message || 'Could not load achievements')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const current = useMemo(() => {
    return MILESTONES.find((item) => statusOf(earned, item.amount) === 'current') || MILESTONES[MILESTONES.length - 1]
  }, [earned])

  const unlockedCount = useMemo(
    () => MILESTONES.filter((item) => statusOf(earned, item.amount) === 'unlocked').length,
    [earned],
  )

  const previousAmount = [...MILESTONES].reverse().find((item) => item.amount < current.amount)?.amount || 0
  const span = Math.max(current.amount - previousAmount, 1)
  const progressed = Math.min(Math.max(earned - previousAmount, 0), span)
  const allDone = earned >= MILESTONES[MILESTONES.length - 1].amount
  const percent = allDone ? 100 : Math.round((progressed / span) * 100)
  const selected = MILESTONES.find((item) => item.id === openId)

  return (
    <div className="-mx-4 -my-8 min-h-[calc(100vh-4.25rem)] bg-[#10131c] px-4 py-8 text-slate-100 sm:-mx-8 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200/70">Milestones</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Achievements</h1>
          <p className="mt-1.5 max-w-xl text-sm text-slate-400">
            Unlocks from your live commission total. The next one stays in front until you clear it.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#171b27] px-4 py-3 text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">All-time earned</p>
          <p className="mt-1 text-xl font-extrabold text-teal-300">{loading ? '…' : formatMoney(earned)}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {unlockedCount} of {MILESTONES.length} unlocked
          </p>
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>
      ) : null}

      <ol className="relative mt-8 grid grid-cols-3 gap-4 sm:grid-cols-6">
        <div className="pointer-events-none absolute left-[8%] right-[8%] top-4 hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent sm:block" />
        {MILESTONES.map((item) => {
          const status = statusOf(earned, item.amount)
          const done = status === 'unlocked'
          return (
            <li key={item.id} className="relative text-center">
              <span
                className={`relative z-10 mx-auto flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition ${
                  done
                    ? 'bg-teal-300 text-slate-900 shadow-md shadow-teal-900/30'
                    : status === 'current'
                      ? 'bg-white text-slate-900 ring-2 ring-teal-300/50'
                      : 'bg-[#171b27] text-slate-500 ring-1 ring-white/10'
                }`}
              >
                {done ? '✓' : status === 'current' ? '→' : item.id === 'first' ? '1' : ''}
              </span>
              <p
                className={`mt-2.5 text-[11px] font-medium leading-4 ${
                  done || status === 'current' ? 'text-slate-200' : 'text-slate-500'
                }`}
              >
                {item.title}
              </p>
            </li>
          )
        })}
      </ol>

      <section className="relative mt-8 overflow-hidden rounded-2xl border border-white/10 bg-[#171b27]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-teal-400/12 to-transparent" />
        <div className="relative grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200/80">
              {allDone ? 'All clear' : 'Next milestone'}
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{current.title}</h2>
            <p className="mt-2 text-sm text-slate-400">
              {loading
                ? 'Loading your progress…'
                : allDone
                  ? `${formatMoney(earned)} recorded. Every milestone on this board is unlocked.`
                  : `${formatMoney(earned)} recorded. ${formatMoney(Math.max(current.amount - earned, 0))} still to go.`}
            </p>
            <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-300 transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {formatMoney(previousAmount)} to {formatMoney(current.amount)}
            </p>
          </div>
          <div className="rounded-2xl bg-[#10131c] px-5 py-6 text-center ring-1 ring-white/10">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Target</p>
            <p className="mt-2 text-3xl font-extrabold text-white">{formatMoney(current.amount)}</p>
            <p className="mt-2 text-sm font-semibold text-teal-200">{percent}% of this step</p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MILESTONES.map((item) => {
          const status = statusOf(earned, item.amount)
          const unlocked = status === 'unlocked'
          const currentStep = status === 'current'
          return (
            <article
              key={item.id}
              className={`flex flex-col rounded-2xl border p-5 transition ${
                unlocked
                  ? 'border-teal-300/35 bg-[#171b27]'
                  : currentStep
                    ? 'border-white/20 bg-[#171b27] ring-1 ring-teal-300/20'
                    : 'border-white/10 bg-[#141824] text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.14em] ${
                    unlocked ? 'text-teal-300' : currentStep ? 'text-slate-300' : 'text-slate-500'
                  }`}
                >
                  {unlocked ? 'Unlocked' : currentStep ? 'In progress' : 'Locked'}
                </p>
                {unlocked ? null : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path strokeLinecap="round" d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                )}
              </div>
              <h2 className={`mt-4 text-lg font-bold ${unlocked || currentStep ? 'text-white' : ''}`}>{item.title}</h2>
              <p className={`mt-2 text-2xl font-extrabold ${unlocked ? 'text-teal-100' : currentStep ? 'text-white' : ''}`}>
                {formatMoney(item.amount)}
              </p>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-400">
                {unlocked || currentStep ? item.note : 'Opens after the earlier milestones.'}
              </p>
              {unlocked ? (
                <button
                  type="button"
                  onClick={() => setOpenId(item.id)}
                  className="mt-5 w-fit cursor-pointer rounded-full bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-teal-200"
                >
                  View
                </button>
              ) : null}
            </article>
          )
        })}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => setOpenId(null)}>
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#171b27] p-6 text-slate-100 shadow-xl shadow-black/40"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="achievement-title"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Unlocked</p>
            <h2 id="achievement-title" className="mt-2 text-2xl font-extrabold">{selected.title}</h2>
            <p className="mt-3 text-3xl font-extrabold text-white">{formatMoney(selected.amount)}</p>
            <p className="mt-3 text-sm leading-6 text-slate-400">{selected.note}</p>
            <button
              type="button"
              onClick={() => setOpenId(null)}
              className="mt-6 cursor-pointer rounded-full bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-teal-200"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default AffiliateAchievements
