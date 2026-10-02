import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'
import {
  INCOME_LABEL,
  ORDER_STATUS_STYLE,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_STYLE,
  SOURCE_LABEL,
  dateTime,
  money,
  moneyExact,
  titleCase,
} from '../utils/orders'

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500'

const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-slate-500'

function Card({ title, action, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">{title}</h2>
        {action}
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  )
}

function Row({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-right text-sm font-semibold text-slate-900 ${mono ? 'font-mono text-xs' : ''}`}>
        {value || '—'}
      </span>
    </div>
  )
}

function Badge({ value, styles }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
        styles[value] || 'bg-slate-100 text-slate-600 ring-slate-200'
      }`}
    >
      {titleCase(value)}
    </span>
  )
}

function Modal({ title, description, children, onClose }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 py-12">
      <button type="button" className="fixed inset-0 cursor-pointer bg-slate-900/40" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">{title}</h2>
            <p className="mt-1 text-sm text-slate-500">{description}</p>
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
        {children}
      </div>
    </div>,
    document.body,
  )
}

function PaymentModal({ order, methods, onClose, onSaved }) {
  const [paymentMethod, setPaymentMethod] = useState(order.payment.method || 'upi')
  const [paymentReference, setPaymentReference] = useState(order.payment.reference || '')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await api.post(`/api/admin/orders/${order.id}/payment`, {
        paymentStatus: 'captured',
        paymentMethod,
        paymentReference: paymentReference.trim(),
        notes: notes.trim(),
      })
      onSaved(response.data.order)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update the payment')
      setSaving(false)
    }
  }

  return (
    <Modal title="Payment details" description="Attach the method and reference for this paid order." onClose={onClose}>
      <form onSubmit={save}>
        <div className="space-y-4 px-5 py-4">
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <label className={labelClass}>
            Method
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className={fieldClass}>
              {methods.map((method) => (
                <option key={method} value={method}>
                  {PAYMENT_METHOD_LABEL[method] || method}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Reference / UTR
            <input
              value={paymentReference}
              onChange={(event) => setPaymentReference(event.target.value)}
              placeholder="Transaction id"
              className={fieldClass}
            />
          </label>

          <label className={labelClass}>
            Note
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              className={fieldClass}
              placeholder="Optional"
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
            className="cursor-pointer rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function OrderDetail() {
  const { id } = useParams()
  const [data, setData] = useState(null)
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [payingOpen, setPayingOpen] = useState(false)

  const load = () => {
    setLoading(true)
    api
      .get(`/api/admin/orders/${id}`)
      .then((response) => {
        setData(response.data)
        setError('')
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load the order'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    api
      .get('/api/admin/orders/meta')
      .then((response) => setMeta(response.data))
      .catch(() => setMeta(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-9 w-64 animate-pulse rounded bg-slate-200" />
        <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="text-lg font-semibold text-slate-900">{error || 'Order not found'}</p>
        <Link
          to="/orders"
          className="mt-5 inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to orders
        </Link>
      </div>
    )
  }

  const { order, commissions, history } = data
  const credited = commissions.filter((item) => item.status === 'credited')
  const creditedTotal = credited.reduce((sum, item) => sum + item.amount, 0)

  return (
    <div>
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-700">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m14 6-6 6 6 6" />
        </svg>
        All orders
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{order.orderNumber}</h1>
            <Badge value={order.status} styles={ORDER_STATUS_STYLE} />
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {SOURCE_LABEL[order.source] || titleCase(order.source)}
            </span>
          </div>
          <p className="mt-1.5 text-slate-500">
            {order.packageName} · {dateTime(order.createdAt)}
            {order.createdByName ? ` · recorded by ${order.createdByName}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPayingOpen(true)}
          className="cursor-pointer rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Edit payment details
        </button>
      </div>

      {notice ? (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p>
      ) : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card title="Amount">
            <Row label="Package price" value={moneyExact(order.listedPrice)} />
            {order.discountAmount > 0 ? <Row label="Discount" value={`−${moneyExact(order.discountAmount)}`} /> : null}
            <Row label={`GST (${order.gstRate}%)`} value={moneyExact(order.gstAmount)} />
            <Row label="Net amount" value={moneyExact(order.netAmount)} />
            <div className="mt-2 flex items-center justify-between border-t border-slate-200 pt-3">
              <span className="text-sm font-bold text-slate-900">Total charged</span>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">{moneyExact(order.grossAmount)}</span>
            </div>
            {order.promoCode || order.couponCode ? (
              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                {order.promoCode ? (
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    Promo {order.promoCode}
                  </span>
                ) : null}
                {order.couponCode ? (
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                    Coupon {order.couponCode}
                  </span>
                ) : null}
              </div>
            ) : null}
          </Card>

          <Card title="Payment" action={<Badge value={order.payment.status} styles={PAYMENT_STATUS_STYLE} />}>
            <Row label="Provider" value={titleCase(order.payment.provider)} />
            <Row
              label="Method"
              value={order.payment.method ? PAYMENT_METHOD_LABEL[order.payment.method] || order.payment.method : null}
            />
            <Row label="Reference / UTR" value={order.payment.reference} mono />
            <Row label="Gateway order id" value={order.payment.orderId} mono />
            <Row label="Paid at" value={order.payment.paidAt ? dateTime(order.payment.paidAt) : null} />
          </Card>

          <Card
            title="Affiliate commission"
            action={
              <span className="text-sm font-bold text-slate-900">
                {creditedTotal > 0 ? money(creditedTotal) : money(0)}
              </span>
            }
          >
            {commissions.length === 0 ? (
              <p className="text-sm text-slate-500">
                {order.sponsorId
                  ? 'No commission was credited for this order.'
                  : 'This buyer joined without a referral, so no commission was due.'}
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {commissions.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      {item.earnerId ? (
                        <Link
                          to={`/commissions/earners/${item.earnerId}`}
                          className="truncate text-sm font-semibold text-brand-700 hover:underline"
                        >
                          {item.earnerName || 'Deleted user'}
                        </Link>
                      ) : (
                        <p className="truncate text-sm font-semibold text-slate-900">{item.earnerName || 'Deleted user'}</p>
                      )}
                      <p className="mt-0.5 text-xs text-slate-500">
                        {INCOME_LABEL[item.incomeType] || item.incomeType}
                        {item.commissionPercent != null ? ` · ${item.commissionPercent}%` : ''}
                        {item.earnerCode ? ` · ${item.earnerCode}` : ''}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p
                        className={`text-sm font-bold ${
                          item.status === 'credited' ? 'text-slate-900' : 'text-slate-400 line-through'
                        }`}
                      >
                        {moneyExact(item.amount)}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.status === 'credited' ? dateTime(item.earnedAt) : `Reversed ${dateTime(item.reversedAt)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {order.notes ? (
            <Card title="Notes">
              <p className="whitespace-pre-line text-sm text-slate-700">{order.notes}</p>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card title="Buyer">
            <Row label="Name" value={order.buyer.name} />
            <Row label="Email" value={order.buyer.email} />
            <Row label="Phone" value={order.buyer.phone} />
            <Row label="State" value={order.buyer.state} />
            <Row label="Country" value={order.buyer.country} />
            <Row label="Referral code" value={order.buyerReferralCode} mono />
            <Row label="Current package" value={order.buyerCurrentPackage} />
            <Row label="GST registered" value={order.buyer.hasGst ? 'Yes' : 'No'} />
            {order.buyer.gstNumber ? <Row label="GST number" value={order.buyer.gstNumber} mono /> : null}
          </Card>

          <Card title="Referred by">
            {order.sponsor ? (
              <>
                <Row label="Name" value={order.sponsor.name} />
                <Row label="Email" value={order.sponsor.email} />
                <Row label="Phone" value={order.sponsor.phone} />
                <Row label="Referral code" value={order.sponsor.referralCode} mono />
              </>
            ) : (
              <p className="text-sm text-slate-500">This buyer signed up directly, without a referral link.</p>
            )}
          </Card>

          <Card title="Other orders from this buyer">
            {history.length === 0 ? (
              <p className="text-sm text-slate-500">This is their only order.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {history.map((item) => (
                  <Link
                    key={item.id}
                    to={`/orders/${item.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0 hover:text-brand-700"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">{item.packageName}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.orderNumber} · {dateTime(item.createdAt)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold text-slate-700">{money(item.grossAmount)}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {payingOpen ? (
        <PaymentModal
          order={order}
          methods={meta?.paymentMethods || ['upi', 'card', 'netbanking', 'bank_transfer', 'cash', 'other']}
          onClose={() => setPayingOpen(false)}
          onSaved={() => {
            setPayingOpen(false)
            setNotice('Payment details updated.')
            load()
          }}
        />
      ) : null}
    </div>
  )
}

export default OrderDetail
