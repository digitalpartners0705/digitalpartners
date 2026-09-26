import { useMemo, useState } from 'react'

const FEATURED = {
  id: 'partner-kit',
  title: 'Partner kit',
  text: 'One file for the first conversation: the offer, the three packages, and how a referral joins.',
  fileName: 'digital-expert-partner-kit.txt',
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
    summary: 'Name, colors, and a simple way to talk about Digital Expert.',
  },
]

function downloadSheet(doc) {
  const lines = [
    'Digital Expert',
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

function FolderArt() {
  return (
    <svg viewBox="0 0 240 180" className="h-40 w-52 sm:h-48 sm:w-64" aria-hidden="true">
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
    <div className="relative h-48">
      <div
        className="absolute bottom-3 left-1/2 h-16 w-28 -translate-x-1/2 rounded-full blur-2xl"
        style={{ background: doc.glow }}
      />
      <div className="absolute left-1/2 top-6 h-36 w-24 -translate-x-1/2">
        <div className="absolute left-2 top-2 h-36 w-24 rounded-md bg-black/50" />
        <div className="relative flex h-36 w-24 flex-col overflow-hidden rounded-md bg-[#1c2230] ring-1 ring-white/15">
          <span className="h-1.5 w-full" style={{ background: doc.bar }} />
          <div className="flex flex-1 flex-col px-2.5 pb-3 pt-3">
            <span className="text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-500">Digital Expert</span>
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
  const needle = query.trim().toLowerCase()

  const documents = useMemo(() => {
    if (!needle) return DOCUMENTS
    return DOCUMENTS.filter((doc) => `${doc.title} ${doc.summary} ${doc.cover}`.toLowerCase().includes(needle))
  }, [needle])

  const showFeatured = !needle || `${FEATURED.title} ${FEATURED.text} ${FEATURED.keywords}`.toLowerCase().includes(needle)

  return (
    <div className="-mx-4 -my-8 min-h-[calc(100vh-4.25rem)] bg-[#10131c] px-4 py-8 text-slate-100 sm:-mx-8 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Downloads</h1>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
            Files you can send while you talk about Digital Expert.
          </p>
        </div>
        <label className="flex w-full max-w-xs items-center gap-2 rounded-full border border-white/10 bg-[#171b27] px-4 py-2.5">
          <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path strokeLinecap="round" d="m16 16 4 4" />
          </svg>
          <span className="sr-only">Search documents</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search documents"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </label>
      </div>

      {showFeatured ? (
        <article className="mt-8 grid overflow-hidden rounded-xl border border-white/10 bg-[#171b27] lg:grid-cols-[minmax(0,1.1fr)_minmax(16rem,0.9fr)]">
          <div className="px-6 py-8 sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">Start here</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight">Partner kit</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">{FEATURED.text}</p>
            <button
              type="button"
              onClick={() => downloadSheet(FEATURED)}
              className="mt-6 cursor-pointer rounded-lg bg-teal-300 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-teal-200"
            >
              Download kit
            </button>
          </div>
          <div className="flex items-center justify-center bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.16),transparent_68%)] py-4">
            <FolderArt />
          </div>
        </article>
      ) : null}

      <div className="mt-8">
        {documents.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-[#171b27] px-4 py-10 text-center text-sm text-slate-400">
            No documents match “{query.trim()}”.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {documents.map((doc) => (
              <article key={doc.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#141824]">
                <Cover doc={doc} />
                <div className="px-4 pb-4 text-center">
                  <h2 className="text-sm font-semibold leading-5">{doc.title}</h2>
                  <button
                    type="button"
                    onClick={() => downloadSheet(doc)}
                    className="mt-3 w-full cursor-pointer rounded-lg border border-white/10 py-1.5 text-sm text-slate-200 hover:border-white/25 hover:bg-white/5"
                  >
                    Download
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AffiliateDownloads
