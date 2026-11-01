import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import api from '../services/api'

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
]

const REWARD_TYPES = [
  { value: 'none', label: 'No reward' },
  { value: 'trip', label: 'Trip' },
  { value: 'gift', label: 'Gift' },
  { value: 'bonus', label: 'Bonus' },
  { value: 'other', label: 'Other' },
]

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500'

function formatMoney(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number(amount) || 0)
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
    </div>
  )
}

function StatusBadge({ status }) {
  const published = status === 'published'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        published
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-slate-100 text-slate-600 ring-slate-200'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${published ? 'bg-emerald-500' : 'bg-slate-400'}`} />
      {published ? 'Published' : 'Draft'}
    </span>
  )
}

function RewardBadge({ type, title }) {
  if (!type || type === 'none') {
    return <span className="text-xs text-slate-400">No reward</span>
  }
  return (
    <span className="inline-flex flex-col gap-0.5">
      <span className="inline-flex w-fit rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold capitalize text-amber-800 ring-1 ring-amber-200">
        {type}
      </span>
      {title ? <span className="text-xs font-medium text-slate-700">{title}</span> : null}
    </span>
  )
}

function emptyForm() {
  return {
    title: '',
    amount: '',
    note: '',
    rewardType: 'none',
    rewardTitle: '',
    rewardDescription: '',
    status: 'published',
    sortOrder: 0,
  }
}

function MilestoneModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          title: initial.title || '',
          amount: initial.amount ?? '',
          note: initial.note || '',
          rewardType: initial.rewardType || 'none',
          rewardTitle: initial.rewardTitle || '',
          rewardDescription: initial.rewardDescription || '',
          status: initial.status || 'draft',
          sortOrder: initial.sortOrder ?? 0,
        }
      : emptyForm(),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        title: form.title.trim(),
        amount: Number(form.amount),
        note: form.note.trim(),
        rewardType: form.rewardType,
        rewardTitle: form.rewardTitle.trim(),
        rewardDescription: form.rewardDescription.trim(),
        status: form.status,
        sortOrder: Number(form.sortOrder) || 0,
      }
      const response = initial
        ? await api.patch(`/api/admin/achievements/${initial.id}`, payload)
        : await api.post('/api/admin/achievements', payload)
      onSaved(response.data.milestone)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save milestone')
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 cursor-pointer bg-slate-900/40" aria-label="Close" onClick={onClose} />
      <form
        onSubmit={save}
        className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
              {initial ? 'Edit milestone' : 'New milestone'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Set the commission target and optionally attach a trip, gift, or other reward.
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

          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Title
            <input
              value={form.title}
              onChange={(event) => update('title', event.target.value)}
              className={fieldClass}
              required
              autoFocus
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Target amount (₹)
              <input
                type="number"
                min="1"
                step="1"
                value={form.amount}
                onChange={(event) => update('amount', event.target.value)}
                className={fieldClass}
                required
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sort order
              <input
                type="number"
                value={form.sortOrder}
                onChange={(event) => update('sortOrder', event.target.value)}
                className={fieldClass}
              />
            </label>
          </div>

          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Note
            <textarea
              value={form.note}
              onChange={(event) => update('note', event.target.value)}
              rows={3}
              className={fieldClass}
              placeholder="Shown on the affiliate achievements board"
            />
          </label>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reward offer</p>
            <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {REWARD_TYPES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => update('rewardType', item.value)}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold ${
                    form.rewardType === item.value
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {form.rewardType !== 'none' ? (
            <>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reward title
                <input
                  value={form.rewardTitle}
                  onChange={(event) => update('rewardTitle', event.target.value)}
                  placeholder={form.rewardType === 'trip' ? 'Goa trip for 2' : 'Reward name'}
                  className={fieldClass}
                  required
                />
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Reward details
                <textarea
                  value={form.rewardDescription}
                  onChange={(event) => update('rewardDescription', event.target.value)}
                  rows={3}
                  placeholder="What the affiliate gets when they unlock this milestone"
                  className={fieldClass}
                />
              </label>
            </>
          ) : null}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {[
                { value: 'draft', label: 'Draft' },
                { value: 'published', label: 'Published' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => update('status', item.value)}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold ${
                    form.status === item.value
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
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
            {saving ? 'Saving...' : initial ? 'Save changes' : 'Create milestone'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

function AchievementsPage() {
  const [items, setItems] = useState([])
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, with_reward: 0 })
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/api/admin/achievements', {
        params: { status, search: search.trim() || undefined },
      })
      setItems(response.data.milestones || [])
      setStats(response.data.stats || { total: 0, published: 0, draft: 0, with_reward: 0 })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load achievements')
    } finally {
      setLoading(false)
    }
  }, [status, search])

  useEffect(() => {
    const timer = setTimeout(load, 200)
    return () => clearTimeout(timer)
  }, [load])

  const togglePublish = async (item) => {
    try {
      const nextStatus = item.status === 'published' ? 'draft' : 'published'
      await api.patch(`/api/admin/achievements/${item.id}`, { status: nextStatus })
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update status')
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`Delete “${item.title}”?`)) return
    try {
      await api.delete(`/api/admin/achievements/${item.id}`)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete milestone')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Achievements</h1>
          <p className="mt-1 text-sm text-slate-500">
            Commission milestones for affiliates. Attach a trip, gift, bonus, or custom reward to any level.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: 'create' })}
          className="cursor-pointer rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          New milestone
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Published" value={stats.published} />
        <StatCard label="Drafts" value={stats.draft} />
        <StatCard label="With reward" value={stats.with_reward} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setStatus(item.id)}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                status === item.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search title, note, or reward"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 sm:max-w-xs"
        />
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Loading milestones...</p> : null}

      {!loading && items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-900">No milestones yet</p>
          <p className="mt-2 text-sm text-slate-500">Create commission targets for the affiliate achievements board.</p>
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Milestone</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Reward</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-slate-500">{item.note || '—'}</p>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800">{formatMoney(item.amount)}</td>
                  <td className="px-4 py-3">
                    <RewardBadge type={item.rewardType} title={item.rewardTitle} />
                  </td>
                  <td className="px-4 py-3 text-slate-600">{item.sortOrder}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setModal({ mode: 'edit', item })}
                        className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => togglePublish(item)}
                        className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        {item.status === 'published' ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(item)}
                        className="cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {modal ? (
        <MilestoneModal
          initial={modal.mode === 'edit' ? modal.item : null}
          onClose={() => setModal(null)}
          onSaved={async () => {
            setModal(null)
            await load()
          }}
        />
      ) : null}
    </div>
  )
}

export default AchievementsPage
