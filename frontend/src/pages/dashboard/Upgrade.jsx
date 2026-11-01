import { useState } from 'react'
import CheckoutModal from '../../components/CheckoutModal'
import { useAuth } from '../../context/AuthContext'
import {
  CHECKOUT_PACKAGES,
  PACKAGE_RANK,
  formatRupees,
} from '../../data/checkoutPackages'
import { purchasePackage } from '../../services/api'

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

function Upgrade() {
  const { user, updateUser } = useAuth()
  const currentPackage = user?.knowledgePackage || null
  const currentRank = PACKAGE_RANK[currentPackage] || 0
  const applyPromo = Boolean(user?.referredBy || user?.promoCode)
  const [checkoutPkg, setCheckoutPkg] = useState(null)
  const [receivedOrder, setReceivedOrder] = useState(null)
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState('')
  const hasPendingOrder = Boolean(user?.pendingOrder)

  const handlePay = async () => {
    if (!checkoutPkg || receivedOrder) return
    setError('')
    setPaying(true)
    try {
      const data = await purchasePackage(checkoutPkg.name)
      updateUser(data.user)
      setReceivedOrder({
        orderNumber: data.order?.orderNumber,
        packageName: data.order?.packageName || checkoutPkg.name,
      })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place the order')
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

      {error && !checkoutPkg ? (
        <p className="rounded-xl border border-red-300/50 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-3">
        {CHECKOUT_PACKAGES.map((pkg) => {
          const styles = accentStyles[pkg.accent]
          const isCurrent = currentPackage === pkg.name
          const isLower = (PACKAGE_RANK[pkg.name] || 0) <= currentRank
          const disabled = isCurrent || isLower || paying || hasPendingOrder
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

              {applyPromo ? (
                <div className="mt-5">
                  <p className="text-sm text-slate-500 line-through">{formatRupees(pkg.mrp)}</p>
                  <p className={`text-4xl font-extrabold ${styles.price}`}>{formatRupees(pkg.price)}</p>
                  <p className="mt-1 text-xs font-medium text-emerald-300">Promo / referral price</p>
                </div>
              ) : (
                <p className={`mt-5 text-4xl font-extrabold ${styles.price}`}>{formatRupees(pkg.mrp)}</p>
              )}

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
                  setReceivedOrder(null)
                  setCheckoutPkg(pkg)
                }}
                className={`mt-7 w-full rounded-xl py-3 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${styles.button}`}
              >
                {isCurrent ? 'Current plan' : isLower ? 'Included in your plan' : hasPendingOrder ? 'Order pending' : 'Buy Now'}
              </button>
            </article>
          )
        })}
      </section>

      {checkoutPkg ? (
        <CheckoutModal
          pkg={checkoutPkg}
          paying={paying}
          error={error}
          received={receivedOrder}
          applyPromo={applyPromo}
          onClose={() => {
            if (!paying) {
              setCheckoutPkg(null)
              setReceivedOrder(null)
              setError('')
            }
          }}
          onPay={handlePay}
        />
      ) : null}
    </div>
  )
}

export default Upgrade
