import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApproveOrderModal, RejectOrderModal } from '../components/OrderRequestModals'
import api from '../services/api'
import { ORDER_STATUS_STYLE, PAYMENT_METHOD_LABEL, SOURCE_LABEL, dateTime, money, titleCase } from '../utils/orders'

const statusTabs = [
  { id: 'pending', label: 'Waiting' },
  { id: 'paid', label: 'Approved' },
  { id: 'cancelled', label: 'Rejected' },
  { id: 'all', label: 'All' },
]

const whatsappHref = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return null
  const normalized = digits.length === 10 ? `91${digits}` : digits
  return `https://wa.me/${normalized}`
}

function StatCard({ label, value, tone = 'default' }) {
  const valueTone = tone === 'warning' ? 'text-amber-700' : tone === 'success' ? 'text-emerald-700' : 'text-slate-900'
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-extrabold tracking-tight ${valueTone}`}>{value}</p>
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
      {value === 'paid' ? 'Approved' : value === 'cancelled' ? 'Rejected' : value === 'pending' ? 'Waiting' : titleCase(value)}
    </span>
  )
}

function Detail({ label, value, href }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      {href && value ? (
        <a href={href} className="mt-1 block text-sm font-semibold text-brand-700 hover:underline" target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
          {value}
        </a>
      ) : (
        <p className="mt-1 text-sm font-semibold text-slate-900">{value || '—'}</p>
      )}
    </div>
  )
}

function RequestDetail({ order, onClose, onApprove, onReject }) {
  const phone = order.buyer.phone
  const waiting = order.status === 'pending'

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 py-10">
      <button type="button" className="fixed inset-0 cursor-pointer" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{order.orderNumber}</h2>
              <Badge value={order.status} styles={ORDER_STATUS_STYLE} />
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {SOURCE_LABEL[order.source] || order.source} · {dateTime(order.createdAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="grid gap-4 rounded-lg bg-slate-50 px-4 py-4 sm:grid-cols-2">
            <Detail label="Name" value={order.buyer.name} />
            <Detail label="Email" value={order.buyer.email} href={order.buyer.email ? `mailto:${order.buyer.email}` : null} />
            <Detail label="Phone" value={phone} href={phone ? `tel:${phone}` : null} />
            <Detail label="WhatsApp" value={phone ? 'Message on WhatsApp' : null} href={whatsappHref(phone)} />
            <Detail label="State" value={order.buyer.state} />
            <Detail label="Country" value={order.buyer.country} />
            <Detail label="Pin code" value={order.buyerPinCode} />
            <Detail label="Referral code" value={order.buyerReferralCode} />
            <Detail label="Current package" value={order.buyerCurrentPackage || 'None yet'} />
            <Detail label="GST registered" value={order.buyer.hasGst ? 'Yes' : 'No'} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Detail label="Requested package" value={order.packageName} />
            <Detail label="Amount to collect" value={money(order.grossAmount)} />
            <Detail label="Price before GST" value={money(order.netAmount)} />
            <Detail label="GST" value={money(order.gstAmount)} />
            <Detail label="Referred by" value={order.sponsorName ? `${order.sponsorName}${order.sponsorCode ? ` · ${order.sponsorCode}` : ''}` : 'Direct signup'} />
            <Detail label="Sponsor phone" value={order.sponsorPhone} href={order.sponsorPhone ? `tel:${order.sponsorPhone}` : null} />
            {order.buyerManagerName ? <Detail label="Manager" value={order.buyerManagerName} /> : null}
            {order.buyerManagerPhone ? <Detail label="Manager phone" value={order.buyerManagerPhone} href={`tel:${order.buyerManagerPhone}`} /> : null}
          </div>

          {order.payment.method || order.payment.paidAt ? (
            <div className="grid gap-4 rounded-lg border border-slate-200 px-4 py-4 sm:grid-cols-2">
              <Detail label="Payment method" value={order.payment.method ? PAYMENT_METHOD_LABEL[order.payment.method] || order.payment.method : null} />
              <Detail label="Reference" value={order.payment.reference} />
              <Detail label="Paid at" value={order.payment.paidAt ? dateTime(order.payment.paidAt) : null} />
            </div>
          ) : null}

          {order.notes ? <p className="whitespace-pre-line text-sm text-slate-600">{order.notes}</p> : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-4">
          <Link to={`/orders/${order.id}`} className="text-sm font-semibold text-brand-700 hover:underline">
            Open in orders
          </Link>
          {waiting ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onReject}
                className="cursor-pointer rounded-lg border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={onApprove}
                className="cursor-pointer rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Approve payment
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function OrderRequestsPage() {
  const [orders, setOrders] = useState([])
  const [stats, setStats] = useState(null)
  const [status, setStatus] = useState('pending')
  const [searchDraft, setSearchDraft] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [selected, setSelected] = useState(null)
  const [approving, setApproving] = useState(null)
  const [rejecting, setRejecting] = useState(null)

  const loadStats = useCallback(() => {
    api
      .get('/api/admin/order-requests/stats')
      .then((response) => setStats(response.data))
      .catch(() => setStats(null))
  }, [])

  const loadOrders = useCallback(() => {
    setLoading(true)
    api
      .get('/api/admin/order-requests', { params: { status, search, page, pageSize: 20 } })
      .then((response) => {
        setOrders(response.data.orders || [])
        setPagination({
          page: response.data.page,
          totalPages: response.data.totalPages,
          total: response.data.total,
        })
        setError('')
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load order requests'))
      .finally(() => setLoading(false))
  }, [status, search, page])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadOrders()
  }, [loadOrders])

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchDraft.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchDraft])

  const refresh = () => {
    loadStats()
    loadOrders()
  }

  const tabCount = (id) => {
    if (!stats) return undefined
    if (id === 'pending') return stats.pending
    if (id === 'paid') return stats.approved
    if (id === 'cancelled') return stats.cancelled
    return stats.pending + stats.approved + stats.cancelled
  }

  return (
    <div>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Order requests</h1>
        <p className="mt-1 max-w-3xl text-slate-500">
          Users who click Pay land here until online payment is live. Contact them, collect cash or UPI, then approve
          to start the subscription.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <StatCard label="Waiting" value={stats ? stats.pending : '—'} tone="warning" />
        <StatCard label="Approved" value={stats ? stats.approved : '—'} tone="success" />
        <StatCard label="Rejected" value={stats ? stats.cancelled : '—'} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {statusTabs.map((tab) => {
          const active = status === tab.id
          const count = tabCount(tab.id)
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatus(tab.id)
                setPage(1)
              }}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition ${
                active ? 'bg-brand-600 text-white' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
              {count === undefined ? null : <span className={`ml-1.5 ${active ? 'text-white/80' : 'text-slate-400'}`}>{count}</span>}
            </button>
          )
        })}
      </div>

      <div className="mt-3">
        <input
          type="search"
          value={searchDraft}
          onChange={(event) => setSearchDraft(event.target.value)}
          placeholder="Search order no, name, email, phone, referral code"
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-brand-500 sm:max-w-md"
        />
      </div>

      {notice ? <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}
      {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Order</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Package</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 6 }, (_, index) => (
                    <tr key={index}>
                      <td colSpan={7} className="px-4 py-3">
                        <div className="h-5 animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                : orders.map((order) => (
                    <tr key={order.id} className="cursor-pointer transition hover:bg-slate-50" onClick={() => setSelected(order)}>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{order.orderNumber}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{dateTime(order.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">{order.buyer.name || '—'}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{order.buyer.state || order.buyer.country || '—'}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-slate-700">{order.buyer.phone || '—'}</p>
                        <p className="mt-0.5 text-xs text-slate-500">{order.buyer.email || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{order.packageName}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">{money(order.grossAmount)}</td>
                      <td className="px-4 py-3">
                        <Badge value={order.status} styles={ORDER_STATUS_STYLE} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {order.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                setRejecting(order)
                              }}
                              className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Reject
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation()
                                setApproving(order)
                              }}
                              className="cursor-pointer rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                            >
                              Approve
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">View</span>
                        )}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {!loading && orders.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-semibold text-slate-900">
              {status === 'pending' ? 'No orders waiting' : 'No order requests here'}
            </p>
            <p className="mt-2 text-sm text-slate-500">
              {status === 'pending'
                ? 'New requests appear when a user clicks Pay on a package.'
                : 'Try another status or clear the search.'}
            </p>
          </div>
        ) : null}
      </div>

      {pagination.totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Page {pagination.page} of {pagination.totalPages} · {pagination.total} requests
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

      {selected ? (
        <RequestDetail
          order={selected}
          onClose={() => setSelected(null)}
          onApprove={() => setApproving(selected)}
          onReject={() => setRejecting(selected)}
        />
      ) : null}

      {approving ? (
        <ApproveOrderModal
          order={approving}
          onClose={() => setApproving(null)}
          onApproved={() => {
            setApproving(null)
            setSelected(null)
            setNotice('Payment confirmed. The subscription is now active.')
            refresh()
          }}
        />
      ) : null}

      {rejecting ? (
        <RejectOrderModal
          order={rejecting}
          onClose={() => setRejecting(null)}
          onRejected={() => {
            setRejecting(null)
            setSelected(null)
            setNotice('Order request rejected.')
            refresh()
          }}
        />
      ) : null}
    </div>
  )
}

export default OrderRequestsPage
