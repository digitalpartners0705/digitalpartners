import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ManualOrderModal from '../components/ManualOrderModal'
import api from '../services/api'
import {
  ORDER_STATUS_STYLE,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_STYLE,
  SOURCE_LABEL,
  dateTime,
  money,
  titleCase,
} from '../utils/orders'

const statusTabs = [
  { id: 'all', label: 'All' },
  { id: 'paid', label: 'Paid' },
  { id: 'pending', label: 'Pending' },
  { id: 'cancelled', label: 'Cancelled' },
]

const sortOptions = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'highest', label: 'Highest amount' },
  { id: 'lowest', label: 'Lowest amount' },
]

const emptyFilters = {
  status: 'all',
  paymentStatus: 'all',
  source: 'all',
  packageName: '',
  search: '',
  from: '',
  to: '',
  sort: 'newest',
}

function StatCard({ label, value, hint, tone = 'default' }) {
  const valueTone = tone === 'warning' ? 'text-amber-700' : tone === 'danger' ? 'text-rose-700' : 'text-slate-900'
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold tracking-tight ${valueTone}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}

function Badge({ value, styles }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${
        styles[value] || 'bg-slate-100 text-slate-600 ring-slate-200'
      }`}
    >
      {titleCase(value)}
    </span>
  )
}

const selectClass =
  'rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-500'

function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0, pageSize: 20 })
  const [filterTotals, setFilterTotals] = useState(null)
  const [stats, setStats] = useState(null)
  const [meta, setMeta] = useState(null)
  const [filters, setFilters] = useState(emptyFilters)
  const [searchDraft, setSearchDraft] = useState('')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recording, setRecording] = useState(false)

  useEffect(() => {
    api
      .get('/api/admin/orders/meta')
      .then((response) => setMeta(response.data))
      .catch(() => setMeta(null))
  }, [])

  const loadStats = useCallback(() => {
    api
      .get('/api/admin/orders/stats')
      .then((response) => setStats(response.data))
      .catch(() => setStats(null))
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const loadOrders = useCallback(() => {
    setLoading(true)
    api
      .get('/api/admin/orders', { params: { ...filters, page, pageSize: 20 } })
      .then((response) => {
        setOrders(response.data.orders || [])
        setPagination({
          page: response.data.page,
          totalPages: response.data.totalPages,
          total: response.data.total,
          pageSize: response.data.pageSize,
        })
        setFilterTotals(response.data.totals || null)
        setError('')
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load orders'))
      .finally(() => setLoading(false))
  }, [filters, page])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

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
    filters.paymentStatus !== 'all' ||
    filters.source !== 'all' ||
    Boolean(filters.packageName) ||
    Boolean(filters.search) ||
    Boolean(filters.from) ||
    Boolean(filters.to)

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Orders</h1>
          <p className="mt-1 text-slate-500">Every package sale, what it earned, and what it paid out.</p>
        </div>
        <button
          type="button"
          onClick={() => setRecording(true)}
          disabled={!meta}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Record order
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Revenue"
          value={totals ? money(totals.gross) : '—'}
          hint={totals ? `${money(totals.grossToday)} today` : null}
        />
        <StatCard
          label="Orders"
          value={totals ? totals.orders : '—'}
          hint={totals ? `${totals.ordersToday} today · ${totals.orders30d} in 30 days` : null}
        />
        <StatCard
          label="Paid orders"
          value={totals ? totals.paidOrders : '—'}
          hint={totals ? `${money(totals.net)} net of GST` : null}
        />
        <StatCard
          label="Commission paid"
          value={totals ? money(totals.commission) : '—'}
          hint={totals ? `${money(totals.gst)} GST collected` : null}
        />
      </div>

      {stats?.packages?.length ? (
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {stats.packages.map((item) => (
            <div key={item.name} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
              <p className="truncate text-sm font-bold text-slate-900">{item.name}</p>
              <p className="mt-1 text-sm text-slate-500">
                <span className="font-semibold text-slate-700">{item.orders}</span>{' '}
                {item.orders === 1 ? 'order' : 'orders'}
                <span className="mx-1.5 text-slate-300">·</span>
                {money(item.gross)}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2">
        {statusTabs.map((tab) => {
          const active = filters.status === tab.id
            const count =
            tab.id === 'all'
              ? totals?.orders
              : tab.id === 'paid'
                ? totals?.paidOrders
                : tab.id === 'pending'
                  ? totals?.pendingOrders
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
          placeholder="Search order no, name, email, phone, reference"
          className="min-w-[16rem] flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-brand-500"
        />
        <select value={filters.packageName} onChange={(event) => setFilter('packageName', event.target.value)} className={selectClass}>
          <option value="">All packages</option>
          {(meta?.packages || []).map((item) => (
            <option key={item.name} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          value={filters.paymentStatus}
          onChange={(event) => setFilter('paymentStatus', event.target.value)}
          className={selectClass}
        >
          <option value="all">Any payment</option>
          {(meta?.paymentStatuses || []).map((item) => (
            <option key={item} value={item}>
              {titleCase(item)}
            </option>
          ))}
        </select>
        <select value={filters.source} onChange={(event) => setFilter('source', event.target.value)} className={selectClass}>
          <option value="all">Any source</option>
          {(meta?.sources || []).map((item) => (
            <option key={item} value={item}>
              {SOURCE_LABEL[item] || titleCase(item)}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(event) => setFilter('from', event.target.value)}
          className={selectClass}
          aria-label="From date"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(event) => setFilter('to', event.target.value)}
          className={selectClass}
          aria-label="To date"
        />
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
          <span className="font-semibold text-slate-900">{filterTotals.orders}</span> matching{' '}
          {filterTotals.orders === 1 ? 'order' : 'orders'} worth{' '}
          <span className="font-semibold text-slate-900">{money(filterTotals.gross)}</span>, paying{' '}
          <span className="font-semibold text-slate-900">{money(filterTotals.commission)}</span> in commission.
        </p>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">Buyer</th>
                <th className="px-4 py-3 font-semibold">Package</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3 text-right font-semibold">Commission</th>
                <th className="px-4 py-3 font-semibold">Payment</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 8 }, (_, index) => (
                    <tr key={index}>
                      <td colSpan={8} className="px-4 py-3">
                        <div className="h-5 animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                : orders.map((order) => (
                    <tr
                      key={order.id}
                      onClick={() => navigate(`/orders/${order.id}`)}
                      className="cursor-pointer transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <Link
                          to={`/orders/${order.id}`}
                          onClick={(event) => event.stopPropagation()}
                          className="font-semibold text-brand-700 hover:underline"
                        >
                          {order.orderNumber}
                        </Link>
                        <p className="mt-0.5 text-xs text-slate-500">{SOURCE_LABEL[order.source] || order.source}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{order.buyer.name || '—'}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{order.buyer.email || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700">{order.packageName}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{order.buyer.state || order.buyer.country || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="font-semibold text-slate-900">{money(order.grossAmount)}</p>
                        {order.discountAmount > 0 ? (
                          <p className="mt-0.5 text-xs text-emerald-700">−{money(order.discountAmount)}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {order.commissionTotal > 0 ? money(order.commissionTotal) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge value={order.payment.status} styles={PAYMENT_STATUS_STYLE} />
                        {order.payment.method ? (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {PAYMENT_METHOD_LABEL[order.payment.method] || order.payment.method}
                          </p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <Badge value={order.status} styles={ORDER_STATUS_STYLE} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">{dateTime(order.createdAt)}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && orders.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-semibold text-slate-900">
              {filtersActive ? 'No orders match these filters' : 'No orders yet'}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {filtersActive
                ? 'Try widening the date range or clearing the filters.'
                : 'Orders appear here as soon as someone signs up or upgrades.'}
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
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} orders
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

      {recording && meta ? (
        <ManualOrderModal
          packages={meta.packages}
          paymentMethods={meta.paymentMethods}
          onClose={() => setRecording(false)}
          onCreated={(order) => navigate(`/orders/${order.id}`)}
        />
      ) : null}
    </div>
  )
}

export default OrdersPage
