const { query } = require('../config/db')
const { resolvePackage } = require('../data/commissions')

const GST_RATE = 18

const ORDER_STATUSES = ['pending', 'paid', 'failed', 'cancelled']
const PAYMENT_STATUSES = ['pending', 'captured', 'failed']
const ORDER_SOURCES = ['signup', 'upgrade', 'manual', 'legacy']
const PAYMENT_METHODS = ['upi', 'card', 'netbanking', 'wallet', 'bank_transfer', 'cash', 'other']

const ORDER_COLUMNS = [
  'id',
  'order_number',
  'user_id',
  'package_name',
  'package_slug',
  'listed_price',
  'discount_amount',
  'gross_amount',
  'net_amount',
  'gst_rate',
  'gst_amount',
  'promo_code',
  'coupon_code',
  'status',
  'source',
  'payment_status',
  'payment_provider',
  'payment_method',
  'payment_reference',
  'payment_order_id',
  'paid_at',
  'buyer_name',
  'buyer_email',
  'buyer_phone',
  'buyer_country',
  'buyer_state',
  'has_gst',
  'gst_number',
  'sponsor_id',
  'commission_total',
  'notes',
  'created_by',
  'refunded_at',
  'refund_amount',
  'refund_reason',
  'created_at',
  'updated_at',
]

// The order detail query joins users three times, so every selected order column
// must stay table-qualified to avoid ambiguous references.
const ORDER_FIELDS = ORDER_COLUMNS.map((column) => `o.${column}`).join(', ')
const ORDER_RETURNING = ORDER_COLUMNS.join(', ')

const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100

const toNumber = (value) => (value === null || value === undefined ? null : Number(value))

/**
 * The commission plan fixes each package's net amount, so an undiscounted order must
 * reuse that exact figure or the commission rows will not tie back to the order total.
 */
const buildAmounts = ({ pkg, discountAmount = 0, gstRate = GST_RATE }) => {
  const listedPrice = roundMoney(pkg.listedPrice)
  const discount = Math.min(Math.max(roundMoney(discountAmount), 0), listedPrice)
  const grossAmount = roundMoney(listedPrice - discount)
  const rate = Number(gstRate)
  const netAmount = discount === 0 ? roundMoney(pkg.netAmount) : roundMoney((grossAmount * (100 - rate)) / 100)

  return {
    listedPrice,
    discountAmount: discount,
    grossAmount,
    netAmount,
    gstRate: rate,
    gstAmount: roundMoney(grossAmount - netAmount),
  }
}

const allocateOrderNumber = async () => {
  const result = await query(`SELECT nextval('order_number_seq')::bigint AS seq`)
  return `DE${String(result.rows[0].seq).padStart(6, '0')}`
}

const loadBuyer = async (userId) => {
  const result = await query(
    `SELECT id, full_name, email, phone, country, state, has_gst, referred_by,
            promo_code, coupon_code, knowledge_package
     FROM users WHERE id = $1 LIMIT 1`,
    [userId],
  )
  return result.rows[0] || null
}

const createOrder = async ({
  userId,
  packageName,
  source = 'signup',
  status = 'paid',
  paymentStatus = 'captured',
  paymentProvider = 'none',
  paymentMethod = null,
  paymentReference = null,
  paymentOrderId = null,
  paidAt,
  discountAmount = 0,
  gstRate = GST_RATE,
  promoCode,
  couponCode,
  gstNumber = null,
  notes = null,
  createdBy = null,
  createdAt = null,
  buyer = null,
}) => {
  const pkg = resolvePackage(packageName)
  if (!pkg) return null

  const buyerRow = buyer || (await loadBuyer(userId))
  if (!buyerRow) return null

  const amounts = buildAmounts({ pkg, discountAmount, gstRate })
  const orderNumber = await allocateOrderNumber()
  const resolvedPaidAt =
    paidAt !== undefined
      ? paidAt
      : paymentStatus === 'captured' || status === 'paid'
        ? new Date()
        : null

  const result = await query(
    `INSERT INTO orders (
       order_number, user_id, package_name, package_slug,
       listed_price, discount_amount, gross_amount, net_amount, gst_rate, gst_amount,
       promo_code, coupon_code, status, source,
       payment_status, payment_provider, payment_method, payment_reference, payment_order_id, paid_at,
       buyer_name, buyer_email, buyer_phone, buyer_country, buyer_state, has_gst, gst_number,
       sponsor_id, notes, created_by, created_at, updated_at
     )
     VALUES (
       $1, $2, $3, $4,
       $5, $6, $7, $8, $9, $10,
       $11, $12, $13, $14,
       $15, $16, $17, $18, $19, $20,
       $21, $22, $23, $24, $25, $26, $27,
       $28, $29, $30, COALESCE($31, NOW()), NOW()
     )
     RETURNING ${ORDER_RETURNING}`,
    [
      orderNumber,
      buyerRow.id,
      pkg.name,
      pkg.id,
      amounts.listedPrice,
      amounts.discountAmount,
      amounts.grossAmount,
      amounts.netAmount,
      amounts.gstRate,
      amounts.gstAmount,
      promoCode === undefined ? buyerRow.promo_code || null : promoCode,
      couponCode === undefined ? buyerRow.coupon_code || null : couponCode,
      status,
      source,
      paymentStatus,
      paymentProvider,
      paymentMethod,
      paymentReference,
      paymentOrderId,
      resolvedPaidAt,
      buyerRow.full_name || null,
      buyerRow.email || null,
      buyerRow.phone || null,
      buyerRow.country || null,
      buyerRow.state || null,
      Boolean(buyerRow.has_gst),
      gstNumber,
      buyerRow.referred_by || null,
      notes,
      createdBy,
      createdAt,
    ],
  )

  return result.rows[0]
}

const syncCommissionTotal = async (orderId) => {
  if (!orderId) return 0
  const result = await query(
    `UPDATE orders o
     SET commission_total = COALESCE((
           SELECT SUM(e.amount) FROM affiliate_earnings e
           WHERE e.order_id = o.id AND e.status = 'credited'
         ), 0),
         updated_at = NOW()
     WHERE o.id = $1
     RETURNING commission_total`,
    [orderId],
  )
  return Number(result.rows[0]?.commission_total || 0)
}

const mapOrder = (row) => ({
  id: row.id,
  orderNumber: row.order_number,
  userId: row.user_id,
  packageName: row.package_name,
  packageSlug: row.package_slug,
  listedPrice: Number(row.listed_price),
  discountAmount: Number(row.discount_amount),
  grossAmount: Number(row.gross_amount),
  netAmount: Number(row.net_amount),
  gstRate: Number(row.gst_rate),
  gstAmount: Number(row.gst_amount),
  promoCode: row.promo_code,
  couponCode: row.coupon_code,
  status: row.status,
  source: row.source,
  payment: {
    status: row.payment_status,
    provider: row.payment_provider,
    method: row.payment_method,
    reference: row.payment_reference,
    orderId: row.payment_order_id,
    paidAt: row.paid_at,
  },
  buyer: {
    name: row.buyer_name,
    email: row.buyer_email,
    phone: row.buyer_phone,
    country: row.buyer_country,
    state: row.buyer_state,
    hasGst: row.has_gst,
    gstNumber: row.gst_number,
  },
  sponsorId: row.sponsor_id,
  commissionTotal: Number(row.commission_total),
  notes: row.notes,
  createdBy: row.created_by,
  refundedAt: row.refunded_at,
  refundAmount: toNumber(row.refund_amount),
  refundReason: row.refund_reason,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
})

module.exports = {
  GST_RATE,
  ORDER_STATUSES,
  ORDER_SOURCES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  ORDER_COLUMNS,
  ORDER_FIELDS,
  ORDER_RETURNING,
  roundMoney,
  buildAmounts,
  createOrder,
  syncCommissionTotal,
  mapOrder,
  loadBuyer,
}
