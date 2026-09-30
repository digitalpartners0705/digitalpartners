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

const uploadFile = async (courseId, kind, file, onProgress) => {
  const body = new FormData()
  body.append('courseId', courseId)
  body.append('kind', kind)
  body.append('file', file)
  const response = await api.post('/api/admin/uploads', body, {
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
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={upload.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Video upload progress"
      >
        <div className="h-full rounded-full bg-brand-600 transition-[width] duration-200" style={{ width: `${upload.percent}%` }} />
      </div>
      <p className="mt-1.5 text-xs text-slate-500">
        {upload.phase === 'saving'
          ? 'File received. Saving the video…'
          : `${formatBytes(upload.loaded)} of ${formatBytes(upload.total)} · ${remaining}% remaining`}
      </p>
    </div>
  )
}

function CourseLessons() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [course, setCourse] = useState(null)
  const [lessons, setLessons] = useState([])
  const [storageConfigured, setStorageConfigured] = useState(true)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonMinutes, setLessonMinutes] = useState(5)
  const [lessonFile, setLessonFile] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editMinutes, setEditMinutes] = useState(5)
  const [editFile, setEditFile] = useState(null)
  const [savingLesson, setSavingLesson] = useState(false)
  const [adding, setAdding] = useState(false)
  const [upload, setUpload] = useState(null)

  useEffect(() => {
    api.get('/api/admin/meta').then((response) => {
      setStorageConfigured(Boolean(response.data.storageConfigured))
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    api
      .get(`/api/admin/courses/${id}`)
      .then((response) => {
        setCourse(response.data.course)
        setLessons(response.data.lessons || [])
        setError('')
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load this course'))
      .finally(() => setLoading(false))
  }, [id])

  const addLesson = async (event) => {
    event.preventDefault()
    setError('')
    setAdding(true)
    try {
      let storageKey = null
      if (lessonFile) {
        setUpload({ name: lessonFile.name, percent: 0, loaded: 0, total: lessonFile.size, phase: 'uploading', target: 'add' })
        storageKey = await uploadFile(id, 'lesson', lessonFile, (progress) => setUpload({ ...progress, target: 'add' }))
      }
      const response = await api.post(`/api/admin/courses/${id}/lessons`, {
        title: lessonTitle,
        durationSeconds: Math.round(Number(lessonMinutes) * 60) || 0,
        storageKey,
      })
      setLessons((current) => [...current, response.data.lesson])
      setLessonTitle('')
      setLessonFile(null)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not add the lesson')
    } finally {
      setAdding(false)
      setUpload(null)
    }
  }

  const moveLesson = async (index, direction) => {
    const next = [...lessons]
    const target = index + direction
    if (target < 0 || target >= next.length) return
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item)
    setLessons(next)
    try {
      const response = await api.post(`/api/admin/courses/${id}/lessons/reorder`, {
        ids: next.map((lesson) => lesson.id),
      })
      setLessons(response.data.lessons)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reorder lessons')
    }
  }

  const removeLesson = async (lesson) => {
    if (!window.confirm(`Delete “${lesson.title}”?`)) return
    try {
      await api.delete(`/api/admin/lessons/${lesson.id}`)
      setLessons((current) => current.filter((item) => item.id !== lesson.id))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the lesson')
    }
  }

  const startEdit = (lesson) => {
    setEditingId(lesson.id)
    setEditTitle(lesson.title)
    setEditMinutes(Number(((Number(lesson.durationSeconds) || 0) / 60).toFixed(2)))
    setEditFile(null)
    setError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditFile(null)
  }

  const saveEdit = async (event) => {
    event.preventDefault()
    if (!editingId) return
    setSavingLesson(true)
    setError('')
    try {
      const body = {
        title: editTitle.trim(),
        durationSeconds: Math.round(Number(editMinutes) * 60) || 0,
      }
      if (editFile) {
        setUpload({ name: editFile.name, percent: 0, loaded: 0, total: editFile.size, phase: 'uploading', target: 'edit' })
        body.storageKey = await uploadFile(id, 'lesson', editFile, (progress) => setUpload({ ...progress, target: 'edit' }))
      }
      const response = await api.patch(`/api/admin/lessons/${editingId}`, body)
      setLessons((current) => current.map((item) => (item.id === editingId ? response.data.lesson : item)))
      setEditingId(null)
      setEditFile(null)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not update the lesson')
    } finally {
      setSavingLesson(false)
      setUpload(null)
    }
  }

  const removeCourse = async () => {
    if (!course) return
    if (!window.confirm(`Delete “${course.title}”? This removes its lessons too.`)) return
    setDeleting(true)
    try {
      await api.delete(`/api/admin/courses/${id}`)
      navigate('/courses', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the course')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        <div className="h-64 animate-pulse rounded-lg bg-white" />
      </div>
    )
  }

  if (!course) {
    return <p className="text-sm text-red-600">{error || 'Could not load this course'}</p>
  }

  const published = course.status === 'published'

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link to="/courses" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            ← All courses
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{course.title}</h1>
            <span
              className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
              }`}
            >
              {published ? 'Published' : 'Draft'}
            </span>
            {course.packageName ? (
              <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                {course.packageName}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {course.instructor}
            {course.tag ? ` · ${course.tag}` : ''}
            {` · ${lessons.length} ${lessons.length === 1 ? 'lesson' : 'lessons'}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/courses/${id}/edit`}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Edit course
          </Link>
          <button
            type="button"
            onClick={removeCourse}
            disabled={deleting}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {deleting ? 'Deleting...' : 'Delete course'}
          </button>
        </div>
      </div>

      {!storageConfigured ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Storage is not connected yet. You can still add lesson titles. Video uploads work after the bucket keys are added.
        </p>
      ) : null}
      {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <section className="mt-5 rounded-lg border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Lessons</h2>
          <p className="mt-0.5 text-xs text-slate-500">
            {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}. Order is what learners see.
          </p>
        </div>

        <form onSubmit={addLesson} className="grid gap-3 border-b border-slate-100 bg-slate-50 p-4 md:grid-cols-[minmax(0,1fr)_6.5rem_auto]">
          <Field label="Lesson title">
            <input
              value={lessonTitle}
              onChange={(event) => setLessonTitle(event.target.value)}
              placeholder="Introduction"
              className={fieldClass}
              required
            />
          </Field>
          <Field label="Minutes">
            <input
              type="number"
              min="0"
              value={lessonMinutes}
              onChange={(event) => setLessonMinutes(event.target.value)}
              className={fieldClass}
            />
          </Field>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={adding}
              className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {adding ? 'Uploading...' : 'Add lesson'}
            </button>
          </div>
          <label className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-3">
            Video
            <span className="mt-1.5 flex items-center justify-between rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-700">
              {lessonFile ? lessonFile.name : 'Optional mp4, webm, or mov'}
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(event) => setLessonFile(event.target.files?.[0] || null)}
                className="sr-only"
              />
            </span>
          </label>
          {upload?.target === 'add' ? <UploadProgress upload={upload} /> : null}
        </form>

        {lessons.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-slate-500">No lessons yet. Add the first one above.</p>
        ) : (
          <ol>
            {lessons.map((lesson, index) =>
              editingId === lesson.id ? (
                <li key={lesson.id} className="border-b border-slate-100 bg-slate-50 px-4 py-4 last:border-b-0">
                  <form onSubmit={saveEdit} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_6.5rem_auto]">
                    <Field label="Lesson title">
                      <input value={editTitle} onChange={(event) => setEditTitle(event.target.value)} className={fieldClass} required />
                    </Field>
                    <Field label="Minutes">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={editMinutes}
                        onChange={(event) => setEditMinutes(event.target.value)}
                        className={fieldClass}
                      />
                    </Field>
                    <div className="flex items-end gap-2">
                      <button
                        type="submit"
                        disabled={savingLesson}
                        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {savingLesson ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                    </div>
                    <label className="cursor-pointer text-xs font-semibold uppercase tracking-wide text-slate-500 md:col-span-3">
                      Video
                      <span className="mt-1.5 flex items-center justify-between rounded-lg border border-dashed border-slate-300 bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-slate-700">
                        {editFile ? editFile.name : lesson.hasVideo ? 'Keep current video, or choose a new file' : 'No video yet. Optional mp4, webm, or mov'}
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/quicktime"
                          onChange={(event) => setEditFile(event.target.files?.[0] || null)}
                          className="sr-only"
                        />
                      </span>
                    </label>
                    {upload?.target === 'edit' ? <UploadProgress upload={upload} /> : null}
                  </form>
                </li>
              ) : (
                <li key={lesson.id} className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0 sm:flex-row sm:items-center">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-600">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{lesson.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {lesson.duration}
                      <span className="mx-1.5 text-slate-300">·</span>
                      {lesson.hasVideo ? 'Video ready' : 'No video'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => moveLesson(index, -1)}
                      disabled={index === 0}
                      className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      onClick={() => moveLesson(index, 1)}
                      disabled={index === lessons.length - 1}
                      className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                    >
                      Down
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(lesson)}
                      className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                    >
                      Edit
                    </button>
                    <button type="button" onClick={() => removeLesson(lesson)} className="rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
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

export default CourseLessons
