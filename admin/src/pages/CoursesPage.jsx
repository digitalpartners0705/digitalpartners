import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

const ACCENTS = new Set([
  'from-indigo-500 to-violet-500',
  'from-sky-500 to-indigo-500',
  'from-fuchsia-500 to-brand-600',
  'from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-orange-400',
  'from-sky-600 to-blue-700',
  'from-red-500 to-rose-600',
  'from-violet-500 to-indigo-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-lime-500',
  'from-cyan-500 to-sky-600',
  'from-brand-500 to-violet-600',
  'from-orange-500 to-amber-500',
  'from-teal-500 to-emerald-600',
  'from-fuchsia-500 to-pink-500',
  'from-violet-500 to-purple-700',
  'from-indigo-500 to-slate-700',
  'from-slate-600 to-zinc-800',
  'from-brand-600 to-indigo-700',
  'from-amber-600 to-orange-700',
  'from-cyan-600 to-indigo-600',
  'from-teal-600 to-emerald-700',
])

const filters = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
]

function coverAccent(accent) {
  return ACCENTS.has(accent) ? accent : 'from-indigo-500 to-violet-500'
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
    </div>
  )
}

function CourseCover({ course }) {
  if (course.thumbnailUrl) {
    return <img src={course.thumbnailUrl} alt="" className="h-full w-full object-cover" />
  }

  return (
    <div className={`relative h-full w-full bg-gradient-to-br ${coverAccent(course.accent)}`}>
      <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/20" />
      <div className="absolute -bottom-8 left-6 h-16 w-16 rounded-full bg-white/15" />
      <p className="absolute bottom-3 left-4 text-sm font-semibold text-white/90">{course.tag}</p>
    </div>
  )
}

function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')

  const load = () => {
    setLoading(true)
    api
      .get('/api/admin/courses')
      .then((response) => {
        setCourses(response.data.courses || [])
        setError('')
      })
      .catch((err) => setError(err.response?.data?.message || 'Could not load courses'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const published = courses.filter((course) => course.status === 'published').length
  const drafts = courses.filter((course) => course.status !== 'published').length
  const withPackage = courses.filter((course) => course.packageName).length

  const results = useMemo(() => {
    const value = query.trim().toLowerCase()
    return courses.filter((course) => {
      if (filter === 'published' && course.status !== 'published') return false
      if (filter === 'draft' && course.status === 'published') return false
      if (!value) return true
      return [course.title, course.instructor, course.tag, course.packageName]
        .filter(Boolean)
        .some((part) => String(part).toLowerCase().includes(value))
    })
  }, [courses, query, filter])

  const remove = async (course) => {
    if (!window.confirm(`Delete “${course.title}”? This removes its lessons too.`)) return
    try {
      await api.delete(`/api/admin/courses/${course.courseId}`)
      setCourses((current) => current.filter((item) => item.courseId !== course.courseId))
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the course')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Courses</h1>
          <p className="mt-1 text-slate-500">Create, edit, publish, and manage lessons.</p>
        </div>
        <Link
          to="/courses/new"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
          </svg>
          New course
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total" value={loading ? '—' : courses.length} />
        <StatCard label="Published" value={loading ? '—' : published} />
        <StatCard label="Drafts" value={loading ? '—' : drafts} />
        <StatCard label="Packaged" value={loading ? '—' : withPackage} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {filters.map((item) => {
            const active = filter === item.id
            const count = item.id === 'all' ? courses.length : item.id === 'published' ? published : drafts
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
          placeholder="Search title, instructor, or category"
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
                <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!loading && courses.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-900">No courses yet</p>
          <p className="mt-2 text-sm text-slate-500">Create the first course, then add lessons and publish it.</p>
          <Link
            to="/courses/new"
            className="mt-5 inline-flex rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            New course
          </Link>
        </div>
      ) : null}

      {!loading && courses.length > 0 && results.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-900">No courses match</p>
          <p className="mt-2 text-sm text-slate-500">Try another status or clear the search.</p>
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
          {results.map((course) => {
            const publishedCourse = course.status === 'published'
            return (
              <article
                key={course.courseId}
                className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white"
              >
                <Link to={`/courses/${course.courseId}`} className="relative block h-24 overflow-hidden bg-slate-100">
                  <CourseCover course={course} />
                  <span
                    className={`absolute left-2 top-2 rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                      publishedCourse ? 'bg-white text-emerald-700' : 'bg-white text-amber-800'
                    }`}
                  >
                    {publishedCourse ? 'Published' : 'Draft'}
                  </span>
                  {course.packageName ? (
                    <span className="absolute right-2 top-2 rounded bg-slate-900 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                      {course.packageName}
                    </span>
                  ) : null}
                </Link>

                <div className="flex flex-1 flex-col p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-700">{course.tag}</p>
                  <h2 className="mt-1 line-clamp-2 text-sm font-bold leading-snug text-slate-900">
                    <Link to={`/courses/${course.courseId}`} className="hover:text-brand-700">
                      {course.title}
                    </Link>
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{course.instructor}</p>
                  {course.description ? (
                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-600">{course.description}</p>
                  ) : null}
                  <p className="mt-2 text-xs text-slate-500">
                    {course.lessons} {course.lessons === 1 ? 'lesson' : 'lessons'} · {course.hours} hours
                    {course.packageName ? ` · ${course.packageName}` : ''}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <Link
                      to={`/courses/${course.courseId}`}
                      className="inline-flex flex-1 items-center justify-center rounded-md bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => remove(course)}
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
    </div>
  )
}

export default CoursesPage
