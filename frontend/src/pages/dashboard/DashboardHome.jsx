import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CourseCover from '../../components/CourseCover'
import { useAuth } from '../../context/AuthContext'
import { useCatalog } from '../../hooks/useCatalog'
import { getLearningStats } from '../../services/courses'
import { canViewCourse, getEnrolledCourses } from '../../utils/courses'

function formatHours(hours) {
  if (hours == null) return '—'
  const value = Number(hours)
  if (!Number.isFinite(value) || value <= 0) return '0'
  return String(value)
}

function DashboardHome() {
  const { user } = useAuth()
  const { courses, loading } = useCatalog()
  const [hoursThisWeek, setHoursThisWeek] = useState(null)
  const firstName = user?.fullName?.split(' ')[0] || 'there'
  const displayName = firstName.charAt(0).toUpperCase() + firstName.slice(1)
  const enrolled = getEnrolledCourses(courses, user)
  const continueCourse = enrolled[0]
  const recommended = user?.knowledgePackage
    ? courses.filter((course) => course.packageName === user.knowledgePackage).slice(0, 3)
    : courses.slice(0, 3)

  useEffect(() => {
    let active = true
    const load = () => {
      getLearningStats()
        .then((data) => {
          if (active) setHoursThisWeek(data.hoursThisWeek ?? 0)
        })
        .catch(() => {
          if (active) setHoursThisWeek(0)
        })
    }
    load()
    window.addEventListener('focus', load)
    return () => {
      active = false
      window.removeEventListener('focus', load)
    }
  }, [])

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 lg:grid lg:grid-cols-[1.4fr_1fr]">
        <div className="px-6 py-7 sm:px-8">
          <span className="inline-flex rounded-full bg-gold-400/15 px-3 py-1 text-xs font-semibold text-[#8f5f08] ring-1 ring-gold-400/30">
            Your learning space
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Welcome, <span className="text-sky-600">{displayName}</span>
          </h1>
          <p className="mt-2 max-w-lg text-slate-500">
            Pick up where you left off and keep building your skills.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/dashboard/courses"
              className="rounded-full bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 px-5 py-2.5 text-sm font-bold text-[#1a1203] shadow-[0_8px_20px_rgba(245,193,74,0.28)] transition hover:brightness-105"
            >
              Continue learning
            </Link>
            <Link
              to="/dashboard/browse"
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-sky-50 hover:text-sky-700 hover:ring-sky-200"
            >
              Browse courses
            </Link>
          </div>
        </div>
        <div className="relative overflow-hidden bg-ink-950 px-6 py-7 text-white sm:px-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gold-400/20 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 right-6 h-28 w-28 rounded-full bg-sky-400/25 blur-2xl" />
          <p className="relative text-xs font-semibold uppercase tracking-[0.14em] text-gold-300">Today’s focus</p>
          <p className="relative mt-2 text-lg font-semibold">
            {continueCourse ? continueCourse.title : 'Explore a new course'}
          </p>
          <p className="relative mt-2 text-sm text-slate-300">
            {continueCourse
              ? `${continueCourse.progress}% complete · keep the streak going`
              : 'Find a path that matches your goal'}
          </p>
          {continueCourse ? (
            <div className="relative mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-300 to-sky-400"
                style={{ width: `${continueCourse.progress}%` }}
              />
            </div>
          ) : null}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Courses enrolled', value: loading ? '—' : enrolled.length, tint: 'bg-gold-400/15 text-[#8f5f08]' },
          { label: 'Hours this week', value: formatHours(hoursThisWeek), tint: 'bg-sky-50 text-sky-700' },
          { label: 'Certificates', value: '0', tint: 'bg-slate-100 text-slate-600' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
            <p className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${stat.tint}`}>{stat.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {continueCourse ? (
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200/80 sm:flex sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-sky-600">Continue learning</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{continueCourse.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{continueCourse.progress}% complete</p>
            <div className="mt-3 h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold-400 to-sky-500"
                style={{ width: `${continueCourse.progress}%` }}
              />
            </div>
          </div>
          <Link
            to="/dashboard/courses"
            className="mt-5 inline-flex rounded-full bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 px-5 py-2.5 text-sm font-bold text-[#1a1203] shadow-[0_8px_20px_rgba(245,193,74,0.28)] transition hover:brightness-105 sm:mt-0"
          >
            Resume
          </Link>
        </section>
      ) : null}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Recommended for you</h2>
          <Link to="/dashboard/browse" className="text-sm font-semibold text-sky-600 hover:text-sky-700">
            View all
          </Link>
        </div>
        {loading ? <p className="text-sm text-slate-500">Loading courses...</p> : null}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {recommended.map((course) => (
            <article
              key={course.id}
              className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200/80 transition hover:ring-sky-200"
            >
              <CourseCover course={course} locked={!canViewCourse(course, user)} />
              <div className="p-5">
                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">
                  {course.tag}
                </span>
                <h3 className="mt-3 text-lg font-bold leading-snug text-slate-900">{course.title}</h3>
                <p className="mt-1 text-sm font-medium text-slate-500">{course.instructor}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{course.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default DashboardHome
