import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const RANGES = ['Today', '7 days', '30 days', 'All time']

const STATS = [
  { label: "Today's earnings", value: '₹0', hint: 'No sales yet today' },
  { label: 'Last 7 days', value: '₹0', hint: 'Quiet week so far' },
  { label: 'Last 30 days', value: '₹0', hint: 'No payouts this month' },
  { label: 'All time', value: '₹0', hint: 'Earnings start with your first referral' },
]

const PACKAGES = [
  { name: 'Social Expert', share: 0 },
  { name: 'Ads Expert', share: 0 },
  { name: 'AI Premium Expert', share: 0 },
]

const STATES = [
  { name: 'Maharashtra', sales: 0 },
  { name: 'Gujarat', sales: 0 },
  { name: 'Karnataka', sales: 0 },
  { name: 'Delhi', sales: 0 },
  { name: 'Tamil Nadu', sales: 0 },
]

function AffiliateEarnings() {
  const { user } = useAuth()
  const firstName = user?.fullName?.split(' ')[0] || 'there'
  const [range, setRange] = useState('All time')
  const [metric, setMetric] = useState('share')

  return (
    <div className="-mx-4 -my-8 min-h-[calc(100vh-4.25rem)] bg-[#10131c] px-4 py-8 text-slate-100 sm:-mx-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Hello, {firstName}</h1>
          <p className="mt-1 text-sm text-slate-400">Earnings insights · performance summary</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {RANGES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setRange(item)}
              className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold ${
                range === item ? 'bg-teal-300 text-slate-900' : 'bg-white/5 text-slate-300 hover:bg-white/10'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,0.8fr)]">
        <section className="grid gap-3 sm:grid-cols-2">
          {STATS.map((stat) => (
            <article key={stat.label} className="rounded-xl border border-white/10 bg-[#171b27] px-4 py-4">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="mt-3 text-2xl font-bold">{stat.value}</p>
              <p className="mt-2 text-xs text-slate-500">{stat.hint}</p>
            </article>
          ))}
        </section>

        <aside className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#171b27] p-5">
          <div>
            <p className="text-sm text-slate-400">Package outlook</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              You are on <span className="font-semibold text-white">{user?.knowledgePackage || 'a starter plan'}</span>.
              A stronger package can raise the commission on the same referrals.
            </p>
            <p className="mt-4 text-3xl font-extrabold text-teal-300">Example +45%</p>
            <p className="mt-1 text-xs text-slate-500">Illustration only. Your live totals stay at ₹0 until a sale is recorded.</p>
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
            {PACKAGES.map((item, index) => (
              <li key={item.name} className="grid grid-cols-[2rem_1fr_5rem] items-center gap-3 py-3 text-sm">
                <span className="text-slate-500">0{index + 1}</span>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${item.share}%` }} />
                  </div>
                </div>
                <span className="justify-self-end rounded-md border border-amber-400/40 px-2 py-1 text-xs font-semibold text-amber-200">
                  {metric === 'share' ? `${item.share}%` : item.share}
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
            {STATES.map((item, index) => (
              <li key={item.name} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 py-3 text-sm">
                <span className="text-slate-500">{index + 1}</span>
                <span>{item.name}</span>
                <span className="text-slate-300">{item.sales}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

export default AffiliateEarnings
