const rupees = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const rupeesExact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export const money = (value) => rupees.format(Number(value || 0))

export const moneyExact = (value) => rupeesExact.format(Number(value || 0))

export const dateTime = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const dateOnly = (value) => {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export const ORDER_STATUS_STYLE = {
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  pending: 'bg-amber-50 text-amber-700 ring-amber-100',
  failed: 'bg-red-50 text-red-700 ring-red-100',
  cancelled: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export const PAYMENT_STATUS_STYLE = {
  captured: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  pending: 'bg-amber-50 text-amber-700 ring-amber-100',
  failed: 'bg-red-50 text-red-700 ring-red-100',
}

export const SOURCE_LABEL = {
  signup: 'Signup',
  upgrade: 'Upgrade',
  manual: 'Manual',
  legacy: 'Historical',
}

export const PAYMENT_METHOD_LABEL = {
  upi: 'UPI',
  card: 'Card',
  netbanking: 'Net banking',
  wallet: 'Wallet',
  bank_transfer: 'Bank transfer',
  cash: 'Cash',
  other: 'Other',
}

export const INCOME_LABEL = {
  active: 'Level 1 · Active',
  passive: 'Level 2 · Passive',
  second: 'Level 3 · Second',
  adjustment: 'Adjustment',
}

export const COMMISSION_STATUS_STYLE = {
  credited: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  reversed: 'bg-rose-50 text-rose-700 ring-rose-100',
}

export const COMMISSION_SOURCE_LABEL = {
  sale: 'Sale',
  adjustment: 'Adjustment',
}

export const titleCase = (value) => {
  const text = String(value || '').replace(/_/g, ' ')
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : '—'
}
