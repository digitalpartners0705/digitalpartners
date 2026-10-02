import { useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { purchasePackage } from '../../services/api'

const GST_RATE = 0.18

const packages = [
  {
    id: 'social-expert',
    name: 'Social Expert',
    tagline: 'Start your journey and build a strong social foundation.',
    price: 6999,
    accent: 'sky',
    badge: null,
    features: [
      'Social media & content creation mastery',
      '20+ practical lessons with ready templates',
      'Community access & peer support',
      'Completion certificate',
      'Affiliate earning eligibility',
    ],
  },
  {
    id: 'ads-expert',
    name: 'Ads Expert',
    tagline: 'Scale your reach with paid ads and lead generation.',
    price: 14999,
    accent: 'gold',
    badge: 'Most Popular',
    features: [
      'Everything in Social Expert',
      'Meta & Google paid ad campaigns',
      'Funnel & lead-generation frameworks',
      'Live mentor Q&A sessions',
      'Higher affiliate commission tier',
    ],
  },
  {
    id: 'ai-premium-expert',
    name: 'AI Premium Expert',
    tagline: 'The complete ecosystem to earn confidently online.',
    price: 21999,
    accent: 'violet',
    badge: 'Best Value',
    features: [
      'Everything in Ads Expert',
      'AI tools & automation for marketing',
      'Advanced monetization & freelancing playbook',
      '1:1 priority mentorship',
      'Lifetime access & all future updates',
      'Highest affiliate commission tier',
    ],
  },
]

const PACKAGE_RANK = {
  'Social Expert': 1,
  'Ads Expert': 2,
  'AI Premium Expert': 3,
}

const rupees = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

function priceBreakdown(listedPrice) {
  const total = Number(listedPrice)
  const net = Math.round(total * (1 - GST_RATE))
  const gst = total - net
  return { listed: total, net, gst, total }
}

const accentStyles = {
  sky: {
    ring: 'ring-sky-400/30',
    chip: 'bg-sky-500/15 text-sky-300',
    price: 'text-sky-300',
    check: 'text-sky-400',
    button: 'border border-sky-400/60 bg-sky-500/10 text-white hover:bg-sky-500/20',
  },
  gold: {
    ring: 'ring-gold-400/60',
    chip: 'bg-gold-400/20 text-gold-300',
    price: 'text-gold-300',
    check: 'text-gold-400',
    button: 'bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 text-[#1a1203] hover:brightness-105',
  },
  violet: {
    ring: 'ring-violet-400/30',
    chip: 'bg-violet-500/15 text-violet-300',
    price: 'text-violet-300',
    check: 'text-violet-300',
    button: 'border border-violet-400/60 bg-violet-500/10 text-white hover:bg-violet-500/20',
  },
}

function CheckIcon({ className }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.79 6.8-6.8a1 1 0 0 1 1.4 0Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function CheckoutModal({ pkg, onClose, onPay, paying }) {
  const breakdown = useMemo(() => priceBreakdown(pkg.price), [pkg.price])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#171b27] text-slate-100 shadow-2xl shadow-black/40"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
      >
        <div className="border-b border-white/10 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">Checkout</p>
          <h2 id="checkout-title" className="mt-1 text-xl font-extrabold tracking-tight">
            {pkg.name}
          </h2>
          <p className="mt-1 text-sm text-slate-400">{pkg.tagline}</p>
        </div>

        <div className="px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Amount breakdown</p>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">Package price (before GST)</dt>
              <dd className="font-semibold text-white">{rupees(breakdown.net)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">GST (18%)</dt>
              <dd className="font-semibold text-white">{rupees(breakdown.gst)}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
              <dt className="font-semibold text-slate-200">Total payable</dt>
              <dd className="text-lg font-extrabold text-gold-300">{rupees(breakdown.total)}</dd>
            </div>
          </dl>

          <p className="mt-4 rounded-xl border border-white/10 bg-[#10131c] px-3.5 py-3 text-xs leading-5 text-slate-400">
            Payment gateway is not connected yet. Click Pay to unlock this package on your account.
          </p>
        </div>

        <div className="flex gap-3 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={paying}
            className="flex-1 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/5 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onPay}
            disabled={paying}
            className="flex-1 rounded-full bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 px-4 py-2.5 text-sm font-bold text-[#1a1203] transition hover:brightness-105 disabled:opacity-60"
          >
            {paying ? 'Processing…' : `Pay ${rupees(breakdown.total)}`}
          </button>
        </div>
      </div>
    </div>
  )
}

function Upgrade() {
  const { user, updateUser } = useAuth()
  const currentPackage = user?.knowledgePackage || null
  const currentRank = PACKAGE_RANK[currentPackage] || 0
  const [checkoutPkg, setCheckoutPkg] = useState(null)
  const [paying, setPaying] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handlePay = async () => {
    if (!checkoutPkg) return
    setError('')
    setMessage('')
    setPaying(true)
    try {
      const data = await purchasePackage(checkoutPkg.name)
      updateUser(data.user)
      setCheckoutPkg(null)
      const levelsPaid = data.purchase?.levelsPaid?.length || 0
      setMessage(
        levelsPaid > 0
          ? `${checkoutPkg.name} unlocked. Commission was credited to ${levelsPaid} level${levelsPaid === 1 ? '' : 's'} of your referral chain.`
          : `${checkoutPkg.name} unlocked.`,
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Could not complete the purchase')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl bg-ink-950 px-6 py-10 text-white sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.28),transparent_48%),radial-gradient(ellipse_at_80%_30%,rgba(245,193,74,0.16),transparent_42%)]" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">
            Upgrade your plan
          </span>
          <h1 className="mt-4 font-[Plus_Jakarta_Sans,Inter,sans-serif] text-3xl font-extrabold tracking-tight sm:text-4xl">
            Unlock Your <span className="gold-text">Full Potential.</span>
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-300">
            Choose a package to unlock its courses. You only get access to courses inside the package you purchase.
          </p>
        </div>
      </section>

      {message ? (
        <p className="rounded-xl border border-emerald-300/50 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-300/50 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-3">
        {packages.map((pkg) => {
          const styles = accentStyles[pkg.accent]
          const isCurrent = currentPackage === pkg.name
          const isLower = (PACKAGE_RANK[pkg.name] || 0) <= currentRank
          const disabled = isCurrent || isLower || paying
          const highlighted = pkg.accent === 'gold'

          return (
            <article
              key={pkg.id}
              className={`relative flex flex-col rounded-2xl bg-ink-950 p-6 text-white shadow-lg ring-1 ${styles.ring} ${
                highlighted ? 'lg:-translate-y-3 lg:shadow-2xl' : ''
              }`}
            >
              {pkg.badge ? (
                <span className={`absolute right-6 top-6 rounded-full px-3 py-1 text-xs font-bold ${styles.chip}`}>
                  {pkg.badge}
                </span>
              ) : null}

              <h2 className="text-xl font-bold">{pkg.name}</h2>
              <p className="mt-2 min-h-[2.75rem] text-sm leading-6 text-slate-400">{pkg.tagline}</p>

              <p className={`mt-5 text-4xl font-extrabold ${styles.price}`}>{rupees(pkg.price)}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {pkg.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-slate-200">
                    <CheckIcon className={`mt-0.5 h-4 w-4 shrink-0 ${styles.check}`} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={disabled}
                onClick={() => {
                  setError('')
                  setMessage('')
                  setCheckoutPkg(pkg)
                }}
                className={`mt-7 w-full rounded-xl py-3 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${styles.button}`}
              >
                {isCurrent ? 'Current plan' : isLower ? 'Included in your plan' : 'Buy Now'}
              </button>
            </article>
          )
        })}
      </section>

      {checkoutPkg ? (
        <CheckoutModal
          pkg={checkoutPkg}
          paying={paying}
          onClose={() => {
            if (!paying) setCheckoutPkg(null)
          }}
          onPay={handlePay}
        />
      ) : null}
    </div>
  )
}

export default Upgrade
