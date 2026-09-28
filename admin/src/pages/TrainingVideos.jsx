import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500'

function Field({ label, children, className = '' }) {
  return (
    <label className={`block text-xs font-semibold uppercase tracking-wide text-slate-500 ${className}`}>
      {label}
      {children}
    </label>
  )
}

const formatBytes = (bytes) => {
  const size = Number(bytes) || 0
  if (size >= 1024 * 1024 * 1024) return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  if (size >= 1024) return `${Math.round(size / 1024)} KB`
  return `${size} B`
}

const uploadVideo = async (dayId, file, onProgress) => {
  const body = new FormData()
  body.append('file', file)
  const response = await api.post(`/api/admin/trainings/${dayId}/upload`, body, {
    onUploadProgress: (event) => {
      const total = event.total || file.size || 0
      const loaded = event.loaded || 0
      const percent = total ? Math.min(100, Math.round((loaded / total) * 100)) : 0
      onProgress?.({
        name: file.name,
        percent,
        loaded,
        total,
        phase: percent >= 100 ? 'saving' : 'uploading',
      })
    },
  })
  return response.data.storageKey
}

function UploadProgress({ upload }) {
  const remaining = Math.max(0, 100 - upload.percent)
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 md:col-span-3">
      <div className="flex items-center justify-between gap-3 text-xs">
        <p className="truncate font-medium text-slate-700">{upload.name}</p>
        <p className="shrink-0 font-semibold text-slate-900">{upload.percent}%</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={upload.percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-brand-600" style={{ width: `${upload.percent}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        {upload.phase === 'saving'
          ? 'File received. Saving the video…'
          : `${formatBytes(upload.loaded)} of ${formatBytes(upload.total)} · ${remaining}% remaining`}
      </p>
    </div>
  )
}

function TrainingVideos() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [day, setDay] = useState(null)
  const [videos, setVideos] = useState([])
  const [storageConfigured, setStorageConfigured] = useState(true)
  const [title, setTitle] = useState('')
  const [minutes, setMinutes] = useState(5)
  const [file, setFile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editMinutes, setEditMinutes] = useState(5)
  const [editFile, setEditFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [upload, setUpload] = useState(null)

  useEffect(() => {
    setLoading(true)
    api
      .get(`/api/admin/trainings/${id}`)
      .then((response) => {
        setDay(response.data.day)
        setVideos(response.data.videos || [])
        setStorageConfigured(Boolean(response.data.storageConfigured))
        setError('')
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load this day'))
      .finally(() => setLoading(false))
  }, [id])

  const addVideo = async (event) => {
    event.preventDefault()
    setError('')
    setAdding(true)
    try {
      let storageKey = null
      if (file) {
        setUpload({ name: file.name, percent: 0, loaded: 0, total: file.size, phase: 'uploading', target: 'add' })
        storageKey = await uploadVideo(id, file, (progress) => setUpload({ ...progress, target: 'add' }))
      }
      const response = await api.post(`/api/admin/trainings/${id}/videos`, {
        title: title.trim(),
        durationSeconds: Math.round(Number(minutes) * 60) || 0,
        storageKey,
      })
      setVideos((current) => [...current, response.data.video])
      setTitle('')
      setFile(null)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not add the video')
    } finally {
      setAdding(false)
      setUpload(null)
    }
  }

  const moveVideo = async (index, direction) => {
    const next = [...videos]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    setVideos(next)
    try {
      const response = await api.post(`/api/admin/trainings/${id}/videos/reorder`, { ids: next.map((video) => video.id) })
      setVideos(response.data.videos)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reorder videos')
    }
  }

  const removeVideo = async (video) => {
    if (!window.confirm(`Delete “${video.title}”?`)) return
    try {
      await api.delete(`/api/admin/training-videos/${video.id}`)
      setVideos((current) => current.filter((item) => item.id !== video.id))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the video')
    }
  }

  const startEdit = (video) => {
    setEditingId(video.id)
    setEditTitle(video.title)
    setEditMinutes(Number(((Number(video.durationSeconds) || 0) / 60).toFixed(2)))
    setEditFile(null)
    setError('')
  }

  const saveEdit = async (event) => {
    event.preventDefault()
    if (!editingId) return
    setSaving(true)
    setError('')
    try {
      const body = {
        title: editTitle.trim(),
        durationSeconds: Math.round(Number(editMinutes) * 60) || 0,
      }
      if (editFile) {
        setUpload({ name: editFile.name, percent: 0, loaded: 0, total: editFile.size, phase: 'uploading', target: 'edit' })
        body.storageKey = await uploadVideo(id, editFile, (progress) => setUpload({ ...progress, target: 'edit' }))
      }
      const response = await api.patch(`/api/admin/training-videos/${editingId}`, body)
      setVideos((current) => current.map((item) => (item.id === editingId ? response.data.video : item)))
      setEditingId(null)
      setEditFile(null)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not update the video')
    } finally {
      setSaving(false)
      setUpload(null)
    }
  }

  const removeDay = async () => {
    if (!day) return
    if (!window.confirm(`Delete day ${day.dayNumber}? This removes its videos too.`)) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/trainings/${id}`)
      navigate('/trainings', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the training day')
      setDeleting(false)
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading videos...</p>
  if (!day) return <p className="text-sm text-red-600">{error || 'Could not load this day'}</p>

  const published = day.status === 'published'

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/trainings" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            ← All days
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              Day {day.dayNumber} · {day.title}
            </h1>
            <span
              className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
              }`}
            >
              {published ? 'Published' : 'Draft'}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {videos.length} {videos.length === 1 ? 'video' : 'videos'}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/trainings/${id}/edit`} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700">
            Edit day
          </Link>
          <button
            type="button"
            onClick={removeDay}
            disabled={deleting}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {deleting ? 'Deleting...' : 'Delete day'}
          </button>
        </div>
      </div>

      {!storageConfigured ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Storage is not connected yet. You can still add video titles. Uploads work after the bucket keys are added.
        </p>
      ) : null}
      {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="mt-5 rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Videos</h2>
          <p className="mt-0.5 text-xs text-slate-500">Order is what affiliates see in the playlist.</p>
        </div>
        <form onSubmit={addVideo} className="grid gap-3 border-b border-slate-100 bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr)_6.5rem_auto]">
          <Field label="Video title">
            <input value={title} onChange={(event) => setTitle(event.target.value)} className={fieldClass} required />
          </Field>
          <Field label="Minutes">
            <input type="number" min="0" value={minutes} onChange={(event) => setMinutes(event.target.value)} className={fieldClass} />
          </Field>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={adding}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {adding ? 'Uploading...' : 'Add video'}
            </button>
          </div>
          <label className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-3">
            Video file
            <span className="mt-1.5 flex items-center justify-between rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-700">
              {file ? file.name : 'Optional mp4, webm, or mov'}
              <input type="file" accept="video/mp4,video/webm,video/quicktime" onChange={(event) => setFile(event.target.files?.[0] || null)} className="sr-only" />
            </span>
          </label>
          {upload?.target === 'add' ? <UploadProgress upload={upload} /> : null}
        </form>

        {videos.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">No videos yet. Add the first one above.</p>
        ) : (
          <ol>
            {videos.map((video, index) =>
              editingId === video.id ? (
                <li key={video.id} className="border-b border-slate-100 bg-slate-50 px-4 py-4 last:border-b-0">
                  <form onSubmit={saveEdit} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_6.5rem_auto]">
                    <Field label="Video title">
                      <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} className={fieldClass} required />
                    </Field>
                    <Field label="Minutes">
                      <input type="number" min="0" step="any" value={editMinutes} onChange={(event) => setEditMinutes(event.target.value)} className={fieldClass} />
                    </Field>
                    <div className="flex items-end gap-2">
                      <button type="submit" disabled={saving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button type="button" onClick={() => setEditingId(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600">
                        Cancel
                      </button>
                    </div>
                    <label className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-3">
                      Video
                      <span className="mt-1.5 flex rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-700">
                        {editFile ? editFile.name : video.hasVideo ? 'Keep current video, or choose a new file' : 'No video yet'}
                        <input type="file" accept="video/mp4,video/webm,video/quicktime" className="sr-only" onChange={(event) => setEditFile(event.target.files?.[0] || null)} />
                      </span>
                    </label>
                    {upload?.target === 'edit' ? <UploadProgress upload={upload} /> : null}
                  </form>
                </li>
              ) : (
                <li key={video.id} className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{video.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {video.duration}
                      <span className="mx-1.5 text-slate-300">·</span>
                      {video.hasVideo ? 'Video ready' : 'No video'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button type="button" onClick={() => moveVideo(index, -1)} disabled={index === 0} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 disabled:opacity-40">
                      Up
                    </button>
                    <button type="button" onClick={() => moveVideo(index, 1)} disabled={index === videos.length - 1} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 disabled:opacity-40">
                      Down
                    </button>
                    <button type="button" onClick={() => startEdit(video)} className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50">
                      Edit
                    </button>
                    <button type="button" onClick={() => removeVideo(video)} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                      Delete
                    </button>
                  </div>
                </li>
              ),
            )}
          </ol>
        )}
      </section>
    </div>
  )
}

export default TrainingVideos
