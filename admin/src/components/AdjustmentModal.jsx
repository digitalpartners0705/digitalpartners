import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import api from '../services/api'
import { INCOME_LABEL, money } from '../utils/orders'

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500'

const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-slate-500'

function AdjustmentModal({ packages, incomeTypes, defaults = {}, onClose, onCreated }) {
  const [earner, setEarner] = useState(defaults.earner || '')
  const [buyer, setBuyer] = useState(defaults.buyer || '')
  const [direction, setDirection] = useState('credit')
  const [amount, setAmount] = useState('')
  const [packageName, setPackageName] = useState('')
  const [incomeType, setIncomeType] = useState('adjustment')
  const [orderNumber, setOrderNumber] = useState('')
  const [notes, setNotes] = useState('')
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
      const response = await api.post('/api/admin/commissions', {
        earner: earner.trim(),
        buyer: buyer.trim() || null,
        direction,
        amount: Number(amount),
        packageName: packageName || null,
        incomeType,
        orderNumber: orderNumber.trim() || null,
        notes: notes.trim(),
      })
      onCreated(response.data.commission)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not record the adjustment')
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 py-10">
      <button type="button" className="fixed inset-0 cursor-pointer bg-slate-900/40" aria-label="Close" onClick={onClose} />
      <form onSubmit={save} className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Manual adjustment</h2>
            <p className="mt-1 text-sm text-slate-500">Credit or debit an affiliate wallet for a dispute or correction.</p>
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
            Earner
            <input
              value={earner}
              onChange={(event) => setEarner(event.target.value)}
              placeholder="Email, phone, or referral code"
              className={fieldClass}
              required
              autoFocus={!defaults.earner}
            />
          </label>

          <div>
            <p className={labelClass}>Direction</p>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {[
                { value: 'credit', label: 'Credit', hint: 'Add money' },
                { value: 'debit', label: 'Debit', hint: 'Remove money' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setDirection(item.value)}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-left ${
                    direction === item.value
                      ? item.value === 'debit'
                        ? 'border-rose-600 bg-rose-600 text-white'
                        : 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="block text-sm font-semibold">{item.label}</span>
                  <span className={`block text-xs ${direction === item.value ? 'text-white/80' : 'text-slate-500'}`}>
                    {item.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Amount
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                className={fieldClass}
                required
              />
            </label>
            <label className={labelClass}>
              Income type
              <select value={incomeType} onChange={(event) => setIncomeType(event.target.value)} className={fieldClass}>
                {(incomeTypes || ['adjustment', 'active', 'passive', 'second']).map((type) => (
                  <option key={type} value={type}>
                    {INCOME_LABEL[type] || type}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className={labelClass}>
            Buyer <span className="font-normal normal-case tracking-normal text-slate-400">(optional)</span>
            <input
              value={buyer}
              onChange={(event) => setBuyer(event.target.value)}
              placeholder="Email, phone, or referral code"
              className={fieldClass}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Package <span className="font-normal normal-case tracking-normal text-slate-400">(optional)</span>
              <select value={packageName} onChange={(event) => setPackageName(event.target.value)} className={fieldClass}>
                <option value="">None</option>
                {(packages || []).map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Order no. <span className="font-normal normal-case tracking-normal text-slate-400">(optional)</span>
              <input
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
                placeholder="DE100001"
                className={fieldClass}
              />
            </label>
          </div>

          <label className={labelClass}>
            Reason
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Why is this adjustment needed?"
              className={fieldClass}
              required
            />
          </label>

          {amount ? (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              This will {direction === 'debit' ? 'remove' : 'add'}{' '}
              <span className="font-semibold text-slate-900">{money(amount)}</span> on the earner&apos;s credited balance.
            </p>
          ) : null}
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
            className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
              direction === 'debit' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            {saving ? 'Saving...' : direction === 'debit' ? 'Post debit' : 'Post credit'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

export default AdjustmentModal
