import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { dateTime } from '../utils/orders'

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500'
const labelClass = 'block text-xs font-semibold uppercase tracking-wide text-slate-500'

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}

function AffiliatePicker({ label, value, onChange, excludeId, hint }) {
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
        .get('/api/admin/referrer-changes/affiliates', {
          params: { search: term, excludeId: excludeId || undefined },
        })
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
  }, [search, excludeId])

  return (
    <div ref={boxRef}>
      <p className={labelClass}>{label}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}

      {value ? (
        <div className="mt-1.5 flex items-start justify-between gap-3 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{value.name || value.email}</p>
            <p className="truncate text-xs text-slate-600">
              {value.email}
              {value.referralCode ? ` · ${value.referralCode}` : ''}
              {value.phone ? ` · ${value.phone}` : ''}
            </p>
            {value.knowledgePackage ? (
              <p className="mt-1 text-[11px] font-medium text-slate-500">{value.knowledgePackage}</p>
            ) : (
              <p className="mt-1 text-[11px] font-medium text-slate-500">No package yet</p>
            )}
            {!value.active ? (
              <p className="mt-1 text-xs font-medium text-amber-700">This account is disabled</p>
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
      ) : (
        <div className="relative">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setOpen(true)
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search name, email, phone, or referral code"
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
                    <span className="shrink-0 text-xs text-slate-400">
                      {user.referralCount} direct{user.referralCount === 1 ? '' : 's'}
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

function ChangeReferrerModal({ onClose, onChanged }) {
  const [affiliate, setAffiliate] = useState(null)
  const [currentReferrer, setCurrentReferrer] = useState(null)
  const [newReferrer, setNewReferrer] = useState(null)
  const [reason, setReason] = useState('')
  const [loadingCurrent, setLoadingCurrent] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  useEffect(() => {
    if (!affiliate) {
      setCurrentReferrer(null)
      return undefined
    }
    let active = true
    setLoadingCurrent(true)
    setError('')
    api
      .get(`/api/admin/referrer-changes/${affiliate.id}`)
      .then((response) => {
        if (!active) return
        setCurrentReferrer(response.data.currentReferrer || null)
        if (response.data.affiliate) setAffiliate(response.data.affiliate)
      })
      .catch((err) => {
        if (!active) return
        setCurrentReferrer(null)
        setError(err.response?.data?.message || 'Could not load the current referrer')
      })
      .finally(() => {
        if (active) setLoadingCurrent(false)
      })
    return () => {
      active = false
    }
  }, [affiliate?.id])

  const save = async (event) => {
    event.preventDefault()
    if (!affiliate || !newReferrer) {
      setError('Choose both the affiliate and the new referrer')
      return
    }
    setSaving(true)
    setError('')
    try {
      const response = await api.post('/api/admin/referrer-changes', {
        userId: affiliate.id,
        newReferrerId: newReferrer.id,
        reason: reason.trim(),
      })
      onChanged(response.data.change)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not change the referrer')
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-4 py-10">
      <button type="button" className="fixed inset-0 cursor-pointer bg-slate-900/40" aria-label="Close" onClick={onClose} />
      <form onSubmit={save} className="relative w-full max-w-lg rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">Change referrer</h2>
            <p className="mt-1 text-sm text-slate-500">
              Move an affiliate under a new parent for future commissions only.
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

          <AffiliatePicker
            label="Affiliate to move"
            value={affiliate}
            onChange={(next) => {
              setAffiliate(next)
              setNewReferrer(null)
              setCurrentReferrer(null)
            }}
            hint="The person who asked to change their parent referrer."
          />

          {affiliate ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Current referrer</p>
              {loadingCurrent ? (
                <p className="mt-1 text-slate-500">Loading…</p>
              ) : currentReferrer ? (
                <>
                  <p className="mt-1 font-semibold text-slate-900">{currentReferrer.name || currentReferrer.email}</p>
                  <p className="text-xs text-slate-500">
                    {currentReferrer.email}
                    {currentReferrer.referralCode ? ` · ${currentReferrer.referralCode}` : ''}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-slate-500">No current referrer on file</p>
              )}
            </div>
          ) : null}

          <AffiliatePicker
            label="New referrer"
            value={newReferrer}
            onChange={setNewReferrer}
            excludeId={affiliate?.id}
            hint="This person becomes the parent for future commissions."
          />

          <label className={labelClass}>
            Reason
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder="Example: Affiliate requested parent change after speaking with support on call"
              className={fieldClass}
              required
            />
          </label>

          <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-950">
            <p className="font-semibold">What changes</p>
            <ul className="list-disc space-y-1 pl-4 text-xs leading-5">
              <li>Past commissions stay with the old referrer</li>
              <li>Future sales from this affiliate’s team pay the new referrer passive / second level</li>
              <li>If this affiliate upgrades a package later, the new referrer gets active on that upgrade</li>
            </ul>
          </div>
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
            disabled={saving || !affiliate || !newReferrer}
            className="cursor-pointer rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Change referrer'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

function ChangeReferrerPage() {
  const [changes, setChanges] = useState([])
  const [stats, setStats] = useState({ total: 0, today: 0 })
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [changing, setChanging] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/api/admin/referrer-changes', {
        params: { search: search.trim() || undefined, page, pageSize: 25 },
      })
      setChanges(response.data.changes || [])
      setStats((prev) => response.data.stats || prev)
      setTotal(response.data.total || 0)
      setTotalPages(response.data.totalPages || 1)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load referrer changes')
      setChanges([])
    } finally {
      setLoading(false)
    }
  }, [search, page])

  useEffect(() => {
    const timer = setTimeout(load, 200)
    return () => clearTimeout(timer)
  }, [load])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Change referrer</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Reassign an affiliate’s parent in the chain. Old commissions stay where they are. Future team sales and
            later package upgrades follow the new referrer.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setNotice('')
            setChanging(true)
          }}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          Change referrer
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard label="Total changes" value={stats.total} hint="All recorded parent reassignments" />
        <StatCard label="Changed today" value={stats.today} hint="Since midnight IST" />
        <StatCard label="Listed here" value={total} hint="Matching current search" />
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">Commission effect</p>
        <p className="mt-0.5 text-xs leading-5 text-slate-600">
          After a change, the new parent earns <span className="font-semibold">passive / second</span> from this
          affiliate’s team. If this affiliate later <span className="font-semibold">upgrades a package</span>, the new
          parent also gets <span className="font-semibold">active</span> on that upgrade. Already-paid commissions are
          never moved.
        </p>
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative w-full md:w-96">
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
            placeholder="Search affiliate, old/new referrer, or reason…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-400"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">When</th>
                <th className="px-4 py-3.5">Affiliate</th>
                <th className="px-4 py-3.5">Old referrer</th>
                <th className="px-4 py-3.5">New referrer</th>
                <th className="px-5 py-3.5">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-slate-400">
                    Loading…
                  </td>
                </tr>
              ) : changes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-14 text-center">
                    <p className="text-base font-semibold text-slate-700">No referrer changes yet</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {search
                        ? 'Try a different search.'
                        : 'Use “Change referrer” when an affiliate asks to move under a new parent.'}
                    </p>
                  </td>
                </tr>
              ) : (
                changes.map((change) => (
                  <tr key={change.id} className="align-top hover:bg-slate-50/70">
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {dateTime(change.createdAt)}
                      {change.createdBy?.name ? (
                        <p className="mt-0.5 text-slate-400">by {change.createdBy.name}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <Link
                        to={`/commissions/earners/${change.affiliate.id}`}
                        className="font-semibold text-slate-900 hover:text-brand-700 hover:underline"
                      >
                        {change.affiliate.name || change.affiliate.email || '—'}
                      </Link>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {change.affiliate.email}
                        {change.affiliate.referralCode ? ` · ${change.affiliate.referralCode}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      {change.oldReferrer ? (
                        <>
                          <p className="font-medium text-slate-800">{change.oldReferrer.name || change.oldReferrer.email}</p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            {change.oldReferrer.email}
                            {change.oldReferrer.referralCode ? ` · ${change.oldReferrer.referralCode}` : ''}
                          </p>
                        </>
                      ) : (
                        <p className="text-slate-400">None</p>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-emerald-800">{change.newReferrer.name || change.newReferrer.email}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {change.newReferrer.email}
                        {change.newReferrer.referralCode ? ` · ${change.newReferrer.referralCode}` : ''}
                      </p>
                    </td>
                    <td className="max-w-xs px-5 py-4 text-xs text-slate-600">
                      <p className="whitespace-pre-line">{change.reason || '—'}</p>
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
              Page {page} of {totalPages} · {total} changes
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

      {changing ? (
        <ChangeReferrerModal
          onClose={() => setChanging(false)}
          onChanged={(change) => {
            setChanging(false)
            setNotice(
              `${change.affiliate.name || change.affiliate.email} is now under ${
                change.newReferrer.name || change.newReferrer.email
              }. Past commissions stay with the old referrer.`,
            )
            setPage(1)
            load()
          }}
        />
      ) : null}
    </div>
  )
}

export default ChangeReferrerPage
