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

const EMPTY_PACKAGES = [
  { name: 'Social Expert', share: 0, sales: 0, amount: 0 },
  { name: 'Ads Expert', share: 0, sales: 0, amount: 0 },
  { name: 'AI Premium Expert', share: 0, sales: 0, amount: 0 },
]

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

function AffiliateEarnings() {
  const { user } = useAuth()
  const firstName = user?.fullName?.split(' ')[0] || 'there'
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

  const totals = data?.totals || { today: 0, last7Days: 0, last30Days: 0, allTime: 0, salesCount: 0 }
  const packages = data?.packages?.length ? data.packages : EMPTY_PACKAGES
  const byState = data?.byState || []
  const recent = data?.recent || []

  const selectedTotal = useMemo(() => {
    if (range === 'today') return totals.today
    if (range === '7d') return totals.last7Days
    if (range === '30d') return totals.last30Days
    return totals.allTime
  }, [range, totals])

  const stats = [
    {
      label: "Today's earnings",
      value: rupees(totals.today),
      hint: totals.today > 0 ? 'Active commissions credited today' : 'No sales yet today',
    },
    {
      label: 'Last 7 days',
      value: rupees(totals.last7Days),
      hint: totals.last7Days > 0 ? 'Rolling 7-day active income' : 'Quiet week so far',
    },
    {
      label: 'Last 30 days',
      value: rupees(totals.last30Days),
      hint: totals.last30Days > 0 ? 'Last 30 days of active income' : 'No payouts this month',
    },
    {
      label: 'All time',
      value: rupees(totals.allTime),
      hint:
        totals.allTime > 0
          ? `${totals.salesCount} active sale${totals.salesCount === 1 ? '' : 's'} recorded`
          : 'Earnings start with your first referral',
    },
  ]

  return (
    <div className="-mx-4 -my-8 min-h-[calc(100vh-4.25rem)] bg-[#10131c] px-4 py-8 text-slate-100 sm:-mx-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Hello, {firstName}</h1>
          <p className="mt-1 text-sm text-slate-400">
            Live active earnings · selected range {rupees(selectedTotal)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRange(item.id)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold ${
                range === item.id ? 'bg-teal-300 text-slate-900' : 'bg-white/5 text-slate-300 hover:bg-white/10'
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

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <section className="grid gap-3 sm:grid-cols-2">
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-xl border border-white/10 bg-[#171b27] px-4 py-4">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-3 text-2xl font-bold">{loading ? '…' : stat.value}</p>
              <p className="mt-2 text-xs text-slate-500">{stat.hint}</p>
            </article>
          ))}
        </section>

        <aside className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#171b27] p-5">
          <div>
            <p className="text-sm text-slate-400">Package outlook</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              You are on <span className="font-semibold text-white">{user?.knowledgePackage || 'a starter plan'}</span>.
              Active commission is credited on every referred package purchase at the fixed plan %.
            </p>
            <p className="mt-4 text-3xl font-extrabold text-teal-300">{loading ? '…' : rupees(totals.allTime)}</p>
            <p className="mt-1 text-xs text-slate-500">All-time active income from your referrals.</p>
          </div>
          <Link
            to="/dashboard/upgrade"
            className="mt-5 inline-flex w-fit cursor-pointer rounded-lg bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-teal-200"
          >
            View plans
          </Link>
        </aside>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <section className="rounded-xl border border-white/10 bg-[#171b27] p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">What&apos;s selling</h2>
            <div className="flex rounded-lg bg-black/30 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMetric('share')}
                className={`cursor-pointer rounded-md px-2 py-1 ${metric === 'share' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
              >
                %
              </button>
              <button
                type="button"
                onClick={() => setMetric('count')}
                className={`cursor-pointer rounded-md px-2 py-1 ${metric === 'count' ? 'bg-white/10 text-white' : 'text-slate-400'}`}
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
              <li key={item.name} className="grid grid-cols-[2rem_1fr_5rem] items-center gap-3 py-3 text-sm">
                <span className="text-slate-500">0{index + 1}</span>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${item.share || 0}%` }} />
                  </div>
                </div>
                <span className="justify-self-end rounded-md border border-amber-400/40 px-2 py-1 text-xs font-semibold text-amber-200">
                  {metric === 'share' ? `${item.share || 0}%` : item.sales || 0}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-white/10 bg-[#171b27] p-5">
          <h2 className="text-lg font-bold">Sales by state</h2>
          <div className="mt-4 grid grid-cols-[2rem_1fr_auto] gap-3 border-b border-white/10 pb-2 text-xs font-medium text-slate-500">
            <span>#</span>
            <span>State</span>
            <span>Sales</span>
          </div>
          <ul className="divide-y divide-white/5">
            {byState.length === 0 ? (
              <li className="py-6 text-sm text-slate-400">No referred sales yet.</li>
            ) : (
              byState.slice(0, 8).map((item, index) => (
                <li key={item.name} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-3 text-sm">
                  <span className="text-slate-500">{index + 1}</span>
                  <span>{item.name}</span>
                  <span className="text-slate-300">{item.sales}</span>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>

      <section className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#171b27]">
        <div className="border-b border-white/10 px-4 py-4 sm:px-5">
          <h2 className="text-lg font-bold">Recent active commissions</h2>
          <p className="mt-1 text-sm text-slate-400">Each referred package purchase creates one active earning row.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[40rem] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-teal-200/80">
                <th className="px-4 py-3 font-medium sm:px-5">Date</th>
                <th className="px-3 py-3 font-medium">Buyer</th>
                <th className="px-3 py-3 font-medium">Package</th>
                <th className="px-3 py-3 font-medium">%</th>
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
                    No commissions yet. Share a referral link to start earning.
                  </td>
                </tr>
              ) : (
                recent.map((row) => (
                  <tr key={row.id} className="border-b border-white/5 last:border-0">
                    <td className="px-4 py-4 text-slate-300 sm:px-5">{formatDay(row.earnedAt)}</td>
                    <td className="px-3 py-4 font-medium">{row.buyerName || '—'}</td>
                    <td className="px-3 py-4 text-slate-300">{row.packageName || '—'}</td>
                    <td className="px-3 py-4 text-slate-300">
                      {row.commissionPercent != null ? `${row.commissionPercent}%` : '—'}
                    </td>
                    <td className="px-4 py-4 font-semibold text-teal-200 sm:px-5">{rupees(row.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default AffiliateEarnings
