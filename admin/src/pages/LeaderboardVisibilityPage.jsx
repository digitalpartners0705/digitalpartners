import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import { money } from '../utils/orders'

const visibilityTabs = [
  { id: 'all', label: 'All' },
  { id: 'hidden', label: 'Hidden only' },
  { id: 'visible', label: 'Visible only' },
]

function StatCard({ label, value, hint, tone = 'default' }) {
  const valueTone =
    tone === 'warning' ? 'text-amber-700' : tone === 'success' ? 'text-emerald-700' : 'text-slate-900'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1.5 text-2xl font-extrabold tracking-tight ${valueTone}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}

function LeaderboardVisibilityPage() {
  const [affiliates, setAffiliates] = useState([])
  const [stats, setStats] = useState({ visible: 0, hidden: 0 })
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [visibility, setVisibility] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState('')
  const [error, setError] = useState('')

  const loadAffiliates = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/api/admin/leaderboard-visibility', {
        params: {
          visibility,
          search: search.trim() || undefined,
          page,
          pageSize,
        },
      })
      setAffiliates(response.data.affiliates || [])
      setStats(response.data.stats || { visible: 0, hidden: 0 })
      setTotal(response.data.total || 0)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load affiliates')
      setAffiliates([])
    } finally {
      setLoading(false)
    }
  }, [visibility, search, page, pageSize])

  useEffect(() => {
    loadAffiliates()
  }, [loadAffiliates])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const setHidden = async (affiliate, hidden) => {
    const name = affiliate.fullName || affiliate.email
    const ok = window.confirm(
      hidden
        ? `Hide ${name} from the affiliate leaderboard?\n\nThey will not appear on Weekly, Monthly, or Overall boards, and ranks will recalculate without them. Earnings are not affected.`
        : `Show ${name} on the affiliate leaderboard?\n\nThey can appear again on Weekly, Monthly, and Overall boards, and ranks will recalculate with them included.`,
    )
    if (!ok) return

    setUpdatingId(affiliate.id)
    setError('')
    try {
      const response = await api.patch(`/api/admin/leaderboard-visibility/${affiliate.id}`, { hidden })
      const updated = response.data.affiliate
      setAffiliates((prev) => {
        if (visibility === 'hidden' && !updated.hidden) {
          return prev.filter((row) => row.id !== updated.id)
        }
        if (visibility === 'visible' && updated.hidden) {
          return prev.filter((row) => row.id !== updated.id)
        }
        return prev.map((row) => (row.id === updated.id ? updated : row))
      })
      setStats((prev) => {
        if (hidden) {
          return {
            visible: Math.max(0, (prev.visible || 0) - 1),
            hidden: (prev.hidden || 0) + 1,
          }
        }
        return {
          visible: (prev.visible || 0) + 1,
          hidden: Math.max(0, (prev.hidden || 0) - 1),
        }
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update visibility')
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Leaderboard visibility</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hide specific affiliates from Weekly, Monthly, and Overall boards. Hidden people are skipped when ranks
          are calculated. Their commissions and earnings stay unchanged.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Visible" value={stats.visible} hint="Can appear on the board" tone="success" />
        <StatCard
          label="Hidden"
          value={stats.hidden}
          hint="Excluded from ranking"
          tone={stats.hidden > 0 ? 'warning' : 'default'}
        />
        <StatCard label="Listed here" value={total} hint="Matching current filters" />
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center rounded-lg bg-slate-100 p-1">
          {visibilityTabs.map((tab) => {
            const active = visibility === tab.id
            const count =
              tab.id === 'all'
                ? (stats.visible || 0) + (stats.hidden || 0)
                : tab.id === 'hidden'
                  ? stats.hidden
                  : stats.visible
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setVisibility(tab.id)
                  setPage(1)
                }}
                className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition ${
                  active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    active ? 'bg-slate-100 text-slate-800' : 'bg-slate-200/60 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="relative w-full md:w-80">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search name, email, phone, referral code…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-400"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Affiliate</th>
                <th className="px-4 py-3.5">Phone</th>
                <th className="px-4 py-3.5">Referral code</th>
                <th className="px-4 py-3.5">All-time earned</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Loading affiliates…
                  </td>
                </tr>
              ) : affiliates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <p className="text-base font-semibold text-slate-700">No affiliates found</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {search || visibility !== 'all'
                        ? 'Try a different search or filter.'
                        : 'Affiliates will appear here once accounts exist.'}
                    </p>
                  </td>
                </tr>
              ) : (
                affiliates.map((affiliate) => (
                  <tr key={affiliate.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{affiliate.fullName || '—'}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{affiliate.email || '—'}</p>
                      {affiliate.knowledgePackage ? (
                        <p className="mt-1 text-[11px] font-medium text-slate-400">{affiliate.knowledgePackage}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-slate-700">{affiliate.phone || '—'}</td>
                    <td className="px-4 py-4 font-mono text-xs tracking-wide text-slate-700">
                      {affiliate.referralCode || '—'}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{money(affiliate.totalEarned)}</td>
                    <td className="px-4 py-4">
                      {affiliate.hidden ? (
                        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
                          Hidden
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                          Visible
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {affiliate.hidden ? (
                        <button
                          type="button"
                          disabled={updatingId === affiliate.id}
                          onClick={() => setHidden(affiliate, false)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {updatingId === affiliate.id ? 'Saving…' : 'Show on board'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={updatingId === affiliate.id}
                          onClick={() => setHidden(affiliate, true)}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100 disabled:opacity-60"
                        >
                          {updatingId === affiliate.id ? 'Saving…' : 'Hide from board'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-600">
            <p>
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default LeaderboardVisibilityPage
