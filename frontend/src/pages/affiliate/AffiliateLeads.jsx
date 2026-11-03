import { useEffect, useMemo, useState } from 'react'
import { getAffiliateLeads } from '../../services/api'

const TYPE_STYLE = {
  joining: 'bg-teal-400/10 text-teal-200 ring-teal-300/25',
  package: 'bg-violet-400/10 text-violet-200 ring-violet-300/25',
}

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'joining', label: 'Joining Link' },
  { id: 'package', label: 'Package Link' },
]

function SearchIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="m20 20-3.5-3.5" />
    </svg>
  )
}

function formatStamp(iso) {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return {
    day: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
  }
}

function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).slice(0, 2)
  if (parts.length === 0 || !parts[0]) return '?'
  return parts.map((part) => part[0].toUpperCase()).join('')
}

function AffiliateLeads() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    let active = true
    setLoading(true)
    getAffiliateLeads()
      .then((payload) => {
        if (!active) return
        setData(payload)
        setError('')
      })
      .catch((err) => {
        if (!active) return
        setError(err.response?.data?.message || 'Could not load your leads')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const leads = data?.leads || []
  const totals = data?.totals || { allTime: 0, today: 0, last30Days: 0, converted: 0 }

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return leads.filter((lead) => {
      if (filter !== 'all' && lead.type !== filter) return false
      if (!needle) return true
      return [lead.name, lead.email, lead.phone, lead.packageName, lead.state]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle))
    })
  }, [leads, search, filter])

  const stats = [
    { label: 'Total leads', value: totals.allTime, hint: 'People who joined with your link' },
    { label: 'Joined today', value: totals.today, hint: 'New sign-ups since midnight' },
    { label: 'Last 30 days', value: totals.last30Days, hint: 'Rolling monthly count' },
    { label: 'With a package', value: totals.converted, hint: 'Leads that generated commission' },
  ]

  return (
    <div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article key={stat.label} className="rounded-xl border border-white/10 bg-[#171b27] px-4 py-4">
            <p className="text-sm text-slate-400">{stat.label}</p>
            <p className="mt-2 text-2xl font-bold">{loading ? '…' : stat.value}</p>
            <p className="mt-2 text-xs text-slate-500">{stat.hint}</p>
          </article>
        ))}
      </section>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>
      ) : null}

      <section className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-[#171b27]">
        <div className="flex flex-col gap-4 border-b border-white/10 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-lg font-bold tracking-tight">Lead list</h2>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex rounded-full bg-black/30 p-1 text-xs font-semibold">
              {FILTERS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setFilter(item.id)}
                  className={`cursor-pointer rounded-full px-3 py-1.5 transition ${
                    filter === item.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <label className="relative block w-full sm:w-64">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                <SearchIcon />
              </span>
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                aria-label="Search leads"
                className="w-full rounded-full border border-white/10 bg-[#10131c] py-2.5 pl-11 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-teal-300/40"
              />
            </label>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[52rem] w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs font-medium uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 sm:px-6">S.No</th>
                <th className="px-3 py-3">Customer Name</th>
                <th className="px-3 py-3">Phone Number</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3">Package</th>
                <th className="px-3 py-3">Type</th>
                <th className="px-4 py-3 sm:px-6">Created On</th>
              </tr>
            </thead>
            <tbody>
              {!loading && visible.length > 0
                ? visible.map((lead, index) => {
                  const stamp = formatStamp(lead.createdAt)
                  return (
                    <tr key={lead.id} className="border-b border-white/5 transition last:border-0 hover:bg-white/[0.03]">
                      <td className="px-4 py-4 text-slate-500 sm:px-6">{index + 1}</td>
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[0.06] text-xs font-bold text-slate-300">
                            {initialsOf(lead.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">{lead.name || '—'}</p>
                            {lead.state || lead.country ? (
                              <p className="truncate text-xs text-slate-500">
                                {[lead.state, lead.country].filter(Boolean).join(', ')}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 font-medium text-slate-200">{lead.phone || '—'}</td>
                      <td className="px-3 py-4 text-slate-300">{lead.email || '—'}</td>
                      <td className="px-3 py-4 text-slate-300">{lead.packageName || '—'}</td>
                      <td className="px-3 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
                            TYPE_STYLE[lead.type] || TYPE_STYLE.joining
                          }`}
                        >
                          {lead.typeLabel}
                        </span>
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <p className="text-slate-200">{stamp.day}</p>
                        <p className="text-xs text-slate-500">{stamp.time}</p>
                      </td>
                    </tr>
                  )
                })
                : null}
            </tbody>
          </table>
        </div>

        {loading ? (
          <p className="px-6 py-12 text-center text-sm text-slate-400">Loading leads…</p>
        ) : visible.length === 0 ? (
          <p className="px-6 py-12 text-center text-sm text-slate-400">
            {leads.length === 0
              ? 'No leads yet. Share a referral link and your sign-ups will appear here.'
              : 'No leads match this search.'}
          </p>
        ) : null}

        {!loading && visible.length > 0 ? (
          <div className="border-t border-white/10 px-4 py-3 text-xs text-slate-500 sm:px-6">
            Showing {visible.length} of {leads.length} lead{leads.length === 1 ? '' : 's'}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default AffiliateLeads
