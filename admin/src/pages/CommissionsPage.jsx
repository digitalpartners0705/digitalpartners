import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import AdjustmentModal from '../components/AdjustmentModal'
import api from '../services/api'
import {
  COMMISSION_SOURCE_LABEL,
  COMMISSION_STATUS_STYLE,
  INCOME_LABEL,
  dateTime,
  money,
  moneyExact,
  titleCase,
} from '../utils/orders'

const statusTabs = [
  { id: 'all', label: 'All' },
  { id: 'credited', label: 'Credited' },
  { id: 'reversed', label: 'Reversed' },
]

const sortOptions = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'highest', label: 'Highest amount' },
  { id: 'lowest', label: 'Lowest amount' },
]

const emptyFilters = {
  status: 'all',
  incomeType: 'all',
  source: 'all',
  packageName: '',
  search: '',
  from: '',
  to: '',
  sort: 'newest',
}

function StatCard({ label, value, hint, tone = 'default' }) {
  const valueTone = tone === 'danger' ? 'text-rose-700' : 'text-slate-900'
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold tracking-tight ${valueTone}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}

function Badge({ value, styles, label }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
        styles?.[value] || 'bg-slate-100 text-slate-600 ring-slate-200'
      }`}
    >
      {label || titleCase(value)}
    </span>
  )
}

function ReverseModal({ entry, onClose, onReversed }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await api.post(`/api/admin/commissions/${entry.id}/reverse`, { reason: reason.trim() })
      onReversed(response.data.commission)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reverse this entry')
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 py-12">
      <button type="button" className="fixed inset-0 cursor-pointer bg-slate-900/40" aria-label="Close" onClick={onClose} />
      <form onSubmit={save} className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Reverse commission</h2>
          <p className="mt-1 text-sm text-slate-500">
            Removes {moneyExact(entry.amount)} from {entry.earner.name || 'this affiliate'}&apos;s credited balance.
          </p>
        </div>
        <div className="space-y-4 px-5 py-4">
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <div className="rounded-lg bg-rose-50 px-3 py-3 text-sm text-rose-900">
            <p className="font-semibold">{entry.earner.name}</p>
            <p className="mt-0.5 text-xs">
              {INCOME_LABEL[entry.incomeType] || entry.incomeType}
              {entry.packageName ? ` · ${entry.packageName}` : ''}
              {entry.buyer?.name ? ` · buyer ${entry.buyer.name}` : ''}
            </p>
          </div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Reason
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              required
              autoFocus
              placeholder="Why is this entry wrong?"
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {saving ? 'Reversing...' : 'Reverse entry'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

const selectClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500'

function CommissionsPage() {
  const navigate = useNavigate()
  const [commissions, setCommissions] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, pageSize: 25 })
  const [filterTotals, setFilterTotals] = useState(null)
  const [stats, setStats] = useState(null)
  const [meta, setMeta] = useState(null)
  const [filters, setFilters] = useState(emptyFilters)
  const [searchDraft, setSearchDraft] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  const [reversing, setReversing] = useState(null)

  useEffect(() => {
    api
      .get('/api/admin/commissions/meta')
      .then((response) => setMeta(response.data))
      .catch(() => setMeta(null))
  }, [])

  const loadStats = useCallback(() => {
    api
      .get('/api/admin/commissions/stats')
      .then((response) => setStats(response.data))
      .catch(() => setStats(null))
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const loadCommissions = useCallback(() => {
    setLoading(true)
    api
      .get('/api/admin/commissions', { params: { ...filters, page, pageSize: 25 } })
      .then((response) => {
        setCommissions(response.data.commissions || [])
        setPagination({
          page: response.data.page,
          totalPages: response.data.totalPages,
          total: response.data.total,
          pageSize: response.data.pageSize,
        })
        setFilterTotals(response.data.totals || null)
        setError('')
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load commissions'))
      .finally(() => setLoading(false))
  }, [filters, page])

  useEffect(() => {
    loadCommissions()
  }, [loadCommissions])

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) => (current.search === searchDraft ? current : { ...current, search: searchDraft }))
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchDraft])

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }))
    setPage(1)
  }

  const resetFilters = () => {
    setFilters(emptyFilters)
    setSearchDraft('')
    setPage(1)
  }

  const totals = stats?.totals
  const filtersActive =
    filters.status !== 'all' ||
    filters.incomeType !== 'all' ||
    filters.source !== 'all' ||
    Boolean(filters.packageName) ||
    Boolean(filters.search) ||
    Boolean(filters.from) ||
    Boolean(filters.to)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Commissions</h1>
          <p className="mt-1 text-slate-500">Every affiliate earning, who received it, and every correction.</p>
        </div>
        <button
          type="button"
          onClick={() => setAdjusting(true)}
          disabled={!meta}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Manual adjustment
        </button>
      </div>

      {notice ? <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Payable balance"
          value={totals ? money(totals.credited) : '—'}
          hint={
            totals
              ? stats?.external?.credited > 0
                ? `${money(totals.creditedToday)} today · excludes ${money(stats.external.credited)} external`
                : `${money(totals.creditedToday)} today`
              : null
          }
        />
        <StatCard
          label="Entries"
          value={totals ? totals.entries : '—'}
          hint={totals ? `${totals.creditedCount} credited · ${totals.reversedCount} reversed` : null}
        />
        <StatCard
          label="Last 30 days"
          value={totals ? money(totals.credited30d) : '—'}
          hint={totals ? `${totals.entriesToday} entries today` : null}
        />
        <StatCard
          label="Adjustments"
          value={totals ? totals.adjustmentCount : '—'}
          hint={totals ? `${money(totals.reversed)} marked reversed` : null}
          tone="danger"
        />
      </div>

      {stats?.topEarners?.length ? (
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Top earners</p>
          </div>
          <div className="divide-y divide-slate-100">
            {stats.topEarners.map((earner, index) => (
              <Link
                key={earner.id}
                to={`/commissions/earners/${earner.id}`}
                className="flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    <span className="mr-2 text-slate-400">{index + 1}.</span>
                    {earner.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {earner.referralCode || earner.email} · {earner.entries} entries
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-slate-900">{moneyExact(earner.amount)}</span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {statusTabs.map((tab) => {
          const active = filters.status === tab.id
          const count =
            tab.id === 'all'
              ? totals?.entries
              : tab.id === 'credited'
                ? totals?.creditedCount
                : tab.id === 'reversed'
                  ? totals?.reversedCount
                  : undefined
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter('status', tab.id)}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition ${
                active
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-brand-700'
              }`}
            >
              {tab.label}
              {count === undefined ? null : (
                <span className={`ml-1.5 ${active ? 'text-white/80' : 'text-slate-400'}`}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          placeholder="Search earner, buyer, order, note"
          className="min-w-[16rem] flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-brand-500"
        />
        <select value={filters.incomeType} onChange={(event) => setFilter('incomeType', event.target.value)} className={selectClass}>
          <option value="all">Any level</option>
          {(meta?.incomeTypes || []).map((type) => (
            <option key={type} value={type}>
              {INCOME_LABEL[type] || type}
            </option>
          ))}
        </select>
        <select value={filters.packageName} onChange={(event) => setFilter('packageName', event.target.value)} className={selectClass}>
          <option value="">All packages</option>
          {(meta?.packages || []).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <select value={filters.source} onChange={(event) => setFilter('source', event.target.value)} className={selectClass}>
          <option value="all">Any source</option>
          {(meta?.sources || []).map((source) => (
            <option key={source} value={source}>
              {COMMISSION_SOURCE_LABEL[source] || titleCase(source)}
            </option>
          ))}
        </select>
        <input type="date" value={filters.from} onChange={(event) => setFilter('from', event.target.value)} className={selectClass} />
        <input type="date" value={filters.to} onChange={(event) => setFilter('to', event.target.value)} className={selectClass} />
        <select value={filters.sort} onChange={(event) => setFilter('sort', event.target.value)} className={selectClass}>
          {sortOptions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        {filtersActive ? (
          <button
            type="button"
            onClick={resetFilters}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Clear
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {filterTotals && filtersActive && !loading ? (
        <p className="mt-4 rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{filterTotals.entries}</span> matching entries · credited{' '}
          <span className="font-semibold text-slate-900">{moneyExact(filterTotals.credited)}</span>
        </p>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Earner</th>
                <th className="px-4 py-3 font-semibold">Buyer / Order</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 8 }, (_, index) => (
                    <tr key={index}>
                      <td colSpan={7} className="px-4 py-3">
                        <div className="h-5 animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                : commissions.map((entry) => {
                    const reversed = entry.status === 'reversed'
                    return (
                      <tr key={entry.id} className="align-top hover:bg-slate-50/80">
                        <td className="px-4 py-3">
                          <Link
                            to={`/commissions/earners/${entry.earner.id}`}
                            className="font-semibold text-brand-700 hover:underline"
                          >
                            {entry.earner.name || '—'}
                          </Link>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {entry.earner.referralCode || entry.earner.email || '—'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-800">{entry.buyer?.name || '—'}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {entry.orderId ? (
                              <Link to={`/orders/${entry.orderId}`} className="text-brand-700 hover:underline">
                                {entry.orderNumber || 'Order'}
                              </Link>
                            ) : (
                              entry.packageName || COMMISSION_SOURCE_LABEL[entry.source] || '—'
                            )}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-700">{INCOME_LABEL[entry.incomeType] || entry.incomeType}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {entry.packageName || COMMISSION_SOURCE_LABEL[entry.source]}
                            {entry.commissionPercent != null ? ` · ${entry.commissionPercent}%` : ''}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p
                            className={`font-semibold ${
                              reversed
                                ? 'text-slate-400 line-through'
                                : entry.amount < 0
                                  ? 'text-rose-700'
                                  : 'text-slate-900'
                            }`}
                          >
                            {moneyExact(entry.amount)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge value={entry.status} styles={COMMISSION_STATUS_STYLE} />
                          {entry.notes ? <p className="mt-1 max-w-[12rem] truncate text-xs text-slate-500">{entry.notes}</p> : null}
                          {entry.reverseReason ? (
                            <p className="mt-1 max-w-[12rem] truncate text-xs text-rose-600">{entry.reverseReason}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {dateTime(entry.earnedAt)}
                          {reversed && entry.reversedAt ? (
                            <p className="mt-0.5">Reversed {dateTime(entry.reversedAt)}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col items-start gap-1.5">
                            <button
                              type="button"
                              onClick={() => navigate(`/commissions/earners/${entry.earner.id}`)}
                              className="cursor-pointer text-xs font-semibold text-brand-700 hover:underline"
                            >
                              History
                            </button>
                            {!reversed ? (
                              <button
                                type="button"
                                onClick={() => setReversing(entry)}
                                className="cursor-pointer text-xs font-semibold text-rose-600 hover:underline"
                              >
                                Reverse
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>

        {!loading && commissions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-semibold text-slate-900">
              {filtersActive ? 'No commissions match these filters' : 'No commissions yet'}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {filtersActive
                ? 'Try clearing the filters or widening the date range.'
                : 'Entries appear here when referred users buy a package.'}
            </p>
            {filtersActive ? (
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear filters
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      {pagination.totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} entries
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={pagination.page <= 1}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {adjusting && meta ? (
        <AdjustmentModal
          packages={meta.packages}
          incomeTypes={meta.incomeTypes}
          onClose={() => setAdjusting(false)}
          onCreated={() => {
            setAdjusting(false)
            setNotice('Adjustment recorded.')
            loadCommissions()
            loadStats()
          }}
        />
      ) : null}

      {reversing ? (
        <ReverseModal
          entry={reversing}
          onClose={() => setReversing(null)}
          onReversed={() => {
            setReversing(null)
            setNotice('Commission entry reversed.')
            loadCommissions()
            loadStats()
          }}
        />
      ) : null}
    </div>
  )
}

export default CommissionsPage
