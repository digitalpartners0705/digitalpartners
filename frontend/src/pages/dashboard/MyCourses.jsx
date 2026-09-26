import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import CourseCover from '../../components/CourseCover'
import { useAuth } from '../../context/AuthContext'
import { useCatalog } from '../../hooks/useCatalog'
import { getEnrolledCourses } from '../../utils/courses'

function MyCourses() {
  const { user } = useAuth()
  const { courses, loading, error } = useCatalog()
  const [query, setQuery] = useState('')
  const enrolled = useMemo(() => getEnrolledCourses(courses, user), [courses, user])

  const results = useMemo(() => {
    const value = query.trim().toLowerCase()
    if (!value) return enrolled

    return enrolled.filter(
      (course) =>
        course.title.toLowerCase().includes(value) ||
        course.tag.toLowerCase().includes(value) ||
        course.instructor.toLowerCase().includes(value) ||
        course.description.toLowerCase().includes(value)
    )
  }, [enrolled, query])

  const featured = results[0]
  const library = results.slice(1)
  const lessonCount = enrolled.reduce((sum, course) => sum + Number(course.lessons || 0), 0)
  const hourCount = enrolled.reduce((sum, course) => sum + Number(course.hours || 0), 0)

  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-600">Your library</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">My courses</h1>
          <p className="mt-2 max-w-xl text-slate-500">Courses included in your access. Pick one up and keep going.</p>
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search your courses"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 lg:max-w-xs"
        />
      </div>

      {!loading && !error && enrolled.length > 0 ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Courses', value: enrolled.length },
            { label: 'Lessons', value: lessonCount },
            { label: 'Hours', value: hourCount },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{item.value}</p>
            </div>
          ))}
        </div>
      ) : null}

      {error ? <p className="mt-6 text-sm text-red-600">{error}</p> : null}
      {loading ? <p className="mt-6 text-sm text-slate-500">Loading your courses...</p> : null}

      {!loading && !error && enrolled.length === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-900">No courses in your plan yet</p>
          <p className="mt-2 text-sm text-slate-500">Browse the catalog and upgrade to unlock more lessons.</p>
          <Link
            to="/dashboard/browse"
            className="mt-6 inline-flex rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Browse courses
          </Link>
        </div>
      ) : null}

      {!loading && enrolled.length > 0 && results.length === 0 ? (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-900">No courses match this search</p>
          <p className="mt-2 text-sm text-slate-500">Try another course, topic, or instructor.</p>
        </div>
      ) : null}

      {featured ? (
        <article className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          <div className="bg-slate-100">
            <CourseCover course={featured} />
          </div>
          <div className="flex flex-col justify-center px-6 py-7 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600">Continue learning</p>
            <span className="mt-4 w-fit rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
              {featured.tag}
            </span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{featured.title}</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">{featured.instructor}</p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{featured.description}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-medium text-slate-500">
              <span className="rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-100">{featured.lessons} lessons</span>
              <span className="rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-100">{featured.hours} hours</span>
              <span className="rounded-lg bg-slate-50 px-2.5 py-1 ring-1 ring-slate-100">
                {featured.progress > 0 ? `${featured.progress}% complete` : 'Ready to start'}
              </span>
            </div>
            <Link
              to={`/dashboard/courses/${featured.id}`}
              className="mt-6 inline-flex w-fit rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Continue
            </Link>
          </div>
        </article>
      ) : null}

      {library.length > 0 ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {library.map((course) => (
            <article
              key={course.id}
              className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <CourseCover course={course} />
              <div className="flex flex-1 flex-col p-4">
                <span className="w-fit rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                  {course.tag}
                </span>
                <h2 className="mt-2 text-base font-bold leading-snug text-slate-900">{course.title}</h2>
                <p className="mt-1 text-xs font-medium text-slate-500">{course.instructor}</p>
                <p className="mt-2 line-clamp-2 flex-1 text-sm leading-5 text-slate-600">{course.description}</p>
                <p className="mt-3 text-xs text-slate-500">
                  {course.lessons} lessons · {course.hours} hours
                </p>
                <Link
                  to={`/dashboard/courses/${course.id}`}
                  className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-[#1b2140] px-3 py-2 text-sm font-semibold text-white hover:bg-[#242b4f]"
                >
                  Continue
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default MyCourses
