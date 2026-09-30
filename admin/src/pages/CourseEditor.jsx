import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'

const fieldClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-500'

function Panel({ title, hint, children }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
      </div>
      <div className="p-4">{children}</div>
    </section>
  )
}

function Field({ label, children, className = '' }) {
  return (
    <label className={`block text-xs font-semibold uppercase tracking-wide text-slate-500 ${className}`}>
      {label}
      {children}
    </label>
  )
}

const emptyForm = {
  title: '',
  instructor: '',
  description: '',
  category: '',
  packageId: '',
  accent: '',
  hours: 0,
  requiresUpgrade: true,
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
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [thumbnailFile, setThumbnailFile] = useState(null)
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

      await api.patch(`/api/admin/courses/${id}`, {
        ...payload(),
        ...(thumbnailKey ? { thumbnailKey } : {}),
      })
      navigate(`/courses/${id}`)
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 animate-pulse rounded bg-slate-200" />
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="h-80 animate-pulse rounded-lg bg-white" />
          <div className="h-80 animate-pulse rounded-lg bg-white" />
        </div>
      </div>
    )
  }

  const published = form.status === 'published'

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to={isNew ? '/courses' : `/courses/${id}`}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            {isNew ? '← All courses' : '← Back to lessons'}
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{isNew ? 'New course' : 'Edit course'}</h1>
            <span
              className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                published ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'
              }`}
            >
              {published ? 'Published' : 'Draft'}
            </span>
            {form.packageId ? (
              <span className="rounded bg-slate-900 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                {meta.packages.find((item) => item.packageId === form.packageId)?.name || 'Package'}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-500">
            {isNew ? 'Add the course details. Thumbnail and lessons come after the first save.' : form.title}
          </p>
        </div>
        <button
          type="submit"
          form="course-form"
          disabled={saving}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving ? 'Saving...' : isNew ? 'Create course' : 'Save course'}
        </button>
      </div>

      {!meta.storageConfigured ? (
        <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Storage is not connected yet. Course details can still be saved. Uploads work after the bucket keys are added.
        </p>
      ) : null}
      {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <form id="course-form" onSubmit={save} className="mt-5 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <Panel title="Details" hint="What learners see on the course card.">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Title" className="md:col-span-2">
              <input name="title" value={form.title} onChange={update} className={fieldClass} required />
            </Field>
            <Field label="Instructor">
              <input name="instructor" value={form.instructor} onChange={update} className={fieldClass} required />
            </Field>
            <Field label="Hours">
              <input name="hours" type="number" min="0" step="0.5" value={form.hours} onChange={update} className={fieldClass} />
            </Field>
            <Field label="Description" className="md:col-span-2">
              <textarea name="description" value={form.description} onChange={update} rows={4} className={fieldClass} />
            </Field>
            <Field label="Category">
              <input name="category" value={form.category} onChange={update} list="category-options" className={fieldClass} required />
              <datalist id="category-options">
                {meta.categories.map((item) => (
                  <option key={item.id} value={item.name} />
                ))}
              </datalist>
            </Field>
            <Field label="Package">
              <select name="packageId" value={form.packageId} onChange={update} className={fieldClass} required>
                <option value="">Choose a package</option>
                {meta.packages.map((item) => (
                  <option key={item.packageId} value={item.packageId}>
                    {item.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel title="Thumbnail" hint="Shown on the course card.">
            {isNew ? (
              <p className="text-sm text-slate-500">Save the course first, then upload a thumbnail.</p>
            ) : (
              <>
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                  {thumbnailUrl ? (
                    <img src={thumbnailUrl} alt="" className="h-36 w-full object-cover" />
                  ) : (
                    <div className={`flex h-36 items-end bg-gradient-to-br p-3 ${form.accent || 'from-indigo-500 to-violet-500'}`}>
                      <p className="text-xs font-semibold text-white">{form.category || 'No thumbnail'}</p>
                    </div>
                  )}
                </div>
                <label className="mt-3 flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  {thumbnailFile ? thumbnailFile.name : 'Choose image'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(event) => setThumbnailFile(event.target.files?.[0] || null)}
                    className="sr-only"
                  />
                </label>
                <p className="mt-1.5 text-xs text-slate-400">JPG, PNG, or WEBP. Save the course to apply it.</p>
                {thumbnailUrl ? (
                  <button type="button" onClick={clearThumbnail} className="mt-2 text-xs font-semibold text-red-600">
                    Remove thumbnail
                  </button>
                ) : null}
              </>
            )}
          </Panel>

          <Panel title="Publishing" hint="Who can see this course.">
            <div className="space-y-4">
              <Field label="Status">
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                  ].map((item) => {
                    const selected = form.status === item.value
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setForm((current) => ({ ...current, status: item.value }))}
                        className={`rounded-lg border px-3 py-2 text-sm font-semibold ${
                          selected
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </Field>
              <Field label="Card color">
                <div className="mt-1.5 flex items-center gap-2">
                  <span className={`h-9 w-9 shrink-0 rounded-md bg-gradient-to-br ${form.accent || 'from-indigo-500 to-violet-500'}`} />
                  <select name="accent" value={form.accent} onChange={update} className={`${fieldClass} mt-0`}>
                    {meta.accents.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </Field>
              <p className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm text-slate-600">
                Every course must belong to one package. Learners only unlock courses in the package they purchased.
              </p>
            </div>
          </Panel>
        </div>
      </form>
    </div>
  )
}

export default CourseEditor
