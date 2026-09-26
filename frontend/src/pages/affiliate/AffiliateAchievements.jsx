import { useState } from 'react'

const EARNED = 18400

const MILESTONES = [
  { id: 'first', title: 'First referral', amount: 1, note: 'A paid signup came in through your link.' },
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
  }).format(amount)
}

function statusOf(amount) {
  if (EARNED >= amount) return 'unlocked'
  const next = MILESTONES.find((item) => item.amount > EARNED)
  if (next && next.amount === amount) return 'current'
  return 'locked'
}

function AffiliateAchievements() {
  const [openId, setOpenId] = useState(null)
  const current = MILESTONES.find((item) => statusOf(item.amount) === 'current') || MILESTONES[MILESTONES.length - 1]
  const previousAmount = [...MILESTONES].reverse().find((item) => item.amount < current.amount)?.amount || 0
  const span = current.amount - previousAmount
  const progressed = Math.min(Math.max(EARNED - previousAmount, 0), span)
  const percent = current.amount <= EARNED ? 100 : Math.round((progressed / span) * 100)
  const selected = MILESTONES.find((item) => item.id === openId)

  return (
    <div className="-mx-4 -my-8 min-h-[calc(100vh-4.25rem)] bg-[#10131c] px-4 py-8 text-slate-100 sm:-mx-8 sm:px-8">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Achievements</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-400">Milestones open as your commission total grows. The next one stays in front until you clear it.</p>

      <ol className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {MILESTONES.map((item) => {
          const status = statusOf(item.amount)
          const done = status === 'unlocked'
          return (
            <li key={item.id} className="text-center">
              <span
                className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
                  done ? 'bg-teal-300 text-slate-900' : status === 'current' ? 'bg-white text-slate-900' : 'bg-white/5 text-slate-500 ring-1 ring-white/10'
                }`}
              >
                {done ? '✓' : status === 'current' ? '→' : ''}
              </span>
              <p className={`mt-2 text-[11px] font-medium ${done || status === 'current' ? 'text-slate-200' : 'text-slate-500'}`}>{item.title}</p>
            </li>
          )
        })}
      </ol>

      <section className="mt-8 overflow-hidden rounded-xl border border-teal-300/30 bg-[#171b27]">
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-300">Next milestone</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{current.title}</h2>
            <p className="mt-2 text-sm text-slate-400">
              {formatMoney(EARNED)} recorded. {formatMoney(Math.max(current.amount - EARNED, 0))} still to go.
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-teal-300" style={{ width: `${percent}%` }} />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {formatMoney(previousAmount)} to {formatMoney(current.amount)}
            </p>
          </div>
          <div className="rounded-xl bg-[#10131c] px-5 py-6 text-center ring-1 ring-white/10">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Target</p>
            <p className="mt-2 text-3xl font-extrabold text-white">{formatMoney(current.amount)}</p>
            <p className="mt-2 text-sm text-teal-200">{percent}% of this step</p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MILESTONES.map((item) => {
          const status = statusOf(item.amount)
          const unlocked = status === 'unlocked'
          return (
            <article
              key={item.id}
              className={`flex flex-col rounded-xl border p-5 ${
                unlocked
                  ? 'border-teal-300/40 bg-[#171b27]'
                  : status === 'current'
                    ? 'border-white/20 bg-[#171b27]'
                    : 'border-white/10 bg-[#12151e] text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className={`text-xs font-semibold uppercase tracking-[0.14em] ${unlocked ? 'text-teal-300' : 'text-slate-500'}`}>
                  {unlocked ? 'Unlocked' : status === 'current' ? 'In progress' : 'Locked'}
                </p>
                {unlocked ? null : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                    <rect x="5" y="11" width="14" height="9" rx="2" />
                    <path strokeLinecap="round" d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                )}
              </div>
              <h2 className={`mt-4 text-lg font-bold ${unlocked || status === 'current' ? 'text-white' : ''}`}>{item.title}</h2>
              <p className={`mt-2 text-2xl font-extrabold ${unlocked ? 'text-teal-100' : status === 'current' ? 'text-white' : ''}`}>
                {formatMoney(item.amount)}
              </p>
              <p className="mt-2 flex-1 text-sm leading-6">{unlocked || status === 'current' ? item.note : 'This one opens after the earlier milestones.'}</p>
              {unlocked ? (
                <button
                  type="button"
                  onClick={() => setOpenId(item.id)}
                  className="mt-5 w-fit cursor-pointer rounded-lg bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-teal-200"
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
            className="w-full max-w-sm rounded-xl border border-white/10 bg-[#171b27] p-6 text-slate-100"
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
              className="mt-6 cursor-pointer rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900"
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
