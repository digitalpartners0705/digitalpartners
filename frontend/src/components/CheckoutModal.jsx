import { useEffect, useMemo } from 'react'
import { formatRupees, priceBreakdown } from '../data/checkoutPackages'

function CheckoutModal({ pkg, onClose, onPay, paying, error = '', received = null, applyPromo = true }) {
  const breakdown = useMemo(() => priceBreakdown(pkg, { applyPromo }), [pkg, applyPromo])

  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape' && !paying) onClose()
    }
    document.addEventListener('keydown', onKey)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previous
    }
  }, [onClose, paying])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4" onClick={() => !paying && onClose()}>
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#171b27] text-slate-100 shadow-2xl shadow-black/40"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
      >
        {received ? (
          <>
            <div className="px-5 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
                <svg viewBox="0 0 20 20" className="h-6 w-6" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.5 7.5a1 1 0 0 1-1.4 0L3.3 9.7a1 1 0 1 1 1.4-1.4l3.8 3.79 6.8-6.8a1 1 0 0 1 1.4 0Z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <h2 id="checkout-title" className="mt-4 text-xl font-extrabold tracking-tight">
                Your order is received
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {received.orderNumber ? (
                  <>
                    Order <span className="font-semibold text-white">{received.orderNumber}</span> for{' '}
                    {received.packageName || pkg.name} has been received.{' '}
                  </>
                ) : (
                  <>Your order for {received.packageName || pkg.name} has been received. </>
                )}
                Our team will contact you shortly to complete the payment. Your subscription will start once the
                payment is confirmed.
              </p>
            </div>
            <div className="border-t border-white/10 px-5 py-4">
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-full bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 px-4 py-2.5 text-sm font-bold text-[#1a1203] transition hover:brightness-105"
              >
                Done
              </button>
            </div>
          </>
        ) : (
          <>
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
                  <dt className="text-slate-400">Total price (MRP)</dt>
                  <dd className="font-semibold text-white">{formatRupees(breakdown.mrp)}</dd>
                </div>
                {breakdown.discount > 0 ? (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-emerald-300">Promo / referral discount</dt>
                    <dd className="font-semibold text-emerald-300">−{formatRupees(breakdown.discount)}</dd>
                  </div>
                ) : null}
                <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                  <dt className="text-slate-400">Package price (before GST)</dt>
                  <dd className="font-semibold text-white">{formatRupees(breakdown.net)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-400">GST (18%)</dt>
                  <dd className="font-semibold text-white">{formatRupees(breakdown.gst)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3">
                  <dt className="font-semibold text-slate-200">Total payable</dt>
                  <dd className="text-lg font-extrabold text-gold-300">{formatRupees(breakdown.total)}</dd>
                </div>
              </dl>

              {error ? (
                <p className="mt-3 rounded-xl border border-red-300/40 bg-red-50 px-3.5 py-3 text-xs leading-5 text-red-700">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="border-t border-white/10 px-5 py-4">
              <button
                type="button"
                onClick={onPay}
                disabled={paying}
                className="w-full rounded-full bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 px-4 py-2.5 text-sm font-bold text-[#1a1203] transition hover:brightness-105 disabled:opacity-60"
              >
                {paying ? 'Sending…' : `Pay ${formatRupees(breakdown.total)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default CheckoutModal
