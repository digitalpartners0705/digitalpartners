import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { dateOnly, dateTime, money, moneyExact } from '../utils/orders'

const statusTabs = [
  { id: 'credited', label: 'Active' },
  { id: 'reversed', label: 'Removed' },
  { id: 'all', label: 'All' },
]

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500'
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-slate-500'

const todayIso = () => {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

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

function AffiliatePicker({ value, onChange }) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const boxRef = useRef(null)

  useEffect(() => {
    const onClick = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    const term = search.trim()
    if (term.length < 2) {
      setResults([])
      return undefined
    }
    let active = true
    setSearching(true)
    const timer = setTimeout(() => {
      api
        .get('/api/admin/external-earnings/affiliates', { params: { search: term } })
        .then((response) => {
          if (active) setResults(response.data.users || [])
        })
        .catch(() => {
          if (active) setResults([])
        })
        .finally(() => {
          if (active) setSearching(false)
        })
    }, 250)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [search])

  if (value) {
    return (
      <div className="mt-1.5 flex items-start justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{value.name || value.email}</p>
          <p className="truncate text-xs text-slate-600">
            {value.email}
            {value.referralCode ? ` · ${value.referralCode}` : ''}
            {value.phone ? ` · ${value.phone}` : ''}
          </p>
          {value.externalTotal > 0 ? (
            <p className="mt-1 text-xs font-medium text-amber-700">
              Already has {moneyExact(value.externalTotal)} external earnings
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="shrink-0 text-xs font-semibold text-brand-700 hover:underline"
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        value={search}
        autoFocus
        onChange={(event) => {
          setSearch(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search by name, email, phone, or referral code"
        className={fieldClass}
      />
      {open && search.trim().length >= 2 ? (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {searching ? (
            <p className="px-3 py-2.5 text-sm text-slate-500">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-slate-500">No affiliate matches that search.</p>
          ) : (
            results.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  onChange(user)
                  setOpen(false)
                  setSearch('')
                }}
                className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{user.name || user.email}</p>
                  <p className="truncate text-xs text-slate-500">
                    {user.email}
                    {user.referralCode ? ` · ${user.referralCode}` : ''}
                  </p>
                </div>
                {user.externalTotal > 0 ? (
                  <span className="shrink-0 text-xs font-medium text-amber-700">{money(user.externalTotal)}</span>
                ) : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  )
}

function AddExternalModal({ onClose, onCreated }) {
  const [affiliate, setAffiliate] = useState(null)
  const [amount, setAmount] = useState('')
  const [earnedOn, setEarnedOn] = useState(todayIso())
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  const save = async (event) => {
    event.preventDefault()
    if (!affiliate) {
      setError('Choose the affiliate first')
      return
    }
    setSaving(true)
    setError('')
    try {
      const response = await api.post('/api/admin/external-earnings', {
        earnerId: affiliate.id,
        amount: Number(amount),
        earnedOn,
        notes: notes.trim(),
      })
      onCreated(response.data.entry)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not add the external earnings')
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 py-10">
      <button type="button" className="fixed inset-0 cursor-pointer bg-slate-900/40" aria-label="Close" onClick={onClose} />
      <form onSubmit={save} className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Add external earnings</h2>
            <p className="mt-1 text-sm text-slate-500">
              Show earnings from another platform on this affiliate&apos;s dashboard and leaderboard.
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

        <div className="space-y-4 px-5 py-4">
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

          <div>
            <p className={labelClass}>Affiliate</p>
            <AffiliatePicker value={affiliate} onChange={setAffiliate} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelClass}>
              Amount (₹)
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
              Count under date
              <input
                type="date"
                value={earnedOn}
                max={todayIso()}
                onChange={(event) => setEarnedOn(event.target.value)}
                className={fieldClass}
                required
              />
            </label>
          </div>

          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
            Today&apos;s date counts in Today, Last 7 days, Last 30 days, All time, and the weekly board. An older date
            only counts in the ranges that include it. Add several entries with different dates if you need to
            spread an amount across periods.
          </p>

          <label className={labelClass}>
            Note
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Example: Earnings carried over from the previous platform, confirmed by the affiliate on call"
              className={fieldClass}
              required
            />
          </label>

          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
            <p className="font-semibold">Not payable</p>
            <p className="mt-0.5 text-xs leading-5">
              This amount is for display and ranking only. It is kept out of the Commissions payable balance so you
              never pay it by mistake.
            </p>
          </div>

          {amount && affiliate ? (
            <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{affiliate.name || affiliate.email}</span> will see{' '}
              <span className="font-semibold text-slate-900">{money(amount)}</span> more on their dashboard, dated{' '}
              {dateOnly(earnedOn)}.
            </p>
          ) : null}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !affiliate}
            className="cursor-pointer rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Add external earnings'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

function RemoveModal({ entry, onClose, onRemoved }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const response = await api.post(`/api/admin/external-earnings/${entry.id}/remove`, { reason: reason.trim() })
      onRemoved(response.data.entry)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove this entry')
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 py-10">
      <button type="button" className="fixed inset-0 cursor-pointer bg-slate-900/40" aria-label="Close" onClick={onClose} />
      <form onSubmit={submit} className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Remove external earnings</h2>
          <p className="mt-1 text-sm text-slate-500">
            {moneyExact(entry.amount)} for {entry.earner.name || entry.earner.email} will stop showing on their
            dashboard and leaderboard. The record is kept for audit.
          </p>
        </div>
        <div className="space-y-3 px-5 py-4">
          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          <label className={labelClass}>
            Reason
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              autoFocus
              placeholder="Why is this being removed?"
              className={fieldClass}
              required
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {saving ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

function ExternalEarningsPage() {
  const [entries, setEntries] = useState([])
  const [stats, setStats] = useState({ entries: 0, creditedCount: 0, reversedCount: 0, credited: 0, affiliates: 0 })
  const [status, setStatus] = useState('credited')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/api/admin/external-earnings', {
        params: { status, search: search.trim() || undefined, page, pageSize: 25 },
      })
      setEntries(response.data.entries || [])
      setStats((prev) => response.data.stats || prev)
      setTotal(response.data.total || 0)
      setTotalPages(response.data.totalPages || 1)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load external earnings')
      setEntries([])
    } finally {
      setLoading(false)
    }
  }, [status, search, page])

  useEffect(() => {
    const timer = setTimeout(load, 200)
    return () => clearTimeout(timer)
  }, [load])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">External earnings</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Earnings an affiliate made on another platform that you agreed to show here. These appear on their
            dashboard and the leaderboard but are never part of the payable balance.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setNotice('')
            setAdding(true)
          }}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Add external earnings
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard
          label="Shown, not payable"
          value={money(stats.credited)}
          hint={`${stats.creditedCount} active ${stats.creditedCount === 1 ? 'entry' : 'entries'}`}
          tone="warning"
        />
        <StatCard label="Affiliates" value={stats.affiliates} hint="Have external earnings showing" />
        <StatCard label="Removed" value={stats.reversedCount} hint="Kept for audit, hidden from affiliates" />
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-semibold">Before paying anyone</p>
        <p className="mt-0.5 text-xs leading-5">
          Use the <Link to="/commissions" className="font-semibold underline">Commissions</Link> page for payouts. Its
          payable balance already leaves out everything listed here. Each affiliate&apos;s page there shows payable,
          external, and the total the affiliate sees.
        </p>
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center rounded-lg bg-slate-100 p-1">
          {statusTabs.map((tab) => {
            const active = status === tab.id
            const count =
              tab.id === 'all' ? stats.entries : tab.id === 'reversed' ? stats.reversedCount : stats.creditedCount
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatus(tab.id)
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
            placeholder="Search affiliate or note…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-400"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[60rem] text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Counts under</th>
                <th className="px-4 py-3.5">Affiliate</th>
                <th className="px-4 py-3.5 text-right">Amount</th>
                <th className="px-4 py-3.5">Note</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <p className="text-base font-semibold text-slate-700">No external earnings yet</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {search || status !== 'credited'
                        ? 'Try a different search or filter.'
                        : 'Use “Add external earnings” when an affiliate asks to carry over earnings.'}
                    </p>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => {
                  const removed = entry.status === 'reversed'
                  return (
                    <tr key={entry.id} className="align-top hover:bg-slate-50/70">
                      <td className="px-5 py-4 text-slate-700">
                        {dateOnly(entry.earnedAt)}
                        {removed && entry.reversedAt ? (
                          <p className="mt-0.5 text-xs text-slate-400">Removed {dateTime(entry.reversedAt)}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4">
                        <Link
                          to={`/commissions/earners/${entry.earner.id}`}
                          className="font-semibold text-slate-900 hover:text-brand-700 hover:underline"
                        >
                          {entry.earner.name || entry.earner.email || '—'}
                        </Link>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {entry.earner.email}
                          {entry.earner.referralCode ? ` · ${entry.earner.referralCode}` : ''}
                        </p>
                      </td>
                      <td className={`px-4 py-4 text-right font-semibold ${removed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                        {moneyExact(entry.amount)}
                      </td>
                      <td className="max-w-xs px-4 py-4 text-xs text-slate-600">
                        <p className="whitespace-pre-line">{entry.notes || '—'}</p>
                        {removed && entry.reverseReason ? (
                          <p className="mt-1 text-rose-700">Removed: {entry.reverseReason}</p>
                        ) : null}
                        {entry.createdBy?.name ? <p className="mt-1 text-slate-400">by {entry.createdBy.name}</p> : null}
                      </td>
                      <td className="px-4 py-4">
                        {removed ? (
                          <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                            Removed
                          </span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
                            Shown · not payable
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {!removed ? (
                          <button
                            type="button"
                            onClick={() => {
                              setNotice('')
                              setRemoving(entry)
                            }}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100"
                          >
                            Remove
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-600">
            <p>
              Page {page} of {totalPages} · {total} entries
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

      {adding ? (
        <AddExternalModal
          onClose={() => setAdding(false)}
          onCreated={(entry) => {
            setAdding(false)
            setNotice(
              `${moneyExact(entry.amount)} added for ${entry.earner.name || entry.earner.email}. It now shows on their dashboard and the leaderboard, and is not payable.`,
            )
            setStatus('credited')
            setPage(1)
            load()
          }}
        />
      ) : null}

      {removing ? (
        <RemoveModal
          entry={removing}
          onClose={() => setRemoving(null)}
          onRemoved={(entry) => {
            setRemoving(null)
            setNotice(`${moneyExact(entry.amount)} removed from ${entry.earner.name || entry.earner.email}.`)
            load()
          }}
        />
      ) : null}
    </div>
  )
}

export default ExternalEarningsPage
