import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

function CoursesPage() {
  const [courses, setCourses] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Courses</h1>
          <p className="mt-1 text-slate-500">Create, edit, publish, and upload lessons.</p>
        </div>
        <Link to="/courses/new" className="rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700">
          New course
        </Link>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="mt-6 text-sm text-slate-500">Loading courses...</p> : null}

      {!loading && courses.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="font-semibold">No courses yet</p>
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {courses.map((course) => (
          <article key={course.courseId} className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold">{course.title}</h2>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${course.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {course.status}
                </span>
                {course.requiresUpgrade ? (
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">Pro</span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {course.tag} · {course.instructor} · {course.lessons} lessons
                {course.packageName ? ` · ${course.packageName}` : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Link to={`/courses/${course.courseId}`} className="rounded-xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700">
                Edit
              </Link>
              <button type="button" onClick={() => remove(course)} className="rounded-xl px-4 py-2 text-sm font-semibold text-red-600 ring-1 ring-red-100">
                Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default CoursesPage
