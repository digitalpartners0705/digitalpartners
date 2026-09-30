import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import AuthModal from '../components/AuthModal'
import CourseCover from '../components/CourseCover'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getPackageById, PACKAGES, packagePath } from '../data/packages'
import { getPackageCourses } from '../services/courses'

const rupees = (value) => `₹${value.toLocaleString('en-IN')}`

const shortLabel = (title) => {
  const words = String(title || '')
    .split(/\s+/)
    .filter(Boolean)
  if (words.length === 0) return 'COURSE'
  if (words.length === 1) return words[0].slice(0, 10).toUpperCase()
  return words
    .slice(0, 2)
    .map((word) => word.slice(0, 8))
    .join(' ')
    .toUpperCase()
}

const themeStyles = {
  teal: {
    underline: 'bg-[#1a9b84]',
    button: 'bg-[#0b3d38] text-white hover:bg-[#0a342f]',
    spine: '#f5c14a',
    label: '#f5c14a',
    chip: 'bg-[#0b3d38]/40 text-[#9fecc9] ring-[#1a9b84]/40',
    glow: 'rgba(26,155,132,0.28)',
    badge: 'bg-[#0b3d38] text-white',
  },
  silver: {
    underline: 'bg-sky-400',
    button: 'bg-[#10203c] text-white hover:bg-[#0c182e]',
    spine: '#c48a09',
    label: '#f5c14a',
    chip: 'bg-white/8 text-slate-200 ring-white/15',
    glow: 'rgba(56,189,248,0.22)',
    badge: 'bg-white/15 text-white',
  },
  gold: {
    underline: 'bg-gold-400',
    button: 'bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 text-[#1a1203] hover:brightness-105',
    spine: '#f5c14a',
    label: '#f5c14a',
    chip: 'bg-gold-400/12 text-gold-300 ring-gold-400/35',
    glow: 'rgba(245,193,74,0.28)',
    badge: 'bg-gold-400 text-[#1a1203]',
  },
}

function PackageBox({ label, subtitle, accent, featured }) {
  return (
    <div
      className={`relative shrink-0 ${featured ? 'w-[11.5rem] sm:w-[13.5rem]' : 'w-[9.5rem] sm:w-[11rem]'}`}
      aria-hidden="true"
    >
      <div
        className="absolute -right-1.5 top-4 h-[76%] w-4 rounded-r-md opacity-95"
        style={{ background: accent.spine }}
      />
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.55)]"
        style={{
          background: 'linear-gradient(160deg, #30343c 0%, #171a20 48%, #0b0d11 100%)',
          aspectRatio: '3 / 4',
        }}
      >
        <div className="absolute inset-y-0 left-0 w-2.5" style={{ background: accent.spine }} />
        <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/[0.14] to-transparent" />
        <div
          className="absolute inset-x-3 bottom-3 h-px opacity-70"
          style={{ background: `linear-gradient(90deg, transparent, ${accent.spine}, transparent)` }}
        />
        <div className="relative flex h-full flex-col justify-between p-4 pl-5">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45">Digital Aarambh</p>
            <p className="mt-1 line-clamp-2 text-[10px] font-medium leading-4 text-white/35">{subtitle}</p>
          </div>
          <p
            className={`font-[Plus_Jakarta_Sans,Inter,sans-serif] font-extrabold leading-[1.05] tracking-tight ${
              featured ? 'text-xl sm:text-2xl' : 'text-lg sm:text-xl'
            }`}
            style={{ color: accent.label }}
          >
            {label}
          </p>
          <div className="h-1.5 w-12 rounded-full" style={{ background: accent.spine }} />
        </div>
      </div>
    </div>
  )
}

function StatIcon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    className: 'h-5 w-5',
    'aria-hidden': true,
  }

  if (name === 'clock') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path strokeLinecap="round" d="M12 8v4.5l3 1.5" />
      </svg>
    )
  }

  if (name === 'users') {
    return (
      <svg {...common}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.5 10.5a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm-7 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm0 1.8c-2.4 0-5.2 1.2-5.2 3.5V18h7.2M12.5 12.3c.5-.1 1-.2 1.5-.2 2.4 0 5.2 1.2 5.2 3.5V18h-4"
        />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 5.2A2.2 2.2 0 0 1 7.2 3H19v15.5H7.2A2.2 2.2 0 0 0 5 20.7V5.2Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 5.2A2.2 2.2 0 0 1 7.2 7.4H19" />
    </svg>
  )
}

function PackageDetail() {
  const { packageId } = useParams()
  const pkg = getPackageById(packageId)
  const { authOpen, authMode, signupDefaults, openAuth, setAuthMode, closeAuth, handleAuthSuccess } = useAuth()
  const [courses, setCourses] = useState([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [coursesError, setCoursesError] = useState('')

  useEffect(() => {
    if (!pkg?.id) {
      setCourses([])
      setCoursesLoading(false)
      return undefined
    }

    let cancelled = false
    setCoursesLoading(true)
    setCoursesError('')

    getPackageCourses(pkg.id)
      .then((data) => {
        if (cancelled) return
        setCourses(data.courses || [])
      })
      .catch(() => {
        if (cancelled) return
        setCourses([])
        setCoursesError('Could not load courses for this package.')
      })
      .finally(() => {
        if (!cancelled) setCoursesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [pkg?.id])

  const totalHours = courses.reduce((sum, course) => sum + (Number(course.hours) || 0), 0)
  const stats = [
    {
      label: 'Courses',
      value: coursesLoading ? '—' : String(courses.length),
      icon: 'book',
    },
    {
      label: 'Learning hours',
      value: totalHours > 0 ? `${totalHours}+` : pkg?.stats?.find((item) => item.label === 'Learning hours')?.value || '—',
      icon: 'clock',
    },
    pkg?.stats?.find((item) => item.label === 'Learners') || {
      label: 'Learners',
      value: '3K+',
      icon: 'users',
    },
  ]

  if (!pkg) {
    return <Navigate to="/#courses" replace />
  }

  const theme = themeStyles[pkg.theme]
  const otherPackages = PACKAGES.filter((item) => item.id !== pkg.id)
  const showcaseSource = courses.length > 0 ? courses : pkg.modules
  const showcase = showcaseSource.slice(0, 3)

  const handleBuy = () => {
    openAuth('signup', { knowledgePackage: pkg.name })
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-ink-950 pt-28 text-white sm:pt-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_20%,rgba(37,99,235,0.2),transparent_45%),radial-gradient(ellipse_at_90%_30%,rgba(245,193,74,0.16),transparent_40%)]" />
          <div
            className="pointer-events-none absolute -right-24 top-24 h-[28rem] w-[28rem] rounded-full blur-3xl"
            style={{ background: theme.glow }}
          />

          <div className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8 lg:pb-20">
            <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-8 xl:gap-14">
              <div className="max-w-xl">
                {pkg.badge ? (
                  <span className={`inline-flex rounded-full px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${theme.badge}`}>
                    {pkg.badge}
                  </span>
                ) : (
                  <span className="inline-flex rounded-full bg-white/5 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300 ring-1 ring-white/10">
                    Knowledge Pack
                  </span>
                )}

                <h1 className="mt-5 font-[Plus_Jakarta_Sans,Inter,sans-serif] text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.5rem]">
                  {pkg.name}
                </h1>
                <div className={`mt-4 h-1.5 w-28 rounded-full ${theme.underline}`} />

                <p className="mt-6 text-[15px] leading-7 text-slate-300 sm:text-base">{pkg.description}</p>

                <a
                  href="#inclusions"
                  className={`mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ring-1 transition hover:bg-white/5 ${theme.chip}`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" />
                  All inclusions of this package
                </a>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3.5 backdrop-blur-sm"
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-gold-300 ring-1 ring-white/10">
                        <StatIcon name={stat.icon} />
                      </span>
                      <p className="mt-3 text-xl font-extrabold text-white">{stat.value}</p>
                      <p className="mt-0.5 text-xs text-slate-400">{stat.label}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-9 flex flex-wrap items-end gap-5">
                  <div>
                    <p className="text-4xl font-extrabold tracking-tight text-gold-300 sm:text-[2.75rem]">
                      {rupees(pkg.price)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">GST inclusive · Lifetime access</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleBuy}
                    className={`inline-flex min-w-[11rem] cursor-pointer items-center justify-center rounded-full px-7 py-3.5 text-sm font-bold shadow-[0_12px_30px_rgba(0,0,0,0.35)] transition ${theme.button}`}
                  >
                    Buy Now
                  </button>
                </div>
              </div>

              <div className="relative mx-auto flex h-[22rem] w-full max-w-md items-center justify-center sm:h-[26rem] lg:max-w-none">
                <div
                  className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl sm:h-72 sm:w-72"
                  style={{ background: theme.glow }}
                />
                <div className="pointer-events-none absolute bottom-8 left-1/2 h-8 w-48 -translate-x-1/2 rounded-full bg-sky-400/20 blur-xl" />

                {showcase.map((item, index) => {
                  const poses = [
                    'z-[1] -translate-x-[5.5rem] translate-y-8 -rotate-[14deg] sm:-translate-x-[7rem]',
                    'z-[3] translate-y-0 scale-110',
                    'z-[2] translate-x-[5.5rem] translate-y-8 rotate-[14deg] sm:translate-x-[7rem]',
                  ]
                  const label = item.short || shortLabel(item.title)
                  const subtitle = item.subtitle || item.tag || item.instructor || 'Knowledge Pack'
                  return (
                    <div
                      key={item.id || item.title}
                      className={`absolute transition duration-500 ease-out hover:-translate-y-3 ${poses[index]}`}
                    >
                      <PackageBox
                        label={label}
                        subtitle={subtitle}
                        accent={theme}
                        featured={index === 1}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-2">
            <div id="inclusions" className="scroll-mt-28 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-[#10203c]">What’s included</h2>
              <p className="mt-2 text-sm text-slate-500">{pkg.headline}</p>
              <ul className="mt-6 space-y-3">
                {pkg.inclusions.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-xl font-bold text-[#10203c]">Who this is for</h2>
              <ul className="mt-6 space-y-3">
                {pkg.whoFor.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#0b3d38]" />
                    {item}
                  </li>
                ))}
              </ul>
              <h3 className="mt-8 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">You’ll walk away with</h3>
              <ul className="mt-4 space-y-3">
                {pkg.outcomes.map((item) => (
                  <li key={item} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-sky-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#f3e2b3] bg-[#fffdf8] p-6 sm:flex-row sm:items-center sm:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#c48a09]">Ready to begin?</p>
              <h3 className="mt-1 text-xl font-bold text-[#10203c]">
                Enroll in {pkg.name} for {rupees(pkg.price)}
              </h3>
              <p className="mt-1 text-sm text-slate-500">Create your account and start learning right away.</p>
            </div>
            <button
              type="button"
              onClick={handleBuy}
              className="cursor-pointer rounded-xl bg-[#e8a317] px-6 py-3 text-sm font-bold text-[#1a1404] transition hover:bg-[#d79610]"
            >
              Buy Now
            </button>
          </div>

          <div className="mt-14">
            <h2 className="text-xl font-bold text-[#10203c]">Compare other packages</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {otherPackages.map((item) => (
                <Link
                  key={item.id}
                  to={packagePath(item.id)}
                  className="cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-gold-400/50 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold text-[#10203c]">{item.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{item.headline}</p>
                    </div>
                    <span className="shrink-0 text-sm font-extrabold text-[#10203c]">{rupees(item.price)}</span>
                  </div>
                  <span className="mt-4 inline-flex text-sm font-semibold text-[#c48a09]">View details →</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#10203c]">Courses in {pkg.name}</h2>
            <p className="mt-2 text-sm text-slate-500">
              Published courses included when you purchase this package.
            </p>

            {coursesLoading ? <p className="mt-6 text-sm text-slate-500">Loading courses...</p> : null}
            {coursesError ? <p className="mt-6 text-sm text-red-600">{coursesError}</p> : null}

            {!coursesLoading && !coursesError && courses.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                <p className="text-lg font-semibold text-slate-900">No courses in this package yet</p>
                <p className="mt-2 text-sm text-slate-500">Courses assigned to {pkg.name} will appear here.</p>
              </div>
            ) : null}

            {!coursesLoading && courses.length > 0 ? (
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {courses.map((course) => (
                  <article
                    key={course.id}
                    className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <CourseCover course={course} short />
                    <div className="flex flex-1 flex-col p-3.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                          {course.tag}
                        </span>
                        {course.packageName ? (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                            {course.packageName}
                          </span>
                        ) : null}
                      </div>
                      <h3 className="mt-2 line-clamp-2 text-sm font-bold leading-snug text-slate-900">{course.title}</h3>
                      <p className="mt-0.5 truncate text-xs text-slate-500">{course.instructor}</p>
                      <p className="mt-1.5 line-clamp-2 flex-1 text-xs leading-5 text-slate-600">{course.description}</p>
                      <p className="mt-2 text-[11px] font-medium text-slate-500">
                        {course.lessons} lessons · {course.hours} hours
                      </p>
                      <button
                        type="button"
                        onClick={handleBuy}
                        className="mt-3 inline-flex w-full cursor-pointer items-center justify-center rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-700"
                      >
                        Buy package to unlock
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <AuthModal
        isOpen={authOpen}
        mode={authMode}
        signupDefaults={signupDefaults}
        onModeChange={setAuthMode}
        onClose={closeAuth}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}

export default PackageDetail
