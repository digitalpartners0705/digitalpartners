import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500'

function TrainingEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const [dayNumber, setDayNumber] = useState(1)
  const [title, setTitle] = useState('')
  const [status, setStatus] = useState('published')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)

  useEffect(() => {
    if (!id) return undefined
    setLoading(true)
    api
      .get(`/api/admin/trainings/${id}`)
      .then((response) => {
        const day = response.data.day
        setDayNumber(day.dayNumber)
        setTitle(day.title)
        setStatus(day.status)
        setError('')
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load this day'))
      .finally(() => setLoading(false))
    return undefined
  }, [id])

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    const payload = { dayNumber: Number(dayNumber), title: title.trim(), status }
    try {
      if (isNew) {
        const response = await api.post('/api/admin/trainings', payload)
        navigate(`/trainings/${response.data.day.id}`, { replace: true })
        return
      }
      await api.patch(`/api/admin/trainings/${id}`, payload)
      navigate(`/trainings/${id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the training day')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading day...</p>

  const published = status === 'published'

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to={isNew ? '/trainings' : `/trainings/${id}`} className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            {isNew ? '← All days' : '← Back to videos'}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{isNew ? 'New day' : 'Edit day'}</h1>
            <span
              className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
              }`}
            >
              {published ? 'Published' : 'Draft'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">{isNew ? 'Set the day number and title, then add videos.' : title}</p>
        </div>
        <button
          type="submit"
          form="training-form"
          disabled={saving}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : isNew ? 'Create day' : 'Save day'}
        </button>
      </div>

      {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <form id="training-form" onSubmit={save} className="mt-5 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Day details</h2>
            <p className="mt-0.5 text-xs text-slate-500">The number and title affiliates see on the training path.</p>
          </div>
          <div className="p-4">
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-3 ring-1 ring-slate-200">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                {String(Number(dayNumber) || 0).padStart(2, '0')}
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400">Preview</span>
                <span className="mt-0.5 block truncate text-sm font-semibold text-slate-900">{title.trim() || 'Day title'}</span>
              </span>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-[8.5rem_minmax(0,1fr)]">
              <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Day number
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
                />
              </label>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Publishing</h2>
            <p className="mt-0.5 text-xs text-slate-500">Draft days stay off the affiliate page.</p>
          </div>
          <div className="p-4">
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
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                    status === item.value
                      ? 'border-brand-600 bg-brand-600 text-white'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">
              {published
                ? 'Affiliates can open this day and play its videos.'
                : 'Save it as a draft, then publish when the videos are ready.'}
            </p>
          </div>
        </section>
      </form>
    </div>
  )
}

export default TrainingEditor
