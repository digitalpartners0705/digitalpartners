import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import { dateOnly } from '../utils/orders'

const statusTabs = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'disabled', label: 'Disabled' },
]

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

function DisableAccountModal({ user, onClose, onConfirm }) {
  const [confirmEmail, setConfirmEmail] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && !saving) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [saving, onClose])

  const emailMatches = confirmEmail.trim().toLowerCase() === String(user.email || '').trim().toLowerCase()

  const handleDisable = async () => {
    if (!emailMatches || saving) return
    setSaving(true)
    setError('')
    try {
      const response = await api.patch(`/api/admin/users/${user.id}/status`, { active: false })
      onConfirm(response.data?.user || { ...user, active: false })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not disable this account')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-slate-900">Disable this account?</h2>
        <p className="mt-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">{user.fullName || user.email}</span> will not be able to log
          in or use the app. All of their data stays in the system and you can re-enable them later.
        </p>

        <ul className="mt-4 space-y-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <li>Login and API access are blocked immediately</li>
          <li>Orders, KYC, commissions, and referrals are kept</li>
          <li>You can restore access anytime from this page</li>
        </ul>

        <label className="mt-5 block text-sm font-semibold text-slate-800">
          Type <span className="font-mono text-xs">{user.email}</span> to confirm
          <input
            type="email"
            value={confirmEmail}
            autoFocus
            disabled={saving}
            onChange={(event) => setConfirmEmail(event.target.value)}
            placeholder="Account email"
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal text-slate-800 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300"
          />
        </label>

        {error ? <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!emailMatches || saving}
            onClick={handleDisable}
            className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-40"
          >
            {saving ? 'Disabling…' : 'Disable account'}
          </button>
        </div>
      </div>
    </div>
  )
}

function UsersPage() {
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({ total: 0, active: 0, disabled: 0, withPackage: 0 })
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [total, setTotal] = useState(0)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [pendingDisable, setPendingDisable] = useState(null)

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/api/admin/users', {
        params: {
          status,
          search: search.trim() || undefined,
          page,
          pageSize,
        },
      })
      setUsers(response.data.users || [])
      setStats(response.data.stats || { total: 0, active: 0, disabled: 0, withPackage: 0 })
      setTotal(response.data.total || 0)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load accounts')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [status, search, page, pageSize])

  useEffect(() => {
    const timer = setTimeout(loadUsers, 200)
    return () => clearTimeout(timer)
  }, [loadUsers])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const applyUpdatedUser = (updated) => {
    setUsers((prev) => {
      if (status === 'active' && !updated.active) return prev.filter((row) => row.id !== updated.id)
      if (status === 'disabled' && updated.active) return prev.filter((row) => row.id !== updated.id)
      return prev.map((row) =>
        row.id === updated.id
          ? {
              ...row,
              active: updated.active,
              disabledAt: updated.disabledAt || null,
            }
          : row,
      )
    })
    setStats((prev) => {
      if (updated.active) {
        return {
          ...prev,
          active: (prev.active || 0) + 1,
          disabled: Math.max(0, (prev.disabled || 0) - 1),
        }
      }
      return {
        ...prev,
        active: Math.max(0, (prev.active || 0) - 1),
        disabled: (prev.disabled || 0) + 1,
      }
    })
  }

  const handleDisabled = (updated) => {
    setPendingDisable(null)
    applyUpdatedUser({ ...updated, active: false })
    setNotice(`${updated.fullName || updated.email} can no longer log in. Their data is still kept.`)
  }

  const enableUser = async (user) => {
    const name = user.fullName || user.email
    const ok = window.confirm(`Re-enable ${name}?\n\nThey will be able to log in and use the app again.`)
    if (!ok) return

    setUpdatingId(user.id)
    setError('')
    setNotice('')
    try {
      const response = await api.patch(`/api/admin/users/${user.id}/status`, { active: true })
      const updated = response.data?.user || { ...user, active: true }
      applyUpdatedUser({ ...updated, active: true })
      setNotice(`${updated.fullName || updated.email} was re-enabled.`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not re-enable this account')
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Users</h1>
        <p className="mt-1 text-sm text-slate-500">
          Disable an account to block login without deleting data. Orders, KYC, commissions, and referrals stay in the
          system and can be restored later.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Accounts" value={stats.total} hint="Admin accounts are not listed" />
        <StatCard label="Active" value={stats.active} hint="Can log in" tone="success" />
        <StatCard
          label="Disabled"
          value={stats.disabled}
          hint="Blocked from login"
          tone={stats.disabled > 0 ? 'warning' : 'default'}
        />
        <StatCard label="With a package" value={stats.withPackage} hint="Have course access" />
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {notice ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{notice}</p> : null}

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center rounded-lg bg-slate-100 p-1">
          {statusTabs.map((tab) => {
            const active = status === tab.id
            const count =
              tab.id === 'all' ? stats.total : tab.id === 'disabled' ? stats.disabled : stats.active
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatus(tab.id)
                  setPage(1)
                  setNotice('')
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
              setNotice('')
            }}
            placeholder="Search name, email, phone, referral code…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-400"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">Account</th>
                <th className="px-4 py-3.5">Phone</th>
                <th className="px-4 py-3.5">Referral code</th>
                <th className="px-4 py-3.5">Orders</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Joined</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400">
                    Loading accounts…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-14 text-center">
                    <p className="text-base font-semibold text-slate-700">No accounts found</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {search || status !== 'all'
                        ? 'Try a different search or filter.'
                        : 'New sign-ups will appear here.'}
                    </p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">{user.fullName || '—'}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{user.email || '—'}</p>
                      {user.knowledgePackage ? (
                        <p className="mt-1 text-[11px] font-medium text-slate-400">{user.knowledgePackage}</p>
                      ) : (
                        <p className="mt-1 text-[11px] font-medium text-slate-400">No package</p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-700">{user.phone || '—'}</td>
                    <td className="px-4 py-4 font-mono text-xs tracking-wide text-slate-700">
                      {user.referralCode || '—'}
                    </td>
                    <td className="px-4 py-4 font-semibold text-slate-900">{user.orderCount}</td>
                    <td className="px-4 py-4">
                      {user.active ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-slate-600">{dateOnly(user.createdAt)}</td>
                    <td className="px-5 py-4 text-right">
                      {user.active ? (
                        <button
                          type="button"
                          onClick={() => {
                            setNotice('')
                            setPendingDisable(user)
                          }}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 transition hover:bg-amber-100"
                        >
                          Disable
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={updatingId === user.id}
                          onClick={() => enableUser(user)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {updatingId === user.id ? 'Saving…' : 'Re-enable'}
                        </button>
                      )}
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
              Page {page} of {totalPages}
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

      {pendingDisable ? (
        <DisableAccountModal
          user={pendingDisable}
          onClose={() => setPendingDisable(null)}
          onConfirm={handleDisabled}
        />
      ) : null}
    </div>
  )
}

export default UsersPage
