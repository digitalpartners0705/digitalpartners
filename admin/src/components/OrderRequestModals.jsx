import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import api from '../services/api'
import { money } from '../utils/orders'

export const notifyOrderRequestsChanged = () => {
  window.dispatchEvent(new Event('order-requests-changed'))
}

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500'

const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-slate-500'

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

export function ApproveOrderModal({ order, onClose, onApproved }) {
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [paymentReference, setPaymentReference] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await api.post(`/api/admin/order-requests/${order.id}/approve`, {
        paymentMethod,
        paymentReference: paymentReference.trim(),
        notes: notes.trim(),
      })
      notifyOrderRequestsChanged()
      onApproved(response.data.order)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not approve the order')
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Confirm payment"
      description="Record how the payment was collected. Approving starts the subscription."
      onClose={onClose}
    >
      <form onSubmit={save}>
        <div className="space-y-4 px-5 py-4">
          <div className="rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{order.buyer?.name || 'This user'}</span>
            {' · '}
            {order.packageName}
            {' · '}
            <span className="font-semibold text-slate-900">{money(order.grossAmount)}</span>
          </div>
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <label className={labelClass}>
            Payment collected by
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className={fieldClass}>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
            </select>
          </label>
          <label className={labelClass}>
            UPI reference / UTR
            <input
              value={paymentReference}
              onChange={(event) => setPaymentReference(event.target.value)}
              placeholder={paymentMethod === 'cash' ? 'Optional for cash' : 'Transaction id'}
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
            {saving ? 'Approving...' : 'Approve & start subscription'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function RejectOrderModal({ order, onClose, onRejected }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await api.post(`/api/admin/order-requests/${order.id}/reject`, {
        reason: reason.trim(),
      })
      notifyOrderRequestsChanged()
      onRejected(response.data.order)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reject the order')
      setSaving(false)
    }
  }

  return (
    <Modal
      title="Reject this order"
      description="The subscription will not start. The user can place a new order after this is rejected."
      onClose={onClose}
    >
      <form onSubmit={save}>
        <div className="space-y-4 px-5 py-4">
          <p className="text-sm text-slate-600">
            Reject <span className="font-semibold text-slate-900">{order.orderNumber}</span> for{' '}
            {order.buyer?.name || 'this user'}?
          </p>
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <label className={labelClass}>
            Reason
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
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
            className="cursor-pointer rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {saving ? 'Rejecting...' : 'Reject order'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
