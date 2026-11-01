import { Link } from 'react-router-dom'

export function CoursesComingSoonBanner({ className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-amber-200/80 bg-gradient-to-r from-[#fff8e8] via-white to-sky-50 px-5 py-4 shadow-sm ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c48a09]">Coming soon</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">Course videos are being prepared</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        Your package access is ready. Lesson videos will appear here as soon as they are published.
      </p>
    </div>
  )
}

export function ComingSoonButton({ className = '' }) {
  return (
    <span
      className={`inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 ${className}`}
      aria-disabled="true"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path strokeLinecap="round" d="M12 7.5v5l3 2" />
      </svg>
      Coming soon
    </span>
  )
}

export function CoursesComingSoonPanel({ title = 'Courses coming soon', backTo = '/dashboard/browse' }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
      <span className="inline-flex rounded-full bg-gold-400/15 px-3 py-1 text-xs font-semibold text-[#8f5f08] ring-1 ring-gold-400/30">
        Coming soon
      </span>
      <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">
        Lesson videos for this course are not live yet. Your package is saved — check back soon to start learning.
      </p>
      <Link
        to={backTo}
        className="mt-6 inline-flex rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0c1528]"
      >
        Back to courses
      </Link>
    </div>
  )
}
