import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getAffiliateEarnings } from '../../services/api'

const RANGES = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: 'all', label: 'All time' },
]

const PACKAGE_NAMES = ['Social Expert', 'Ads Expert', 'AI Premium Expert']

const EMPTY_LEVELS = [
  { incomeType: 'active', level: 1, label: 'Active', sales: 0, amount: 0 },
  { incomeType: 'passive', level: 2, label: 'Passive', sales: 0, amount: 0 },
  { incomeType: 'second', level: 3, label: 'Second level', sales: 0, amount: 0 },
]

const LEVEL_META = {
  active: {
    label: 'Active',
    note: 'Your direct referral bought a package',
    tone: 'text-teal-200',
    badge: 'bg-teal-400/15 text-teal-200 ring-teal-300/25',
    bar: 'bg-teal-400',
  },
  passive: {
    label: 'Passive',
    note: 'Someone your referral brought in bought a package',
    tone: 'text-sky-200',
    badge: 'bg-sky-400/15 text-sky-200 ring-sky-300/25',
    bar: 'bg-sky-400',
  },
  second: {
    label: 'Second level',
    note: 'One more step down the chain bought a package',
    tone: 'text-violet-200',
    badge: 'bg-violet-400/15 text-violet-200 ring-violet-300/25',
    bar: 'bg-violet-400',
  },
}

const PACKAGE_TONE = {
  'Social Expert': 'bg-sky-400',
  'Ads Expert': 'bg-amber-400',
  'AI Premium Expert': 'bg-violet-400',
}

function rupees(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

function formatDay(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function displayName(value) {
  const raw = String(value || '').trim()
  if (!raw) return 'there'
  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function rangeStart(rangeId) {
  if (rangeId === 'all') return null
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (rangeId === 'today') return start
  if (rangeId === '7d') {
    start.setDate(start.getDate() - 6)
    return start
  }
  if (rangeId === '30d') {
    start.setDate(start.getDate() - 29)
    return start
  }
  return null
}

function inRange(iso, from) {
  if (!from) return true
  return new Date(iso) >= from
}

function AffiliateEarnings() {
  const { user } = useAuth()
  const firstName = displayName(user?.fullName?.split(' ')[0])
  const [range, setRange] = useState('all')
  const [metric, setMetric] = useState('share')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    getAffiliateEarnings()
      .then((payload) => {
        if (!active) return
        setData(payload)
        setError('')
      })
      .catch((err) => {
        if (!active) return
        setError(err.response?.data?.message || 'Could not load earnings')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const totals = data?.totals || { today: 0, last7Days: 0, last30Days: 0, allTime: 0, commissionCount: 0 }
  const commissions = data?.commissions || data?.recent || []

  const filtered = useMemo(() => {
    const from = rangeStart(range)
    return commissions.filter((row) => inRange(row.earnedAt, from))
  }, [commissions, range])

  const levels = useMemo(() => {
    return EMPTY_LEVELS.map((level) => {
      const matched = filtered.filter((row) => row.incomeType === level.incomeType)
      return {
        ...level,
        sales: matched.length,
        amount: matched.reduce((sum, row) => sum + Number(row.amount || 0), 0),
      }
    })
  }, [filtered])

  const packages = useMemo(() => {
    const rows = PACKAGE_NAMES.map((name) => {
      const matched = filtered.filter((row) => row.packageName === name)
      return {
        name,
        sales: matched.length,
        amount: matched.reduce((sum, row) => sum + Number(row.amount || 0), 0),
      }
    })
    const totalAmount = rows.reduce((sum, row) => sum + row.amount, 0)
    return rows.map((row) => ({
      ...row,
      share: totalAmount ? Math.round((row.amount / totalAmount) * 100) : 0,
    }))
  }, [filtered])

  const byState = useMemo(() => {
    const map = new Map()
    filtered.forEach((row) => {
      const name = row.buyerState || row.country || 'Unknown'
      const current = map.get(name) || { name, sales: 0, amount: 0 }
      current.sales += 1
      current.amount += Number(row.amount || 0)
      map.set(name, current)
    })
    return [...map.values()].sort((a, b) => b.sales - a.sales || b.amount - a.amount)
  }, [filtered])

  const recent = filtered.slice(0, 20)

  const stats = [
    {
      id: 'today',
      label: "Today's earnings",
      value: rupees(totals.today),
      hint: totals.today > 0 ? 'Credited today' : 'No sales yet today',
    },
    {
      id: '7d',
      label: 'Last 7 days',
      value: rupees(totals.last7Days),
      hint: totals.last7Days > 0 ? 'Rolling 7-day total' : 'Quiet week so far',
    },
    {
      id: '30d',
      label: 'Last 30 days',
      value: rupees(totals.last30Days),
      hint: totals.last30Days > 0 ? 'Last 30 days total' : 'No payouts this month',
    },
    {
      id: 'all',
      label: 'All time',
      value: rupees(totals.allTime),
      hint:
        totals.allTime > 0
          ? `${totals.commissionCount} commission${totals.commissionCount === 1 ? '' : 's'} across all levels`
          : 'Starts with your first referral',
    },
  ]

  const rangeLabel = RANGES.find((item) => item.id === range)?.label || 'All time'

  return (
    <div className="-mx-4 -my-8 min-h-[calc(100vh-4.25rem)] bg-[#10131c] px-4 py-8 text-slate-100 sm:-mx-8 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200/70">Earnings</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Hello, <span className="text-teal-300">{firstName}</span>
          </h1>
        </div>

        <div className="inline-flex shrink-0 self-start rounded-full border border-white/12 bg-[#141823] p-1.5 sm:self-center">
          {RANGES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRange(item.id)}
              className={`cursor-pointer rounded-full px-3.5 py-2 text-xs font-bold transition sm:px-4 ${
                range === item.id
                  ? 'bg-gradient-to-b from-teal-400/90 to-teal-600/90 text-white shadow-md shadow-teal-950/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>
      ) : null}

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.75fr)]">
        <section className="grid gap-3 sm:grid-cols-2">
          {stats.map((stat) => {
            const selected = range === stat.id
            return (
              <button
                key={stat.id}
                type="button"
                onClick={() => setRange(stat.id)}
                className={`cursor-pointer rounded-2xl border px-4 py-4 text-left transition ${
                  selected
                    ? 'border-teal-300/40 bg-[#1a2230] ring-1 ring-teal-300/25'
                    : 'border-white/10 bg-[#171b27] hover:border-white/20'
                }`}
              >
                <p className="text-sm text-slate-400">{stat.label}</p>
                <p className={`mt-3 text-2xl font-bold ${selected ? 'text-teal-200' : 'text-white'}`}>
                  {loading ? '…' : stat.value}
                </p>
                <p className="mt-2 text-xs text-slate-500">{stat.hint}</p>
              </button>
            )
          })}
        </section>

        <aside className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#171b27] p-5">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-teal-400/15 to-transparent" />
          <div className="relative flex h-full flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-200/80">Package outlook</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                You are on{' '}
                <span className="font-semibold text-white">{user?.knowledgePackage || 'a starter plan'}</span>.
                Commission is credited on every purchase in your chain at the fixed plan amounts.
              </p>
              <p className="mt-5 text-3xl font-extrabold text-teal-300">{loading ? '…' : rupees(totals.allTime)}</p>
              <p className="mt-1 text-xs text-slate-500">All-time income across active, passive, and second level.</p>
            </div>
            <Link
              to="/dashboard/upgrade"
              className="mt-5 inline-flex w-fit cursor-pointer rounded-full bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-teal-200"
            >
              View plans
            </Link>
          </div>
        </aside>
      </div>

      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        {levels.map((item) => {
          const meta = LEVEL_META[item.incomeType] || LEVEL_META.active
          return (
            <article key={item.incomeType} className="rounded-2xl border border-white/10 bg-[#171b27] px-4 py-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-200">{meta.label}</p>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${meta.badge}`}>
                  Level {item.level}
                </span>
              </div>
              <p className={`mt-3 text-2xl font-bold ${meta.tone}`}>{loading ? '…' : rupees(item.amount)}</p>
              <p className="mt-2 text-xs text-slate-500">{meta.note}</p>
              <p className="mt-1 text-xs text-slate-500">
                {item.sales} commission{item.sales === 1 ? '' : 's'} · {rangeLabel.toLowerCase()}
              </p>
            </article>
          )
        })}
      </section>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.75fr)]">
        <section className="rounded-2xl border border-white/10 bg-[#171b27] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">What&apos;s selling</h2>
              <p className="mt-0.5 text-xs text-slate-500">{rangeLabel}</p>
            </div>
            <div className="flex rounded-full bg-black/30 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMetric('share')}
                className={`cursor-pointer rounded-full px-2.5 py-1 ${metric === 'share' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
              >
                %
              </button>
              <button
                type="button"
                onClick={() => setMetric('count')}
                className={`cursor-pointer rounded-full px-2.5 py-1 ${metric === 'count' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
              >
                No.
              </button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-[2rem_1fr_5rem] gap-3 border-b border-white/10 pb-2 text-xs font-medium text-slate-500">
            <span>#</span>
            <span>Package</span>
            <span className="text-right">{metric === 'share' ? 'Share' : 'Sales'}</span>
          </div>
          <ul className="divide-y divide-white/5">
            {packages.map((item, index) => (
              <li key={item.name} className="grid grid-cols-[2rem_1fr_5rem] items-center gap-3 py-3.5 text-sm">
                <span className="text-slate-500">0{index + 1}</span>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full ${PACKAGE_TONE[item.name] || 'bg-teal-400'}`}
                      style={{ width: `${item.share || 0}%` }}
                    />
                  </div>
                </div>
                <span className="justify-self-end rounded-full border border-white/15 bg-white/[0.03] px-2.5 py-1 text-xs font-semibold text-slate-200">
                  {metric === 'share' ? `${item.share || 0}%` : item.sales || 0}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#171b27] p-5">
          <div>
            <h2 className="text-lg font-bold">Sales by state</h2>
            <p className="mt-0.5 text-xs text-slate-500">{rangeLabel}</p>
          </div>
          <div className="mt-4 grid grid-cols-[2rem_1fr_auto] gap-3 border-b border-white/10 pb-2 text-xs font-medium text-slate-500">
            <span>#</span>
            <span>State</span>
            <span>Sales</span>
          </div>
          <ul className="divide-y divide-white/5">
            {byState.length === 0 ? (
              <li className="py-8 text-sm text-slate-400">No referred sales yet.</li>
            ) : (
              byState.slice(0, 8).map((item, index) => (
                <li key={item.name} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-3.5 text-sm">
                  <span className="text-slate-500">{index + 1}</span>
                  <span>{item.name}</span>
                  <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-xs font-semibold text-slate-300">
                    {item.sales}
                  </span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#171b27]">
        <div className="border-b border-white/10 px-4 py-4 sm:px-5">
          <h2 className="text-lg font-bold">Recent commissions</h2>
          <p className="mt-1 text-sm text-slate-400">
            Showing {rangeLabel.toLowerCase()} · up to three levels paid per purchase.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[44rem] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-medium sm:px-5">Date</th>
                <th className="px-3 py-3 font-medium">Buyer</th>
                <th className="px-3 py-3 font-medium">Package</th>
                <th className="px-3 py-3 font-medium">Level</th>
                <th className="px-4 py-3 font-medium sm:px-5">Amount</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-slate-400">
                    Loading earnings…
                  </td>
                </tr>
              ) : recent.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-slate-400">
                    No commissions in this range. Share a referral link to start earning.
                  </td>
                </tr>
              ) : (
                recent.map((row) => {
                  const meta = LEVEL_META[row.incomeType] || LEVEL_META.active
                  return (
                    <tr key={row.id} className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]">
                      <td className="px-4 py-4 text-slate-300 sm:px-5">{formatDay(row.earnedAt)}</td>
                      <td className="px-3 py-4 font-medium">{row.buyerName || '—'}</td>
                      <td className="px-3 py-4 text-slate-300">{row.packageName || '—'}</td>
                      <td className="px-3 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-teal-200 sm:px-5">{rupees(row.amount)}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default AffiliateEarnings
