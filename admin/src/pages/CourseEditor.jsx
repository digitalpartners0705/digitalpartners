import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

const emptyForm = {
  title: '',
  instructor: '',
  description: '',
  category: '',
  packageId: '',
  accent: '',
  hours: 0,
  requiresUpgrade: false,
  status: 'draft',
}

const uploadFile = async (courseId, kind, file) => {
  const body = new FormData()
  body.append('courseId', courseId)
  body.append('kind', kind)
  body.append('file', file)
  const response = await api.post('/api/admin/uploads', body)
  return response.data.storageKey
}

function CourseEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id
  const [form, setForm] = useState(emptyForm)
  const [meta, setMeta] = useState({ categories: [], packages: [], accents: [], storageConfigured: false })
  const [lessons, setLessons] = useState([])
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState(null)
  const [lessonTitle, setLessonTitle] = useState('')
  const [lessonMinutes, setLessonMinutes] = useState(5)
  const [lessonFile, setLessonFile] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!isNew)

  useEffect(() => {
    api.get('/api/admin/meta').then((response) => {
      setMeta(response.data)
      setForm((current) => ({
        ...current,
        accent: current.accent || response.data.accents?.[0]?.id || '',
        category: current.category || response.data.categories?.[0]?.name || '',
      }))
    })
  }, [])

  useEffect(() => {
    if (!id) return undefined
    setLoading(true)
    api
      .get(`/api/admin/courses/${id}`)
      .then((response) => {
        const course = response.data.course
        setForm({
          title: course.title,
          instructor: course.instructor,
          description: course.description,
          category: course.tag,
          packageId: meta.packages.find((item) => item.name === course.packageName)?.packageId || '',
          accent: course.accent,
          hours: course.hours,
          requiresUpgrade: course.requiresUpgrade,
          status: course.status,
        })
        setThumbnailUrl(course.thumbnailUrl || '')
        setLessons(response.data.lessons || [])
        setError('')
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load this course'))
      .finally(() => setLoading(false))
    return undefined
  }, [id, meta.packages])

  const update = (event) => {
    const { name, value, type, checked } = event.target
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }))
  }

  const payload = () => ({
    ...form,
    hours: Number(form.hours) || 0,
    packageId: form.packageId || null,
  })

  const save = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (isNew) {
        const response = await api.post('/api/admin/courses', payload())
        navigate(`/courses/${response.data.course.courseId}`, { replace: true })
        return
      }

      let thumbnailKey
      if (thumbnailFile) {
        thumbnailKey = await uploadFile(id, 'thumbnail', thumbnailFile)
      }

      const response = await api.patch(`/api/admin/courses/${id}`, {
        ...payload(),
        ...(thumbnailKey ? { thumbnailKey } : {}),
      })
      setThumbnailUrl(response.data.course.thumbnailUrl || '')
      setThumbnailFile(null)
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not save the course')
    } finally {
      setSaving(false)
    }
  }

  const clearThumbnail = async () => {
    try {
      const response = await api.patch(`/api/admin/courses/${id}`, { ...payload(), thumbnailKey: null })
      setThumbnailUrl(response.data.course.thumbnailUrl || '')
      setThumbnailFile(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Could not remove the thumbnail')
    }
  }

  const addLesson = async (event) => {
    event.preventDefault()
    setError('')
    try {
      let storageKey = null
      if (lessonFile) storageKey = await uploadFile(id, 'lesson', lessonFile)
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

  const replaceVideo = async (lesson, file) => {
    if (!file) return
    try {
      const storageKey = await uploadFile(id, 'lesson', file)
      const response = await api.patch(`/api/admin/lessons/${lesson.id}`, { storageKey })
      setLessons((current) => current.map((item) => (item.id === lesson.id ? response.data.lesson : item)))
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not replace the video')
    }
  }

  if (loading) return <p className="text-sm text-slate-500">Loading course...</p>

  return (
    <div>
      <Link to="/" className="text-sm font-semibold text-brand-600">
        ← All courses
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{isNew ? 'New course' : 'Edit course'}</h1>
      {!meta.storageConfigured ? (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Lightsail storage is not connected yet. You can still edit course details. Video and thumbnail uploads will work after the bucket keys are added.
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

      <form onSubmit={save} className="mt-6 grid gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:grid-cols-2">
        <label className="text-sm font-medium md:col-span-2">
          Title
          <input name="title" value={form.title} onChange={update} className={fieldClass} required />
        </label>
        <label className="text-sm font-medium">
          Instructor
          <input name="instructor" value={form.instructor} onChange={update} className={fieldClass} required />
        </label>
        <label className="text-sm font-medium">
          Hours
          <input name="hours" type="number" min="0" step="0.5" value={form.hours} onChange={update} className={fieldClass} />
        </label>
        <label className="text-sm font-medium md:col-span-2">
          Description
          <textarea name="description" value={form.description} onChange={update} rows={3} className={fieldClass} />
        </label>
        <label className="text-sm font-medium">
          Category
          <input name="category" value={form.category} onChange={update} list="category-options" className={fieldClass} required />
          <datalist id="category-options">
            {meta.categories.map((item) => (
              <option key={item.id} value={item.name} />
            ))}
          </datalist>
        </label>
        <label className="text-sm font-medium">
          Package
          <select name="packageId" value={form.packageId} onChange={update} className={fieldClass}>
            <option value="">None</option>
            {meta.packages.map((item) => (
              <option key={item.packageId} value={item.packageId}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Card color
          <select name="accent" value={form.accent} onChange={update} className={fieldClass}>
            {meta.accents.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Status
          <select name="status" value={form.status} onChange={update} className={fieldClass}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm font-medium md:col-span-2">
          <input name="requiresUpgrade" type="checkbox" checked={form.requiresUpgrade} onChange={update} />
          Requires upgrade (Pro)
        </label>
        {!isNew ? (
          <div className="md:col-span-2">
            <p className="text-sm font-medium">Thumbnail</p>
            {thumbnailUrl ? <img src={thumbnailUrl} alt="" className="mt-2 h-auto w-full max-w-sm rounded-xl" /> : null}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setThumbnailFile(event.target.files?.[0] || null)}
              className="mt-2 block text-sm"
            />
            {thumbnailUrl ? (
              <button type="button" onClick={clearThumbnail} className="mt-2 text-sm font-semibold text-red-600">
                Remove thumbnail
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-500 md:col-span-2">Save the course first, then you can upload a thumbnail and lessons.</p>
        )}
        <div className="md:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save course'}
          </button>
        </div>
      </form>

      {!isNew ? (
        <section className="mt-8">
          <h2 className="text-xl font-bold">Lessons</h2>
          <form onSubmit={addLesson} className="mt-4 grid gap-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 md:grid-cols-[1fr_8rem_auto]">
            <input
              value={lessonTitle}
              onChange={(event) => setLessonTitle(event.target.value)}
              placeholder="Lesson title"
              className={fieldClass}
              required
            />
            <input
              type="number"
              min="0"
              value={lessonMinutes}
              onChange={(event) => setLessonMinutes(event.target.value)}
              className={fieldClass}
              title="Duration in minutes"
            />
            <button type="submit" className="rounded-xl bg-[#1b2140] px-4 py-2.5 text-sm font-semibold text-white">
              Add lesson
            </button>
            <label className="text-sm text-slate-600 md:col-span-3">
              Video file (mp4, webm, or mov)
              <input
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                onChange={(event) => setLessonFile(event.target.files?.[0] || null)}
                className="mt-1 block"
              />
            </label>
          </form>

          <ol className="mt-4 space-y-2">
            {lessons.map((lesson, index) => (
              <li key={lesson.id} className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {index + 1}. {lesson.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    {lesson.duration} · {lesson.hasVideo ? 'Video ready' : 'No video'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => moveLesson(index, -1)} className="rounded-lg px-2 py-1 text-sm ring-1 ring-slate-200">
                    Up
                  </button>
                  <button type="button" onClick={() => moveLesson(index, 1)} className="rounded-lg px-2 py-1 text-sm ring-1 ring-slate-200">
                    Down
                  </button>
                  <label className="cursor-pointer rounded-lg px-2 py-1 text-sm font-semibold text-brand-700 ring-1 ring-brand-100">
                    Replace video
                    <input
                      type="file"
                      accept="video/mp4,video/webm,video/quicktime"
                      className="hidden"
                      onChange={(event) => replaceVideo(lesson, event.target.files?.[0])}
                    />
                  </label>
                  <button type="button" onClick={() => removeLesson(lesson)} className="text-sm font-semibold text-red-600">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  )
}

export default CourseEditor
