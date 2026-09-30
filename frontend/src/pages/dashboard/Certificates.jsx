import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import CourseCover from '../../components/CourseCover'
import { useAuth } from '../../context/AuthContext'
import { useCatalog } from '../../hooks/useCatalog'
import { canViewCourse } from '../../utils/courses'

const PACKAGE_FILTERS = [
  { id: 'all', label: 'All packages' },
  { id: 'Social Expert', label: 'Social Expert' },
  { id: 'Ads Expert', label: 'Ads Expert' },
  { id: 'AI Premium Expert', label: 'AI Premium Expert' },
]

function Certificates() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const { courses, loading, error } = useCatalog()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState(user?.knowledgePackage || 'all')
  const [claimed, setClaimed] = useState({})
  const appliedCourse = useRef(false)
  const requestedCourseId = searchParams.get('course') || ''
  const requestedCourse = courses.find((course) => course.id === requestedCourseId)

  useEffect(() => {
    if (!requestedCourse || appliedCourse.current) return
    appliedCourse.current = true
    setCategory(requestedCourse.packageName || 'all')
  }, [requestedCourse])

  const results = useMemo(() => {
    const value = query.trim().toLowerCase()
    return courses.filter((course) => {
      if (category !== 'all' && course.packageName !== category) return false
      if (!value) return true
      return [course.title, course.tag, course.instructor, course.description, course.packageName].some((part) =>
        String(part || '').toLowerCase().includes(value),
      )
    })
  }, [courses, query, category])

  const claimCertificate = (courseId) => {
    setClaimed((prev) => ({ ...prev, [courseId]: true }))
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Certificates</h1>
      <p className="mt-1 text-slate-500">
        Certificates are available for courses in your purchased package.
      </p>

      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search courses"
        className="mt-6 w-full max-w-md rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />

      <div className="mt-5 flex flex-wrap gap-2">
        {PACKAGE_FILTERS.map((item) => {
          const isActive = category === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={`cursor-pointer rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-brand-700'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="mt-6 text-sm text-slate-500">Loading courses...</p> : null}

      {!loading && results.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-900">No courses in this package</p>
          <p className="mt-2 text-sm text-slate-500">Try another package filter or clear the search.</p>
        </div>
      ) : null}

      {results.length > 0 ? (
        <div className="mt-4 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {results.map((course) => {
            const unlocked = canViewCourse(course, user)
            const isClaimed = Boolean(claimed[course.id])

            return (
              <article
                key={course.id}
                className="flex flex-col overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200"
              >
                <CourseCover course={course} locked={!unlocked} />
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                      {course.tag}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {course.packageName || 'Unassigned'}
                    </span>
                  </div>
                  <h2 className="mt-3 text-lg font-bold leading-snug text-slate-900">{course.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{course.instructor}</p>
                  <p className="mt-2 flex-1 text-sm text-slate-600">{course.description}</p>
                  <p className="mt-3 text-xs text-slate-500">
                    {course.lessons} lessons · {course.hours} hours
                  </p>
                  <div className="mt-4">
                    {!unlocked ? (
                      <Link
                        to="/dashboard/upgrade"
                        className="inline-flex rounded-xl bg-[#1b2140] px-4 py-2 text-sm font-semibold text-white hover:bg-[#242b4f]"
                      >
                        Upgrade to unlock
                      </Link>
                    ) : isClaimed ? (
                      <span className="inline-flex rounded-xl bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                        Certificate ready
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => claimCertificate(course.id)}
                        className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                      >
                        Get certificate
                      </button>
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

export default Certificates
