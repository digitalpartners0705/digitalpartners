import { Link } from 'react-router-dom'
import CourseCover from '../../components/CourseCover'
import { useAuth } from '../../context/AuthContext'
import { useCatalog } from '../../hooks/useCatalog'
import { canViewCourse, getEnrolledCourses } from '../../utils/courses'

function DashboardHome() {
  const { user } = useAuth()
  const { courses, loading } = useCatalog()
  const firstName = user?.fullName?.split(' ')[0] || 'there'
  const enrolled = getEnrolledCourses(courses, user)
  const continueCourse = enrolled[0]
  const recommended = user?.knowledgePackage
    ? courses.filter((course) => course.packageName === user.knowledgePackage).slice(0, 3)
    : courses.slice(0, 3)

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200 lg:grid lg:grid-cols-[1.4fr_1fr]">
        <div className="px-6 py-7 sm:px-8">
          <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Your learning space
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Welcome, {firstName}
          </h1>
          <p className="mt-2 max-w-lg text-slate-500">
            Pick up where you left off and keep building your skills.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/dashboard/courses"
              className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Continue learning
            </Link>
            <Link
              to="/dashboard/browse"
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Browse courses
            </Link>
          </div>
        </div>
        <div className="relative bg-[#1b2140] px-6 py-7 text-white sm:px-8">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-500/30" />
          <div className="absolute -bottom-10 right-10 h-20 w-20 rounded-full bg-brand-400/20" />
          <p className="relative text-sm font-medium text-indigo-200">Today’s focus</p>
          <p className="relative mt-2 text-lg font-semibold">
            {continueCourse ? continueCourse.title : 'Explore a new course'}
          </p>
          <p className="relative mt-2 text-sm text-slate-300">
            {continueCourse
              ? `${continueCourse.progress}% complete · keep the streak going`
              : 'Find a path that matches your goal'}
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Courses enrolled', value: loading ? '—' : enrolled.length, tint: 'bg-indigo-50 text-brand-700' },
          { label: 'Hours this week', value: '3.5', tint: 'bg-sky-50 text-sky-700' },
          { label: 'Certificates', value: '0', tint: 'bg-violet-50 text-violet-700' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-lg bg-white p-5 ring-1 ring-slate-200">
            <p className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${stat.tint}`}>{stat.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {continueCourse ? (
        <section className="rounded-lg bg-white p-6 ring-1 ring-slate-200 sm:flex sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-600">Continue learning</p>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{continueCourse.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{continueCourse.progress}% complete</p>
            <div className="mt-3 h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-brand-600" style={{ width: `${continueCourse.progress}%` }} />
            </div>
          </div>
          <Link
            to="/dashboard/courses"
            className="mt-5 inline-flex rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 sm:mt-0"
          >
            Resume
          </Link>
        </section>
      ) : null}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Recommended for you</h2>
          <Link to="/dashboard/browse" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </div>
        {loading ? <p className="text-sm text-slate-500">Loading courses...</p> : null}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {recommended.map((course) => (
            <article
              key={course.id}
              className="overflow-hidden rounded-lg bg-white ring-1 ring-slate-200"
            >
              <CourseCover course={course} locked={!canViewCourse(course, user)} />
              <div className="p-5">
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
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
