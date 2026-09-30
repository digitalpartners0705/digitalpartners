import { useState } from 'react'

// Full class strings so Tailwind generates dynamic course accent gradients
const ACCENT_FALLBACKS = {
  'from-indigo-500 to-violet-500': 'bg-gradient-to-br from-indigo-500 to-violet-500',
  'from-sky-500 to-indigo-500': 'bg-gradient-to-br from-sky-500 to-indigo-500',
  'from-fuchsia-500 to-brand-600': 'bg-gradient-to-br from-fuchsia-500 to-brand-600',
  'from-amber-500 to-orange-500': 'bg-gradient-to-br from-amber-500 to-orange-500',
  'from-emerald-500 to-teal-600': 'bg-gradient-to-br from-emerald-500 to-teal-600',
  'from-rose-500 to-orange-400': 'bg-gradient-to-br from-rose-500 to-orange-400',
  'from-sky-600 to-blue-700': 'bg-gradient-to-br from-sky-600 to-blue-700',
  'from-red-500 to-rose-600': 'bg-gradient-to-br from-red-500 to-rose-600',
  'from-violet-500 to-indigo-600': 'bg-gradient-to-br from-violet-500 to-indigo-600',
  'from-blue-500 to-indigo-600': 'bg-gradient-to-br from-blue-500 to-indigo-600',
  'from-emerald-500 to-lime-500': 'bg-gradient-to-br from-emerald-500 to-lime-500',
  'from-cyan-500 to-sky-600': 'bg-gradient-to-br from-cyan-500 to-sky-600',
  'from-brand-500 to-violet-600': 'bg-gradient-to-br from-brand-500 to-violet-600',
  'from-orange-500 to-amber-500': 'bg-gradient-to-br from-orange-500 to-amber-500',
  'from-teal-500 to-emerald-600': 'bg-gradient-to-br from-teal-500 to-emerald-600',
  'from-fuchsia-500 to-pink-500': 'bg-gradient-to-br from-fuchsia-500 to-pink-500',
  'from-violet-500 to-purple-700': 'bg-gradient-to-br from-violet-500 to-purple-700',
  'from-indigo-500 to-slate-700': 'bg-gradient-to-br from-indigo-500 to-slate-700',
  'from-slate-600 to-zinc-800': 'bg-gradient-to-br from-slate-600 to-zinc-800',
  'from-brand-600 to-indigo-700': 'bg-gradient-to-br from-brand-600 to-indigo-700',
  'from-amber-600 to-orange-700': 'bg-gradient-to-br from-amber-600 to-orange-700',
  'from-cyan-600 to-indigo-600': 'bg-gradient-to-br from-cyan-600 to-indigo-600',
  'from-teal-600 to-emerald-700': 'bg-gradient-to-br from-teal-600 to-emerald-700',
  'from-slate-500 to-slate-700': 'bg-gradient-to-br from-slate-500 to-slate-700',
}

function accentClass(accent) {
  return ACCENT_FALLBACKS[accent] || ACCENT_FALLBACKS['from-indigo-500 to-violet-500']
}

function LockBadge({ compact = false }) {
  return (
    <span
      className={`absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#1b2140]/92 font-semibold text-white shadow-lg ring-1 ring-white/25 ${
        compact ? 'px-2 py-1' : 'px-2.5 py-1.5 text-xs'
      }`}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" strokeLinecap="round" />
      </svg>
      {compact ? null : 'Locked'}
    </span>
  )
}

function CourseCover({ course, compact = false, locked = false, short = false }) {
  const [imageFailed, setImageFailed] = useState(false)
  const hasImage = Boolean(course.thumbnailUrl) && !imageFailed
  const gradient = accentClass(course.accent)

  if (compact) {
    return (
      <div className="relative flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 sm:h-[4.5rem] sm:w-40">
        {hasImage ? (
          <img
            src={course.thumbnailUrl}
            alt=""
            className="max-h-full max-w-full object-contain"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className={`absolute inset-0 ${gradient}`} />
        )}
        {locked ? <LockBadge compact /> : null}
      </div>
    )
  }

  const heightClass = short ? 'h-28' : 'h-44'

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${heightClass}`}>
      {hasImage ? (
        <img
          src={course.thumbnailUrl}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <>
          <div className={`absolute inset-0 ${gradient}`} />
          <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/20" />
          <div className="absolute -bottom-8 left-6 h-16 w-16 rounded-full bg-white/10" />
        </>
      )}
      {locked ? <div className="pointer-events-none absolute inset-0 bg-slate-950/20" /> : null}
      {locked ? <LockBadge /> : null}
    </div>
  )
}

export default CourseCover
