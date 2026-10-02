import { useEffect, useMemo } from 'react'
import { formatRupees, priceBreakdown } from '../data/checkoutPackages'

function CheckoutModal({ pkg, onClose, onPay, paying, closeLabel = 'Cancel' }) {
  const breakdown = useMemo(() => priceBreakdown(pkg.price), [pkg.price])

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

          <p className="mt-4 rounded-xl border border-white/10 bg-[#10131c] px-3.5 py-3 text-xs leading-5 text-slate-400">
            Package purchases are final and non-refundable. Click Pay to unlock this package on your account.
          </p>
        </div>

        <div className="flex gap-3 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={paying}
            className="flex-1 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/5 disabled:opacity-60"
          >
            {closeLabel}
          </button>
          <button
            type="button"
            onClick={onPay}
            disabled={paying}
            className="flex-1 rounded-full bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 px-4 py-2.5 text-sm font-bold text-[#1a1203] transition hover:brightness-105 disabled:opacity-60"
          >
            {paying ? 'Processing…' : `Pay ${formatRupees(breakdown.total)}`}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CheckoutModal
