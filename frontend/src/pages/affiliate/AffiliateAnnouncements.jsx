import { useEffect, useState } from 'react'
import { getAffiliateAnnouncements } from '../../services/api'

function MegaphoneIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 10v4a1 1 0 0 0 1 1h2l4 3V6L7 9H5a1 1 0 0 0-1 1Z" />
      <path strokeLinecap="round" d="M15 9.5a3.5 3.5 0 0 1 0 5" />
      <path strokeLinecap="round" d="M17.5 7a6.5 6.5 0 0 1 0 10" />
    </svg>
  )
}

function NoticeIcon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    className: 'h-4 w-4',
    'aria-hidden': true,
  }
  if (name === 'rooms') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
        <path strokeLinecap="round" d="M3 19a5 5 0 0 1 10 0M13 19a5 5 0 0 1 8 0" />
      </svg>
    )
  }
  if (name === 'shield') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3 5 6v6c0 4.5 3 6.8 7 8 4-1.2 7-3.5 7-8V6l-7-3Z" />
      </svg>
    )
  }
  if (name === 'note') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" d="M7 4h8l4 4v12H7V4Z" />
        <path strokeLinecap="round" d="M15 4v4h4M9 12h6M9 16h4" />
      </svg>
    )
  }
  if (name === 'megaphone') {
    return <MegaphoneIcon />
  }
  return (
    <svg {...common}>
      <path strokeLinecap="round" d="M10 13a5 5 0 0 0 7.1.1l1.4-1.4a3.5 3.5 0 0 0-5-5L12 8" />
      <path strokeLinecap="round" d="M14 11a5 5 0 0 0-7.1-.1L5.5 12.3a3.5 3.5 0 0 0 5 5L12 16" />
    </svg>
  )
}

function CoursesPanel() {
  return (
    <div className="relative flex h-full min-h-40 items-center justify-center overflow-hidden bg-[#12151f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(45,212,191,0.28),transparent_55%)]" />
      <div className="relative w-28">
        <div className="absolute left-3 top-3 h-16 w-24 rounded-md bg-violet-500/30" />
        <div className="absolute left-1.5 top-1.5 h-16 w-24 rounded-md bg-sky-400/25" />
        <div className="relative rounded-md bg-[#1c2433] px-3 py-3 ring-1 ring-white/15">
          <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-teal-300">Package</p>
          <p className="mt-1 text-sm font-bold leading-4 text-white">AI Premium</p>
          <p className="mt-2 h-1 w-10 rounded-full bg-teal-300" />
        </div>
      </div>
    </div>
  )
}

function FilesPanel() {
  return (
    <div className="relative flex h-full min-h-40 items-center justify-center overflow-hidden bg-[#12151f]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(56,189,248,0.28),transparent_55%)]" />
      <div className="relative h-24 w-28">
        <div className="absolute left-4 top-1 h-20 w-16 rotate-6 rounded-md bg-sky-300/80" />
        <div className="absolute left-2 top-3 h-20 w-16 -rotate-3 rounded-md bg-white/90" />
        <div className="absolute left-6 top-6 h-16 w-20 rounded-md bg-[#0f766e] ring-1 ring-white/20">
          <p className="px-2 pt-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-teal-100">Kit</p>
          <p className="px-2 pt-1 text-xs font-bold text-white">Partner</p>
        </div>
      </div>
    </div>
  )
}

function formatFallbackDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

function AffiliateAnnouncements() {
  const [featured, setFeatured] = useState([])
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getAffiliateAnnouncements()
      .then((data) => {
        if (cancelled) return
        setFeatured(data.featured || [])
        setNotices(data.notices || [])
        setError('')
      })
      .catch((err) => {
        if (cancelled) return
        setError(err.response?.data?.message || 'Could not load announcements')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="-mx-4 -my-8 min-h-[calc(100vh-4.25rem)] bg-[#10131c] px-4 py-8 text-slate-100 sm:-mx-8 sm:px-8">
      <div className="flex items-start gap-3">
        <span className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-teal-300 ring-1 ring-white/10">
          <MegaphoneIcon />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Announcements</h1>
          <p className="mt-1 text-sm text-slate-400">Campaign notes, package changes, and what to share this week.</p>
        </div>
      </div>

      {loading ? <p className="mt-8 text-sm text-slate-400">Loading announcements...</p> : null}
      {error ? <p className="mt-8 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p> : null}

      {!loading && !error && featured.length === 0 && notices.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-white/15 bg-[#171b27] px-6 py-16 text-center">
          <p className="text-lg font-semibold">No announcements yet</p>
          <p className="mt-2 text-sm text-slate-400">New campaign notes will appear here when published.</p>
        </div>
      ) : null}

      {featured.length > 0 ? (
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {featured.map((item) => (
            <article
              key={item.id}
              className="grid overflow-hidden rounded-xl border border-white/10 bg-[#171b27] sm:grid-cols-[10.5rem_1fr]"
            >
              {item.panel === 'files' ? <FilesPanel /> : <CoursesPanel />}
              <div className="px-5 py-5">
                {item.tag ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-300">{item.tag}</p>
                ) : null}
                <h2 className="mt-2 text-lg font-bold tracking-tight">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
                <p className="mt-4 text-xs text-slate-500">
                  {item.displayDate || formatFallbackDate(item.publishedAt)}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {notices.length > 0 ? (
        <div className={`space-y-3 ${featured.length > 0 ? 'mt-4' : 'mt-8'}`}>
          {notices.map((item) => (
            <article
              key={item.id}
              className="flex items-start gap-4 rounded-xl border border-white/10 bg-[#171b27] px-4 py-4 sm:items-center"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/5 text-teal-300 ring-1 ring-white/10">
                <NoticeIcon name={item.icon || 'megaphone'} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-sm font-semibold">{item.title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-400">{item.body}</p>
              </div>
              <p className="hidden shrink-0 text-xs text-slate-500 sm:block">
                {item.displayDate || formatFallbackDate(item.publishedAt)}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default AffiliateAnnouncements
