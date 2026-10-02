import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import api from '../services/api'
import { PAYMENT_METHOD_LABEL, money } from '../utils/orders'

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500'

const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-slate-500'

function Toggle({ checked, onChange, label, hint }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 px-3 py-2.5 hover:bg-slate-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 h-4 w-4 cursor-pointer accent-brand-600"
      />
      <span>
        <span className="block text-sm font-semibold text-slate-800">{label}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{hint}</span>
      </span>
    </label>
  )
}

function ManualOrderModal({ packages, paymentMethods, onClose, onCreated }) {
  const [buyer, setBuyer] = useState('')
  const [packageName, setPackageName] = useState(packages[0]?.name || '')
  const [discount, setDiscount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('upi')
  const [paymentReference, setPaymentReference] = useState('')
  const [notes, setNotes] = useState('')
  const [grantAccess, setGrantAccess] = useState(true)
  const [payCommissions, setPayCommissions] = useState(true)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const selected = packages.find((item) => item.name === packageName)

  const breakdown = useMemo(() => {
    if (!selected) return null
    const listed = Number(selected.listedPrice)
    const off = Math.min(Math.max(Number(discount) || 0, 0), listed)
    const gross = listed - off
    const net = off === 0 ? Number(selected.netAmount) : Math.round(gross * 0.82 * 100) / 100
    return { listed, off, gross, net, gst: Math.round((gross - net) * 100) / 100 }
  }, [selected, discount])

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await api.post('/api/admin/orders', {
        buyer: buyer.trim(),
        packageName,
        discountAmount: Number(discount) || 0,
        paymentMethod,
        paymentReference: paymentReference.trim(),
        notes: notes.trim(),
        markPaid: true,
        grantAccess,
        payCommissions,
      })
      onCreated(response.data.order)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not record the order')
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 py-10">
      <button type="button" className="fixed inset-0 cursor-pointer bg-slate-900/40" aria-label="Close" onClick={onClose} />
      <form onSubmit={save} className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Record an order</h2>
            <p className="mt-1 text-sm text-slate-500">For payments collected outside the website, like UPI or cash.</p>
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

        <div className="space-y-4 px-5 py-4">
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <label className={labelClass}>
            Buyer
            <input
              value={buyer}
              onChange={(event) => setBuyer(event.target.value)}
              placeholder="Email, phone, or referral code"
              className={fieldClass}
              required
              autoFocus
            />
            <span className="mt-1 block text-[11px] font-normal normal-case tracking-normal text-slate-500">
              The buyer must already have an account.
            </span>
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Package
              <select
                value={packageName}
                onChange={(event) => setPackageName(event.target.value)}
                className={fieldClass}
                required
              >
                {packages.map((item) => (
                  <option key={item.name} value={item.name}>
                    {item.name} — {money(item.listedPrice)}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Discount
              <input
                type="number"
                min="0"
                step="1"
                value={discount}
                onChange={(event) => setDiscount(event.target.value)}
                placeholder="0"
                className={fieldClass}
              />
            </label>
          </div>

          {breakdown ? (
            <div className="rounded-lg bg-slate-50 px-3 py-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Package price</span>
                <span>{money(breakdown.listed)}</span>
              </div>
              {breakdown.off > 0 ? (
                <div className="mt-1 flex justify-between text-slate-600">
                  <span>Discount</span>
                  <span>−{money(breakdown.off)}</span>
                </div>
              ) : null}
              <div className="mt-1 flex justify-between text-slate-600">
                <span>GST (18%)</span>
                <span>{money(breakdown.gst)}</span>
              </div>
              <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                <span>Amount collected</span>
                <span>{money(breakdown.gross)}</span>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Payment method
              <select
                value={paymentMethod}
                onChange={(event) => setPaymentMethod(event.target.value)}
                className={fieldClass}
              >
                {paymentMethods.map((method) => (
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
          </div>

          <label className={labelClass}>
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="Anything the team should know about this sale"
              className={fieldClass}
            />
          </label>

          <div className="space-y-2">
            <Toggle
              checked={grantAccess}
              onChange={setGrantAccess}
              label="Unlock the package for the buyer"
              hint="Updates the buyer's course access to this package."
            />
            <Toggle
              checked={payCommissions}
              onChange={setPayCommissions}
              label="Pay affiliate commissions"
              hint="Credits the three levels above the buyer when a referral applies."
            />
          </div>
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
            {saving ? 'Recording...' : 'Record order'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

export default ManualOrderModal
