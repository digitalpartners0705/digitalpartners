import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { buildGeneralLink, buildPackageLink } from '../../utils/referral'
import AffiliateLeads from './AffiliateLeads'

const TABS = [
  { id: 'links', label: 'Link Generator' },
  { id: 'leads', label: 'All Leads' },
]

const PACKAGES = [
  {
    id: 'social-expert',
    name: 'Social Expert',
    short: 'Social',
    price: 6999,
    accent: 'sky',
    tagline: 'Social & content foundation',
  },
  {
    id: 'ads-expert',
    name: 'Ads Expert',
    short: 'Ads',
    price: 14999,
    accent: 'gold',
    tagline: 'Paid ads & lead generation',
  },
  {
    id: 'ai-premium-expert',
    name: 'AI Premium Expert',
    short: 'AI Premium',
    price: 21999,
    accent: 'violet',
    tagline: 'Full ecosystem to earn online',
  },
]

const COUNTRIES = ['India', 'United Arab Emirates', 'United States', 'United Kingdom', 'Singapore', 'Canada']

const ACCENT = {
  sky: {
    glow: 'from-sky-500/20 via-sky-500/5 to-transparent',
    ring: 'ring-sky-400/25',
    price: 'text-sky-300',
    priceBg: 'bg-sky-400/10 ring-sky-400/30',
    mark: 'from-sky-400 to-sky-600',
    soft: 'hover:border-sky-400/45',
    ready: 'bg-sky-300 text-slate-900 hover:bg-sky-200',
  },
  gold: {
    glow: 'from-amber-400/20 via-amber-400/5 to-transparent',
    ring: 'ring-amber-400/25',
    price: 'text-amber-200',
    priceBg: 'bg-amber-400/10 ring-amber-400/30',
    mark: 'from-amber-300 to-amber-500',
    soft: 'hover:border-amber-400/45',
    ready: 'bg-amber-300 text-slate-900 hover:bg-amber-200',
  },
  violet: {
    glow: 'from-violet-500/20 via-violet-500/5 to-transparent',
    ring: 'ring-violet-400/25',
    price: 'text-violet-200',
    priceBg: 'bg-violet-400/10 ring-violet-400/30',
    mark: 'from-violet-400 to-violet-600',
    soft: 'hover:border-violet-400/45',
    ready: 'bg-violet-300 text-slate-900 hover:bg-violet-200',
  },
}

function rupees(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`
}

function CopyIcon({ className = 'h-4 w-4' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path strokeLinecap="round" d="M6 15H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
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

function PackageMark({ short, accent }) {
  const styles = ACCENT[accent]
  return (
    <div className="relative mx-auto flex h-24 w-24 items-center justify-center sm:h-28 sm:w-28">
      <div className={`absolute inset-2.5 rounded-2xl bg-gradient-to-br ${styles.mark} opacity-95 shadow-lg shadow-black/30`} />
      <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rounded-2xl border border-white/10 bg-[#0c0f16]/70" />
      <div className="absolute inset-0 -translate-x-0.5 -translate-y-0.5 rounded-2xl border border-white/15 bg-[#1a1f2c]" />
      <span className="relative z-10 max-w-[5.25rem] text-center text-[10px] font-extrabold uppercase tracking-[0.16em] text-white sm:text-[11px]">
        {short}
      </span>
    </div>
  )
}

function buildOrigin() {
  if (typeof window === 'undefined') return 'https://digitalvidhya.com'
  return window.location.origin
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.left = '-9999px'
  document.body.appendChild(area)
  area.select()
  document.execCommand('copy')
  document.body.removeChild(area)
}

function useCopyFlash() {
  const [copiedKey, setCopiedKey] = useState('')

  const flashCopied = (key) => {
    setCopiedKey(key)
    window.setTimeout(() => {
      setCopiedKey((current) => (current === key ? '' : current))
    }, 1600)
  }

  return { copiedKey, flashCopied }
}

function LinkGeneratorPanel({ refCode, origin, generalLink }) {
  const { copiedKey, flashCopied } = useCopyFlash()
  const [countries, setCountries] = useState(() =>
    Object.fromEntries(PACKAGES.map((pkg) => [pkg.id, ''])),
  )

  const handleCopyGeneral = async () => {
    if (refCode === '—') return
    await copyText(generalLink)
    flashCopied('general')
  }

  const handleCopyPackage = async (pkg) => {
    const country = countries[pkg.id]
    if (!country || refCode === '—') return
    await copyText(buildPackageLink(origin, refCode, pkg.id, country))
    flashCopied(pkg.id)
  }

  return (
    <>
      <section className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#171b27]">
        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-200/80">General referral link</p>
            <p className="mt-1.5 truncate font-mono text-sm text-slate-200" title={generalLink}>
              {generalLink}
            </p>
          </div>
          <button
            type="button"
            onClick={handleCopyGeneral}
            disabled={refCode === '—'}
            className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 self-end rounded-full bg-teal-300 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-50 sm:self-auto"
            aria-label="Copy general referral link"
          >
            {copiedKey === 'general' ? <CheckIcon /> : <CopyIcon />}
            {copiedKey === 'general' ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4">
          <h2 className="text-lg font-bold tracking-tight">Package links</h2>
          <p className="mt-0.5 text-sm text-slate-400">
            Pick a country, then copy a link for that package.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          {PACKAGES.map((pkg) => {
            const styles = ACCENT[pkg.accent]
            const country = countries[pkg.id]
            const ready = Boolean(country) && refCode !== '—'
            const isCopied = copiedKey === pkg.id

            return (
              <article
                key={pkg.id}
                className={`group relative overflow-hidden rounded-2xl border border-white/10 bg-[#171b27] p-5 pt-6 ring-1 transition ${styles.ring} ${styles.soft}`}
              >
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b ${styles.glow}`} />

                <div className="relative flex h-full flex-col">
                  <PackageMark short={pkg.short} accent={pkg.accent} />

                  <div className="mt-5 text-center">
                    <h3 className="text-xl font-bold tracking-tight text-white">{pkg.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{pkg.tagline}</p>
                  </div>

                  <div className={`mt-5 rounded-2xl px-4 py-3 text-center ring-1 ${styles.priceBg}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Package price</p>
                    <p className={`mt-1 text-3xl font-extrabold tracking-tight ${styles.price}`}>{rupees(pkg.price)}</p>
                  </div>

                  <label className="mt-5 block">
                    <span className="mb-1.5 block text-xs font-medium text-slate-400">Country</span>
                    <select
                      value={country}
                      onChange={(event) =>
                        setCountries((current) => ({ ...current, [pkg.id]: event.target.value }))
                      }
                      className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-[#10131c] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-teal-300/40"
                    >
                      <option value="">Select Country</option>
                      {COUNTRIES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <button
                    type="button"
                    disabled={!ready}
                    onClick={() => handleCopyPackage(pkg)}
                    className={`mt-5 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:border disabled:border-white/10 disabled:bg-white/[0.03] disabled:text-slate-400 disabled:opacity-70 ${
                      ready || isCopied ? styles.ready : ''
                    }`}
                  >
                    {isCopied ? <CheckIcon /> : <CopyIcon />}
                    {isCopied ? 'Link copied' : ready ? 'Copy Link' : 'Select country first'}
                  </button>
                </div>
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}

function AffiliateLinks() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') === 'leads' ? 'leads' : 'links'
  const { copiedKey, flashCopied } = useCopyFlash()

  const refCode = user?.referralCode || '—'
  const origin = useMemo(() => buildOrigin(), [])
  const generalLink = refCode !== '—' ? buildGeneralLink(origin, refCode) : `${origin}/?ref=`

  const selectTab = (next) => {
    setSearchParams(next === 'leads' ? { tab: 'leads' } : {}, { replace: true })
  }

  const handleCopyCode = async () => {
    if (refCode === '—') return
    await copyText(refCode)
    flashCopied('code')
  }

  return (
    <div className="-mx-4 -my-8 min-h-[calc(100vh-4.25rem)] bg-[#10131c] px-4 py-8 text-slate-100 sm:-mx-8 sm:px-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {tab === 'leads' ? 'All Leads' : 'Referral Link Generation'}
          </h1>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            {tab === 'leads'
              ? 'Every sign-up that came through your referral code, newest first.'
              : 'Share your code or package links with people you want to refer.'}
          </p>
        </div>

        <div className="flex w-full max-w-md items-center gap-4 rounded-full border border-white/10 bg-[#171b27] py-2.5 pl-5 pr-2.5 shadow-lg shadow-black/20 sm:max-w-lg">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold leading-tight text-slate-300 sm:text-xs">
              My Referral
              <br />
              Code
            </p>
          </div>
          <p className="truncate font-mono text-lg font-bold tracking-wide text-white sm:text-2xl">{refCode}</p>
          <button
            type="button"
            onClick={handleCopyCode}
            disabled={refCode === '—'}
            className="inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gradient-to-b from-teal-300 to-teal-500 text-slate-900 shadow-md shadow-teal-900/30 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Copy referral code"
            title={copiedKey === 'code' ? 'Copied' : 'Copy code'}
          >
            {copiedKey === 'code' ? <CheckIcon className="h-[18px] w-[18px]" /> : <CopyIcon className="h-[18px] w-[18px]" />}
          </button>
        </div>
      </div>

      <div className="mt-6 inline-flex rounded-full border border-white/12 bg-[#141823] p-1.5">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectTab(item.id)}
            aria-current={tab === item.id ? 'page' : undefined}
            className={`cursor-pointer rounded-full px-5 py-2.5 text-sm font-bold transition sm:px-7 ${
              tab === item.id
                ? 'bg-gradient-to-b from-teal-400/90 to-teal-600/90 text-white shadow-md shadow-teal-950/40'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'leads' ? (
        <div className="mt-6">
          <AffiliateLeads />
        </div>
      ) : (
        <LinkGeneratorPanel refCode={refCode} origin={origin} generalLink={generalLink} />
      )}
    </div>
  )
}

export default AffiliateLinks
