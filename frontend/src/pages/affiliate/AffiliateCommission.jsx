import { useEffect, useState } from 'react'
import { getAffiliateCommissionPlan } from '../../services/api'

const PACKAGE_ACCENT = {
  'social-expert': {
    glow: 'from-sky-500/20 via-sky-500/5 to-transparent',
    ring: 'ring-sky-400/25',
    price: 'text-sky-300',
    priceBg: 'bg-sky-400/10 ring-sky-400/30',
  },
  'ads-expert': {
    glow: 'from-amber-400/20 via-amber-400/5 to-transparent',
    ring: 'ring-amber-400/25',
    price: 'text-amber-200',
    priceBg: 'bg-amber-400/10 ring-amber-400/30',
  },
  'ai-premium-expert': {
    glow: 'from-violet-500/20 via-violet-500/5 to-transparent',
    ring: 'ring-violet-400/25',
    price: 'text-violet-200',
    priceBg: 'bg-violet-400/10 ring-violet-400/30',
  },
}

const LEVEL_META = {
  active: {
    label: 'Active · L1',
    note: 'Your direct referral buys a package',
    tone: 'text-teal-200',
    badge: 'bg-teal-400/15 text-teal-200 ring-teal-300/25',
  },
  passive: {
    label: 'Passive · L2',
    note: 'Someone your referral brought in buys',
    tone: 'text-sky-200',
    badge: 'bg-sky-400/15 text-sky-200 ring-sky-300/25',
  },
  second: {
    label: 'Second · L3',
    note: 'One more step down the chain buys',
    tone: 'text-violet-200',
    badge: 'bg-violet-400/15 text-violet-200 ring-violet-300/25',
  },
}

function rupees(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
}

function AffiliateCommission() {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    getAffiliateCommissionPlan()
      .then((payload) => {
        if (!active) return
        setPackages(payload?.packages || [])
        setError('')
      })
      .catch((err) => {
        if (!active) return
        setError(err.response?.data?.message || 'Could not load commission structure')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="-mx-4 -my-8 min-h-[calc(100vh-4.25rem)] bg-[#10131c] px-4 py-8 text-slate-100 sm:-mx-8 sm:px-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-200/70">Marketing plan</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">Commission Structure</h1>
        <p className="mt-1.5 max-w-2xl text-sm text-slate-400">
          Every purchase pays a fixed % of net amount (after 18% GST) to up to three levels in the referral chain.
          Nothing is paid beyond level 3.
        </p>
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        {Object.values(LEVEL_META).map((level) => (
          <article key={level.label} className="rounded-2xl border border-white/10 bg-[#171b27] px-4 py-4">
            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${level.badge}`}>
              {level.label}
            </span>
            <p className={`mt-3 text-sm font-semibold ${level.tone}`}>{level.note}</p>
          </article>
        ))}
      </section>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>
      ) : null}

      {loading ? (
        <p className="mt-8 text-sm text-slate-400">Loading commission plan…</p>
      ) : (
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {packages.map((pkg) => {
            const accent = PACKAGE_ACCENT[pkg.id] || PACKAGE_ACCENT['social-expert']

            return (
              <article
                key={pkg.id}
                className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#171b27] p-5 ring-1 ${accent.ring}`}
              >
                <div className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${accent.glow}`} />

                <div className="relative">
                  <h2 className="text-xl font-bold tracking-tight text-white">{pkg.name}</h2>
                  <div className={`mt-4 rounded-2xl px-4 py-3 text-center ring-1 ${accent.priceBg}`}>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Listed price</p>
                    <p className={`mt-1 text-3xl font-extrabold tracking-tight ${accent.price}`}>
                      {rupees(pkg.listedPrice)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Net after GST · {rupees(pkg.netAmount)}</p>
                  </div>

                  <dl className="mt-5 space-y-3">
                    {(pkg.levels || []).map((level) => {
                      const meta = LEVEL_META[level.incomeType] || LEVEL_META.active
                      return (
                        <div
                          key={level.incomeType}
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#10131c]/70 px-3.5 py-3"
                        >
                          <div>
                            <dt className={`text-sm font-semibold ${meta.tone}`}>{meta.label}</dt>
                            <dd className="mt-0.5 text-[11px] text-slate-500">{level.percent}%</dd>
                          </div>
                          <dd className="text-base font-bold text-white">{rupees(level.amount)}</dd>
                        </div>
                      )
                    })}
                  </dl>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <p className="mt-6 max-w-2xl text-xs leading-5 text-slate-500">
        Percents come from the Digital Aarambh marketing plan and apply on every package purchase in your chain.
        An upline only earns if they own a package. Empty levels are retained by the company.
      </p>
    </div>
  )
}

export default AffiliateCommission
