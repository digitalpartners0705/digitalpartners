import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useParams } from 'react-router-dom'
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

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
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
      await api.post(`/api/admin/commissions/${entry.id}/reverse`, { reason: reason.trim() })
      onReversed()
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
          <p className="mt-1 text-sm text-slate-500">Removes {moneyExact(entry.amount)} from this affiliate&apos;s balance.</p>
        </div>
        <div className="space-y-4 px-5 py-4">
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Reason
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              required
              autoFocus
              className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
              placeholder="Why is this entry wrong?"
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

function EarnerDetail() {
  const { userId } = useParams()
  const [data, setData] = useState(null)
  const [meta, setMeta] = useState(null)
  const [status, setStatus] = useState('all')
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

  const load = useCallback(() => {
    setLoading(true)
    api
      .get(`/api/admin/commissions/earners/${userId}`, { params: { status, page, pageSize: 50 } })
      .then((response) => {
        setData(response.data)
        setError('')
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load this earner'))
      .finally(() => setLoading(false))
  }, [userId, status, page])

  useEffect(() => {
    load()
  }, [load])

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="h-9 w-64 animate-pulse rounded bg-slate-200" />
        <div className="h-28 animate-pulse rounded-lg bg-slate-100" />
        <div className="h-64 animate-pulse rounded-lg bg-slate-100" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="text-lg font-semibold text-slate-900">{error}</p>
        <Link
          to="/commissions"
          className="mt-5 inline-flex rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to commissions
        </Link>
      </div>
    )
  }

  const { earner, totals, byIncomeType, commissions, totalPages, total } = data

  return (
    <div>
      <Link to="/commissions" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-brand-700">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="m14 6-6 6 6 6" />
        </svg>
        All commissions
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{earner.name}</h1>
          <p className="mt-1.5 text-slate-500">
            {earner.email}
            {earner.referralCode ? ` · ${earner.referralCode}` : ''}
            {earner.knowledgePackage ? ` · ${earner.knowledgePackage}` : ''}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {[earner.state, earner.country].filter(Boolean).join(', ') || 'Location not set'}
            {earner.phone ? ` · ${earner.phone}` : ''}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdjusting(true)}
          className="cursor-pointer rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Adjust this earner
        </button>
      </div>

      {notice ? <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Credited balance" value={moneyExact(totals.credited)} hint={`${totals.creditedCount} credited entries`} />
        <StatCard label="All entries" value={totals.entries} hint={`${totals.reversedCount} reversed`} />
        <StatCard
          label="Active income"
          value={moneyExact(byIncomeType.find((item) => item.incomeType === 'active')?.amount || 0)}
        />
        <StatCard
          label="Passive + second"
          value={moneyExact(
            (byIncomeType.find((item) => item.incomeType === 'passive')?.amount || 0) +
              (byIncomeType.find((item) => item.incomeType === 'second')?.amount || 0),
          )}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {byIncomeType.map((item) => (
          <div key={item.incomeType} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {INCOME_LABEL[item.incomeType] || item.incomeType}
            </p>
            <p className="mt-1 text-lg font-extrabold text-slate-900">{moneyExact(item.amount)}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {item.entries} {item.entries === 1 ? 'entry' : 'entries'}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All' },
            { id: 'credited', label: 'Credited' },
            { id: 'reversed', label: 'Reversed' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatus(tab.id)
                setPage(1)
              }}
              className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium ${
                status === tab.id
                  ? 'bg-brand-600 text-white'
                  : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-500">{total} in history</p>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold">Buyer / Order</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 text-right font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Note</th>
                <th className="px-4 py-3 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading
                ? Array.from({ length: 5 }, (_, index) => (
                    <tr key={index}>
                      <td colSpan={7} className="px-4 py-3">
                        <div className="h-5 animate-pulse rounded bg-slate-100" />
                      </td>
                    </tr>
                  ))
                : commissions.map((entry) => {
                    const reversed = entry.status === 'reversed'
                    return (
                      <tr key={entry.id} className="align-top">
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {dateTime(entry.earnedAt)}
                          {reversed && entry.reversedAt ? (
                            <p className="mt-0.5">Reversed {dateTime(entry.reversedAt)}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900">{entry.buyer?.name || '—'}</p>
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
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {entry.notes || entry.reverseReason || '—'}
                          {entry.createdBy?.name ? (
                            <p className="mt-0.5 text-slate-400">by {entry.createdBy.name}</p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          {!reversed ? (
                            <button
                              type="button"
                              onClick={() => setReversing(entry)}
                              className="cursor-pointer text-xs font-semibold text-rose-600 hover:underline"
                            >
                              Reverse
                            </button>
                          ) : null}
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>

        {!loading && commissions.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-lg font-semibold text-slate-900">No entries in this view</p>
            <p className="mt-2 text-sm text-slate-500">Try switching the status filter or posting an adjustment.</p>
          </div>
        ) : null}
      </div>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page <= 1}
              className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
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
          defaults={{ earner: earner.email || earner.referralCode }}
          onClose={() => setAdjusting(false)}
          onCreated={() => {
            setAdjusting(false)
            setNotice('Adjustment recorded on this earner.')
            load()
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
            load()
          }}
        />
      ) : null}
    </div>
  )
}

export default EarnerDetail
