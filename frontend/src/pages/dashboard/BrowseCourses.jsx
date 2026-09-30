import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CourseCover from '../../components/CourseCover'
import { useAuth } from '../../context/AuthContext'
import { useCatalog } from '../../hooks/useCatalog'
import { canViewCourse } from '../../utils/courses'

function BrowseCourses() {
  const { user } = useAuth()
  const { courses, loading, error } = useCatalog()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All')

  const categories = useMemo(() => {
    const names = []
    for (const course of courses) {
      if (course.tag && !names.includes(course.tag)) names.push(course.tag)
    }
    return ['All', ...names]
  }, [courses])

  const results = useMemo(() => {
    const value = query.trim().toLowerCase()

    return courses.filter((course) => {
      const matchesFilter = filter === 'All' || course.tag === filter
      if (!matchesFilter) return false
      if (!value) return true

      return (
        course.title.toLowerCase().includes(value) ||
        course.tag.toLowerCase().includes(value) ||
        course.instructor.toLowerCase().includes(value) ||
        course.description.toLowerCase().includes(value)
      )
    })
  }, [courses, query, filter])

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Browse courses</h1>
      <p className="mt-1 text-slate-500">Explore the full Digital Expert catalog.</p>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search by course, topic, or instructor"
        className="mt-6 w-full max-w-md rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />

      {courses.length > 0 ? (
      <div className="mt-5 flex flex-wrap gap-2">
        {categories.map((item) => {
          const isActive = filter === item
          return (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-brand-700'
              }`}
            >
              {item}
            </button>
          )
        })}
      </div>
      ) : null}

      {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="mt-6 text-sm text-slate-500">Loading courses...</p> : null}

      {!loading && !error ? (
        <p className="mt-6 text-sm text-slate-500">
          {results.length} {results.length === 1 ? 'course' : 'courses'}
          {filter !== 'All' ? ` in ${filter}` : ''}
        </p>
      ) : null}

      {!loading && !error && results.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-900">No courses match this filter</p>
          <p className="mt-2 text-sm text-slate-500">Try another category or clear the search.</p>
        </div>
      ) : null}

      {!loading && results.length > 0 ? (
        <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.map((course) => {
            const unlocked = canViewCourse(course, user)

            return (
              <article
                key={course.id}
                className="flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <CourseCover course={course} locked={!unlocked} />
                <div className="flex flex-1 flex-col p-5">
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="w-fit rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                      {course.tag}
                    </span>
                    {course.packageName ? (
                      <span className="w-fit rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                        {course.packageName}
                      </span>
                    ) : null}
                  </div>
                  <h2 className="mt-3 text-lg font-bold leading-snug text-slate-900">{course.title}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">{course.instructor}</p>
                  <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{course.description}</p>
                  <div className="mt-4 flex gap-2 text-xs font-medium text-slate-500">
                    <span className="rounded-lg bg-slate-50 px-2 py-1 ring-1 ring-slate-100">{course.lessons} lessons</span>
                    <span className="rounded-lg bg-slate-50 px-2 py-1 ring-1 ring-slate-100">{course.hours} hours</span>
                  </div>
                  <div className="mt-4">
                    {unlocked ? (
                      <Link
                        to={`/dashboard/courses/${course.id}`}
                        className="inline-flex w-full items-center justify-center rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
                      >
                        View course
                      </Link>
                    ) : (
                      <Link
                        to="/dashboard/upgrade"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b2140] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#242b4f]"
                      >
                        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <rect x="5" y="11" width="14" height="9" rx="2" />
                          <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
                        </svg>
                        Upgrade to unlock
                      </Link>
                    )}
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

export default BrowseCourses
