import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import api from '../services/api'

const STATUS_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
]

const KIND_FILTERS = [
  { id: 'all', label: 'All types' },
  { id: 'featured', label: 'Featured' },
  { id: 'notice', label: 'Notices' },
]

const PANELS = [
  { value: 'courses', label: 'Courses visual' },
  { value: 'files', label: 'Files visual' },
]

const ICONS = [
  { value: 'rooms', label: 'Community' },
  { value: 'shield', label: 'KYC / shield' },
  { value: 'note', label: 'Note' },
  { value: 'link', label: 'Link' },
  { value: 'megaphone', label: 'Megaphone' },
]

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500'

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

function emptyForm(kind = 'notice') {
  return {
    kind,
    tag: kind === 'featured' ? 'Update' : '',
    title: '',
    body: '',
    panel: 'courses',
    icon: 'megaphone',
    displayDate: '',
    status: 'published',
    sortOrder: 0,
  }
}

function AnnouncementModal({ initial, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
    initial
      ? {
          kind: initial.kind,
          tag: initial.tag || '',
          title: initial.title || '',
          body: initial.body || '',
          panel: initial.panel || 'courses',
          icon: initial.icon || 'megaphone',
          displayDate: initial.displayDate || '',
          status: initial.status || 'draft',
          sortOrder: initial.sortOrder ?? 0,
        }
      : emptyForm('featured'),
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
        kind: form.kind,
        tag: form.tag,
        title: form.title.trim(),
        body: form.body.trim(),
        panel: form.panel,
        icon: form.icon,
        displayDate: form.displayDate.trim(),
        status: form.status,
        sortOrder: Number(form.sortOrder) || 0,
      }
      const response = initial
        ? await api.patch(`/api/admin/announcements/${initial.id}`, payload)
        : await api.post('/api/admin/announcements', payload)
      onSaved(response.data.announcement)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save announcement')
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
              {initial ? 'Edit announcement' : 'New announcement'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Published items show in the affiliate Announcements page.</p>
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
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</p>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {[
                { value: 'featured', label: 'Featured card' },
                { value: 'notice', label: 'Notice row' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => update('kind', item.value)}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold ${
                    form.kind === item.value
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {form.kind === 'featured' ? (
            <>
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Tag
                <input
                  value={form.tag}
                  onChange={(event) => update('tag', event.target.value)}
                  placeholder="This month"
                  className={fieldClass}
                />
              </label>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visual panel</p>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {PANELS.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => update('panel', item.value)}
                      className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold ${
                        form.panel === item.value
                          ? 'border-brand-600 bg-brand-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Icon</p>
              <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ICONS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => update('icon', item.value)}
                    className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold ${
                      form.icon === item.value
                        ? 'border-brand-600 bg-brand-600 text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

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

          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Body
            <textarea
              value={form.body}
              onChange={(event) => update('body', event.target.value)}
              rows={4}
              className={fieldClass}
              required
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Display date
              <input
                value={form.displayDate}
                onChange={(event) => update('displayDate', event.target.value)}
                placeholder="27 Sep 2026"
                className={fieldClass}
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
            {saving ? 'Saving...' : initial ? 'Save changes' : 'Create announcement'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

function AnnouncementsPage() {
  const [items, setItems] = useState([])
  const [stats, setStats] = useState({ total: 0, published: 0, draft: 0, featured: 0, notice: 0 })
  const [status, setStatus] = useState('all')
  const [kind, setKind] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/api/admin/announcements', {
        params: { status, kind, search: search.trim() || undefined },
      })
      setItems(response.data.announcements || [])
      setStats(response.data.stats || { total: 0, published: 0, draft: 0, featured: 0, notice: 0 })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load announcements')
    } finally {
      setLoading(false)
    }
  }, [status, kind, search])

  useEffect(() => {
    const timer = setTimeout(load, 200)
    return () => clearTimeout(timer)
  }, [load])

  const featuredCount = useMemo(() => items.filter((item) => item.kind === 'featured').length, [items])

  const togglePublish = async (item) => {
    try {
      const nextStatus = item.status === 'published' ? 'draft' : 'published'
      await api.patch(`/api/admin/announcements/${item.id}`, { status: nextStatus })
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update status')
    }
  }

  const remove = async (item) => {
    if (!window.confirm(`Delete “${item.title}”?`)) return
    try {
      await api.delete(`/api/admin/announcements/${item.id}`)
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete announcement')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Announcements</h1>
          <p className="mt-1 text-sm text-slate-500">
            Publish campaign notes for affiliates. Featured cards and notice rows appear on their Announcements page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModal({ mode: 'create' })}
          className="cursor-pointer rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          New announcement
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Published" value={stats.published} />
        <StatCard label="Drafts" value={stats.draft} />
        <StatCard label="Featured" value={stats.featured} />
        <StatCard label="Notices" value={stats.notice} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
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
        <div className="flex flex-wrap gap-2">
          {KIND_FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setKind(item.id)}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-semibold ${
                kind === item.id
                  ? 'bg-brand-600 text-white'
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
          placeholder="Search title or body"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 lg:max-w-xs"
        />
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Loading announcements...</p> : null}

      {!loading && items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-900">No announcements yet</p>
          <p className="mt-2 text-sm text-slate-500">Create a featured card or notice for the affiliate panel.</p>
        </div>
      ) : null}

      {!loading && items.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Announcement</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Date</th>
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
                    <p className="mt-1 line-clamp-2 text-slate-500">{item.body}</p>
                    {item.tag ? <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-brand-700">{item.tag}</p> : null}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600">{item.kind}</td>
                  <td className="px-4 py-3 text-slate-600">{item.displayDate || '—'}</td>
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
          <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            Showing {items.length} · {featuredCount} featured in this view
          </p>
        </div>
      ) : null}

      {modal ? (
        <AnnouncementModal
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

export default AnnouncementsPage
