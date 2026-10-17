import { useMemo, useState } from 'react'

const FEATURED = {
  id: 'partner-kit',
  title: 'Partner kit',
  text: 'One file for the first conversation: the offer, the three packages, and how a referral joins.',
  fileName: 'digital-vidhya-partner-kit.txt',
  keywords: 'partner kit brief overview starter',
}

const DOCUMENTS = [
  {
    id: 'social-expert',
    title: 'Social Expert brochure',
    cover: 'Social Expert',
    kind: 'Brochure',
    bar: '#c084fc',
    glow: 'rgba(192,132,252,0.45)',
    summary: 'Instagram Branding, LinkedIn Expert, YouTube Master, and Sales Funnel.',
  },
  {
    id: 'ads-expert',
    title: 'Ads Expert brochure',
    cover: 'Ads Expert',
    kind: 'Brochure',
    bar: '#38bdf8',
    glow: 'rgba(56,189,248,0.45)',
    summary: 'Meta Ads Expert, Google Ads Expert, and Website Design.',
  },
  {
    id: 'ai-premium',
    title: 'AI Premium Expert brochure',
    cover: 'AI Premium',
    kind: 'Brochure',
    bar: '#2dd4bf',
    glow: 'rgba(45,212,191,0.45)',
    summary: 'AI Master, E-Commerce, and Freelancing.',
  },
  {
    id: 'referral-guide',
    title: 'Referral guide',
    cover: 'Referral',
    kind: 'Guide',
    bar: '#fbbf24',
    glow: 'rgba(251,191,36,0.4)',
    summary: 'How to share your link, what to say, and what the learner receives.',
  },
  {
    id: 'brand-kit',
    title: 'Brand kit',
    cover: 'Brand kit',
    kind: 'Assets',
    bar: '#fb7185',
    glow: 'rgba(251,113,133,0.4)',
    summary: 'Name, colors, and a simple way to talk about Digital Vidhya.',
  },
]

function downloadSheet(doc) {
  const lines = [
    'Digital Vidhya',
    doc.title,
    '',
    doc.summary || doc.text,
    '',
    'Share this with someone you refer. Live sales and commissions stay on the Earnings page.',
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = doc.fileName || `${doc.id}.txt`
  link.click()
  URL.revokeObjectURL(url)
}

function SearchIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <path strokeLinecap="round" d="m20 20-3.5-3.5" />
    </svg>
  )
}

function CheckIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
    </svg>
  )
}

function DownloadIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <path strokeLinecap="round" d="M12 4v10" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m8 10 4 4 4-4" />
      <path strokeLinecap="round" d="M5 19h14" />
    </svg>
  )
}

function FolderArt() {
  return (
    <svg viewBox="0 0 240 180" className="h-36 w-48 sm:h-44 sm:w-56" aria-hidden="true">
      <rect x="78" y="22" width="86" height="78" rx="6" fill="#ecfeff" transform="rotate(-8 120 60)" />
      <rect x="92" y="34" width="48" height="4" rx="2" fill="#99f6e4" transform="rotate(-8 116 36)" />
      <rect x="92" y="44" width="36" height="4" rx="2" fill="#5eead4" transform="rotate(-8 110 46)" />
      <path d="M28 72h62l16 16h106v64H28V72Z" fill="#115e59" />
      <path d="M28 96h184v62H28V96Z" fill="url(#kitFolder)" />
      <path d="M28 96h184" stroke="rgba(255,255,255,0.35)" />
      <defs>
        <linearGradient id="kitFolder" x1="28" y1="96" x2="212" y2="158" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5eead4" />
          <stop offset="1" stopColor="#0f766e" />
        </linearGradient>
      </defs>
    </svg>
  )
}

function Cover({ doc }) {
  return (
    <div className="relative h-44 overflow-hidden">
      <div className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/[0.04] to-transparent`} />
      <div
        className="absolute bottom-2 left-1/2 h-16 w-28 -translate-x-1/2 rounded-full blur-2xl"
        style={{ background: doc.glow }}
      />
      <div className="absolute left-1/2 top-5 h-36 w-24 -translate-x-1/2 transition duration-300 group-hover:-translate-y-1">
        <div className="absolute left-2 top-2 h-36 w-24 rounded-lg bg-black/45" />
        <div className="relative flex h-36 w-24 flex-col overflow-hidden rounded-lg bg-[#1c2230] ring-1 ring-white/15 shadow-lg shadow-black/30">
          <span className="h-1.5 w-full" style={{ background: doc.bar }} />
          <div className="flex flex-1 flex-col px-2.5 pb-3 pt-3">
            <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-500">Digital Vidhya</span>
            <span className="mt-auto text-[13px] font-bold leading-4 text-white">{doc.cover}</span>
            <span className="mt-1 text-[10px] text-slate-400">{doc.kind}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function AffiliateDownloads() {
  const [query, setQuery] = useState('')
  const [downloadedId, setDownloadedId] = useState('')
  const needle = query.trim().toLowerCase()

  const documents = useMemo(() => {
    if (!needle) return DOCUMENTS
    return DOCUMENTS.filter((doc) => `${doc.title} ${doc.summary} ${doc.cover}`.toLowerCase().includes(needle))
  }, [needle])

  const showFeatured = !needle || `${FEATURED.title} ${FEATURED.text} ${FEATURED.keywords}`.toLowerCase().includes(needle)

  const handleDownload = (doc) => {
    downloadSheet(doc)
    setDownloadedId(doc.id)
    window.setTimeout(() => {
      setDownloadedId((current) => (current === doc.id ? '' : current))
    }, 1600)
  }

  return (
    <div className="-mx-4 -my-8 min-h-[calc(100vh-4.25rem)] bg-[#10131c] px-4 py-8 text-slate-100 sm:-mx-8 sm:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200/70">Resources</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Downloads</h1>
          <p className="mt-1.5 max-w-md text-sm text-slate-400">
            Files you can send while you talk about Digital Vidhya.
          </p>
        </div>

        <label className="relative block w-full max-w-xs shrink-0 self-start sm:self-center">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
            <SearchIcon />
          </span>
          <span className="sr-only">Search documents</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search documents"
            className="w-full rounded-full border border-white/10 bg-[#171b27] py-2.5 pl-11 pr-4 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-teal-300/40"
          />
        </label>
      </div>

      {showFeatured ? (
        <article className="relative mt-7 overflow-hidden rounded-2xl border border-white/10 bg-[#171b27]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-teal-400/12 to-transparent" />
          <div className="relative grid lg:grid-cols-[minmax(0,1.15fr)_minmax(15rem,0.85fr)]">
            <div className="px-6 py-8 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-200/80">Start here</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Partner kit</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">{FEATURED.text}</p>
              <button
                type="button"
                onClick={() => handleDownload(FEATURED)}
                className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-teal-300 px-5 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-teal-200"
              >
                {downloadedId === FEATURED.id ? <CheckIcon /> : <DownloadIcon />}
                {downloadedId === FEATURED.id ? 'Downloaded' : 'Download kit'}
              </button>
            </div>
            <div className="flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.14),transparent_68%)] py-6 lg:py-4">
              <FolderArt />
            </div>
          </div>
        </article>
      ) : null}

      <div className="mt-8">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Shareable files</h2>
            <p className="mt-0.5 text-sm text-slate-400">Brochures, guides, and brand assets for your referrals.</p>
          </div>
          <p className="text-xs font-semibold text-slate-500">
            {documents.length} file{documents.length === 1 ? '' : 's'}
          </p>
        </div>

        {documents.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#171b27] px-4 py-12 text-center text-sm text-slate-400">
            No documents match “{query.trim()}”.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {documents.map((doc) => {
              const isDownloaded = downloadedId === doc.id
              return (
                <article
                  key={doc.id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-[#171b27] transition hover:border-white/20"
                >
                  <Cover doc={doc} />
                  <div className="px-4 pb-4 text-center">
                    <h3 className="text-sm font-semibold leading-5 text-white">{doc.title}</h3>
                    <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500">{doc.kind}</p>
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-3 py-2 text-sm font-semibold text-white transition hover:border-teal-300/45 hover:bg-teal-300/10"
                    >
                      {isDownloaded ? <CheckIcon className="h-3.5 w-3.5" /> : <DownloadIcon className="h-3.5 w-3.5" />}
                      {isDownloaded ? 'Downloaded' : 'Download'}
                    </button>
                  </div>
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default AffiliateDownloads
