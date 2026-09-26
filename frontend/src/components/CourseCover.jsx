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

function CourseCover({ course, compact = false, locked = false }) {
  const image = course.thumbnailUrl ? (
    <img src={course.thumbnailUrl} alt="" className={compact ? 'max-h-full max-w-full object-contain' : 'block h-auto w-full'} />
  ) : null

  if (compact) {
    return (
      <div className="relative flex h-24 w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-100 sm:h-[4.5rem] sm:w-40">
        {image || <div className={`absolute inset-0 bg-gradient-to-br ${course.accent}`} />}
        {locked ? <LockBadge compact /> : null}
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${image ? '' : `h-44 bg-gradient-to-br ${course.accent}`}`}>
      {image}
      {image ? null : (
        <>
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
