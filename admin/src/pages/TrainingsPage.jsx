import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

const filters = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
]

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
    </div>
  )
}

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500'

function NewDayModal({ nextNumber, onClose, onCreated }) {
  const [dayNumber, setDayNumber] = useState(nextNumber)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('published')
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
      const response = await api.post('/api/admin/trainings', {
        dayNumber: Number(dayNumber),
        title: title.trim(),
        status,
      })
      onCreated(response.data.day)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create the training day')
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 cursor-pointer bg-slate-900/40" aria-label="Close" onClick={onClose} />
      <form onSubmit={save} className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-slate-900">New day</h2>
            <p className="mt-1 text-sm text-slate-500">Add the day, then upload its videos.</p>
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
          <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-3">
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Day
              <input
                type="number"
                min="1"
                value={dayNumber}
                onChange={(event) => setDayNumber(event.target.value)}
                className={fieldClass}
                required
              />
            </label>
            <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Title
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Introduction"
                className={fieldClass}
                required
                autoFocus
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
                  onClick={() => setStatus(item.value)}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-sm font-semibold ${
                    status === item.value
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
            {saving ? 'Creating...' : 'Create day'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}

function TrainingsPage() {
  const navigate = useNavigate()
  const [days, setDays] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [creating, setCreating] = useState(false)

  const load = () => {
    setLoading(true)
    api
      .get('/api/admin/trainings')
      .then((response) => {
        setDays(response.data.days || [])
        setError('')
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load training days'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const nextNumber = days.reduce((max, day) => Math.max(max, day.dayNumber), 0) + 1
  const published = days.filter((day) => day.status === 'published').length
  const drafts = days.filter((day) => day.status !== 'published').length
  const videoCount = days.reduce((sum, day) => sum + day.videos, 0)

  const results = useMemo(() => {
    const value = query.trim().toLowerCase()
    return days.filter((day) => {
      if (filter === 'published' && day.status !== 'published') return false
      if (filter === 'draft' && day.status === 'published') return false
      if (!value) return true
      return `day ${day.dayNumber} ${day.title}`.toLowerCase().includes(value)
    })
  }, [days, query, filter])

  const remove = async (day) => {
    if (!window.confirm(`Delete day ${day.dayNumber}, “${day.title}”? This removes its videos too.`)) return
    try {
      await api.delete(`/api/admin/trainings/${day.id}`)
      setDays((current) => current.filter((item) => item.id !== day.id))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the training day')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Training</h1>
          <p className="mt-1 text-slate-500">Add days, publish them, and upload the videos for each day.</p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          New day
        </button>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Days" value={loading ? '—' : days.length} />
        <StatCard label="Published" value={loading ? '—' : published} />
        <StatCard label="Drafts" value={loading ? '—' : drafts} />
        <StatCard label="Videos" value={loading ? '—' : videoCount} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => {
            const active = filter === item.id
            const count = item.id === 'all' ? days.length : item.id === 'published' ? published : drafts
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'bg-brand-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-brand-700'
                }`}
              >
                {item.label}
                <span className={`ml-1.5 ${active ? 'text-white/80' : 'text-slate-400'}`}>{loading ? '' : count}</span>
              </button>
            )
          })}
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search day or title"
          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm outline-none focus:border-brand-500 sm:max-w-xs"
        />
      </div>

      {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      {loading ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
              <div className="h-24 animate-pulse bg-slate-100" />
              <div className="space-y-2 p-3">
                <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && days.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-900">No training days yet</p>
          <p className="mt-2 text-sm text-slate-500">Add the first day, then upload its videos.</p>
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="mt-5 inline-flex cursor-pointer rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            New day
          </button>
        </div>
      ) : null}

      {!loading && days.length > 0 && results.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-900">No days match</p>
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setFilter('all')
            }}
            className="mt-5 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Clear filters
          </button>
        </div>
      ) : null}

      {!loading && results.length > 0 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {results.map((day) => {
            const isPublished = day.status === 'published'
            return (
              <article key={day.id} className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
                <Link to={`/trainings/${day.id}`} className="relative block h-24 overflow-hidden bg-slate-900">
                  <div className="flex h-full items-end bg-gradient-to-br from-brand-600 to-slate-900 p-3">
                    <p className="text-lg font-extrabold text-white">Day {day.dayNumber}</p>
                  </div>
                  <span
                    className={`absolute left-2 top-2 rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                      isPublished ? 'bg-white text-emerald-700' : 'bg-white text-amber-800'
                    }`}
                  >
                    {isPublished ? 'Published' : 'Draft'}
                  </span>
                </Link>
                <div className="flex flex-1 flex-col p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">Day {day.dayNumber}</p>
                  <h2 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-slate-900">
                    <Link to={`/trainings/${day.id}`} className="hover:text-brand-700">
                      {day.title}
                    </Link>
                  </h2>
                  <p className="mt-2 text-xs text-slate-500">
                    {day.videos} {day.videos === 1 ? 'video' : 'videos'}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link
                      to={`/trainings/${day.id}`}
                      className="inline-flex flex-1 items-center justify-center rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(day)}
                      className="rounded-md border border-red-100 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : null}

      {creating ? (
        <NewDayModal
          nextNumber={nextNumber}
          onClose={() => setCreating(false)}
          onCreated={(day) => navigate(`/trainings/${day.id}`)}
        />
      ) : null}
    </div>
  )
}

export default TrainingsPage
