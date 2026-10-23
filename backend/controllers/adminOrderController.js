const { query } = require('../config/db')
const { PACKAGE_NAMES, canPurchasePackage, resolvePackage } = require('../data/commissions')
const { creditUplineCommissions } = require('../services/affiliateCommission')
const {
  ORDER_FIELDS,
  ORDER_RETURNING,
  ORDER_STATUSES,
  ORDER_SOURCES,
  PAYMENT_STATUSES,
  PAYMENT_METHODS,
  GST_RATE,
  createOrder,
  syncCommissionTotal,
  mapOrder,
  loadBuyer,
  OFFLINE_PROVIDER,
} = require('../services/orders')

const MAX_PAGE_SIZE = 100

const trimmed = (value) => String(value ?? '').trim()

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed(value))

const buildFilters = (reqQuery) => {
  const params = []
  const clauses = []

  const push = (sql, value) => {
    params.push(value)
    clauses.push(sql.replace('$#', `$${params.length}`))
  }

  const status = trimmed(reqQuery.status).toLowerCase()
  if (status && status !== 'all' && ORDER_STATUSES.includes(status)) {
    push('o.status = $#', status)
  }

  const paymentStatus = trimmed(reqQuery.paymentStatus).toLowerCase()
  if (paymentStatus && paymentStatus !== 'all' && PAYMENT_STATUSES.includes(paymentStatus)) {
    push('o.payment_status = $#', paymentStatus)
  }

  const source = trimmed(reqQuery.source).toLowerCase()
  if (source && source !== 'all' && ORDER_SOURCES.includes(source)) {
    push('o.source = $#', source)
  }

  const pkg = resolvePackage(reqQuery.packageName)
  if (pkg) {
    push('o.package_name = $#', pkg.name)
  }

  if (isUuid(reqQuery.userId)) {
    push('o.user_id = $#', trimmed(reqQuery.userId))
  }

  const from = trimmed(reqQuery.from)
  if (from) {
    push(`(o.created_at AT TIME ZONE 'Asia/Kolkata')::date >= $#::date`, from)
  }

  const to = trimmed(reqQuery.to)
  if (to) {
    push(`(o.created_at AT TIME ZONE 'Asia/Kolkata')::date <= $#::date`, to)
  }

  const search = trimmed(reqQuery.search)
  if (search) {
    params.push(`%${search.toLowerCase()}%`)
    const token = `$${params.length}`
    clauses.push(`(
      LOWER(o.order_number) LIKE ${token}
      OR LOWER(COALESCE(o.buyer_name, '')) LIKE ${token}
      OR LOWER(COALESCE(o.buyer_email, '')) LIKE ${token}
      OR LOWER(COALESCE(o.buyer_phone, '')) LIKE ${token}
      OR LOWER(COALESCE(o.payment_reference, '')) LIKE ${token}
    )`)
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  }
}

const SORTS = {
  newest: 'o.created_at DESC',
  oldest: 'o.created_at ASC',
  highest: 'o.gross_amount DESC, o.created_at DESC',
  lowest: 'o.gross_amount ASC, o.created_at DESC',
}

const listOrders = async (req, res) => {
  try {
    const { where, params } = buildFilters(req.query)
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(5, Number(req.query.pageSize) || 20))
    const orderBy = SORTS[trimmed(req.query.sort)] || SORTS.newest

    const totals = await query(
      `SELECT
         COUNT(*)::int AS count,
         COALESCE(SUM(o.gross_amount), 0) AS gross,
         COALESCE(SUM(o.net_amount), 0) AS net,
         COALESCE(SUM(o.gst_amount), 0) AS gst,
         COALESCE(SUM(o.commission_total), 0) AS commission
       FROM orders o
       ${where}`,
      params,
    )

    const rows = await query(
      `SELECT ${ORDER_FIELDS}, s.full_name AS sponsor_name, s.referral_code AS sponsor_code
       FROM orders o
       LEFT JOIN users s ON s.id = o.sponsor_id
       ${where}
       ORDER BY ${orderBy}
       LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      params,
    )

    const summary = totals.rows[0]
    return res.json({
      orders: rows.rows.map((row) => ({
        ...mapOrder(row),
        sponsorName: row.sponsor_name || null,
        sponsorCode: row.sponsor_code || null,
      })),
      page,
      pageSize,
      total: summary.count,
      totalPages: Math.max(1, Math.ceil(summary.count / pageSize)),
      totals: {
        orders: summary.count,
        gross: Number(summary.gross),
        net: Number(summary.net),
        gst: Number(summary.gst),
        commission: Number(summary.commission),
      },
    })
  } catch (error) {
    console.error('List orders error:', error.message)
    return res.status(500).json({ message: 'Could not load orders' })
  }
}

const getOrderStats = async (_req, res) => {
  try {
    const overall = await query(
      `SELECT
         COUNT(*)::int AS orders,
         COUNT(*) FILTER (WHERE status = 'paid')::int AS paid_orders,
         COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_orders,
         COUNT(*) FILTER (WHERE payment_status = 'captured')::int AS captured_orders,
         COALESCE(SUM(gross_amount), 0) AS gross,
         COALESCE(SUM(net_amount), 0) AS net,
         COALESCE(SUM(gst_amount), 0) AS gst,
         COALESCE(SUM(commission_total), 0) AS commission,
         COALESCE(SUM(gross_amount) FILTER (
           WHERE (created_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
         ), 0) AS gross_today,
         COUNT(*) FILTER (
           WHERE (created_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
         )::int AS orders_today,
         COALESCE(SUM(gross_amount) FILTER (
           WHERE created_at >= NOW() - INTERVAL '30 days'
         ), 0) AS gross_30d,
         COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS orders_30d
       FROM orders`,
    )

    const byPackage = await query(
      `SELECT package_name,
              COUNT(*)::int AS orders,
              COALESCE(SUM(gross_amount), 0) AS gross
       FROM orders
       GROUP BY package_name`,
    )

    const row = overall.rows[0]
    const packageMap = new Map(byPackage.rows.map((item) => [item.package_name, item]))

    return res.json({
      totals: {
        orders: row.orders,
        paidOrders: row.paid_orders,
        pendingOrders: row.pending_orders,
        capturedOrders: row.captured_orders,
        gross: Number(row.gross),
        net: Number(row.net),
        gst: Number(row.gst),
        commission: Number(row.commission),
        grossToday: Number(row.gross_today),
        ordersToday: row.orders_today,
        gross30d: Number(row.gross_30d),
        orders30d: row.orders_30d,
      },
      packages: PACKAGE_NAMES.map((name) => ({
        name,
        orders: packageMap.get(name)?.orders || 0,
        gross: Number(packageMap.get(name)?.gross || 0),
      })),
    })
  } catch (error) {
    console.error('Order stats error:', error.message)
    return res.status(500).json({ message: 'Could not load order stats' })
  }
}

const getOrder = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) return res.status(404).json({ message: 'Order not found' })

    const result = await query(
      `SELECT ${ORDER_FIELDS},
              s.full_name AS sponsor_name, s.email AS sponsor_email,
              s.phone AS sponsor_phone, s.referral_code AS sponsor_code,
              a.full_name AS created_by_name,
              u.knowledge_package AS current_package,
              u.referral_code AS buyer_referral_code
       FROM orders o
       LEFT JOIN users s ON s.id = o.sponsor_id
       LEFT JOIN users a ON a.id = o.created_by
       LEFT JOIN users u ON u.id = o.user_id
       WHERE o.id = $1`,
      [req.params.id],
    )

    const row = result.rows[0]
    if (!row) return res.status(404).json({ message: 'Order not found' })

    const commissions = await query(
      `SELECT e.id, e.user_id, e.amount, e.income_type, e.commission_percent, e.net_amount,
              e.status, e.earned_at, e.reversed_at,
              u.full_name AS earner_name, u.email AS earner_email, u.referral_code AS earner_code
       FROM affiliate_earnings e
       LEFT JOIN users u ON u.id = e.user_id
       WHERE e.order_id = $1
       ORDER BY CASE e.income_type WHEN 'active' THEN 1 WHEN 'passive' THEN 2 ELSE 3 END`,
      [req.params.id],
    )

    const history = await query(
      `SELECT ${ORDER_FIELDS}
       FROM orders o
       WHERE o.user_id = $1 AND o.id <> $2::uuid
       ORDER BY o.created_at DESC
       LIMIT 10`,
      [row.user_id, row.id],
    )

    return res.json({
      order: {
        ...mapOrder(row),
        sponsor: row.sponsor_id
          ? {
              id: row.sponsor_id,
              name: row.sponsor_name,
              email: row.sponsor_email,
              phone: row.sponsor_phone,
              referralCode: row.sponsor_code,
            }
          : null,
        createdByName: row.created_by_name || null,
        buyerCurrentPackage: row.current_package || null,
        buyerReferralCode: row.buyer_referral_code || null,
      },
      commissions: commissions.rows.map((item) => ({
        id: item.id,
        amount: Number(item.amount),
        incomeType: item.income_type,
        commissionPercent: item.commission_percent != null ? Number(item.commission_percent) : null,
        netAmount: item.net_amount != null ? Number(item.net_amount) : null,
        status: item.status,
        earnedAt: item.earned_at,
        reversedAt: item.reversed_at,
        earnerId: item.user_id,
        earnerName: item.earner_name,
        earnerEmail: item.earner_email,
        earnerCode: item.earner_code,
      })),
      history: history.rows.map(mapOrder),
    })
  } catch (error) {
    console.error('Get order error:', error.message)
    return res.status(500).json({ message: 'Could not load the order' })
  }
}

const getOrderMeta = async (_req, res) => {
  try {
    return res.json({
      packages: PACKAGE_NAMES.map((name) => {
        const pkg = resolvePackage(name)
        return { name, slug: pkg.id, listedPrice: pkg.listedPrice, netAmount: pkg.netAmount }
      }),
      statuses: ORDER_STATUSES,
      paymentStatuses: PAYMENT_STATUSES,
      paymentMethods: PAYMENT_METHODS,
      sources: ORDER_SOURCES,
      gstRate: GST_RATE,
    })
  } catch (error) {
    console.error('Order meta error:', error.message)
    return res.status(500).json({ message: 'Could not load order options' })
  }
}

const startSubscription = async (order) => {
  if (!order?.user_id || !order.package_name) return false
  const buyer = await loadBuyer(order.user_id)
  if (!buyer) return false
  const check = canPurchasePackage(buyer.knowledge_package, order.package_name)
  if (!check.ok) return false
  await query(`UPDATE users SET knowledge_package = $1 WHERE id = $2`, [check.package.name, buyer.id])
  return true
}

const mapOrderRequest = (row) => ({
  ...mapOrder(row),
  buyerPinCode: row.pin_code || null,
  buyerManagerName: row.manager_name || null,
  buyerManagerPhone: row.manager_phone || null,
  buyerReferralCode: row.buyer_referral_code || null,
  buyerCurrentPackage: row.current_package || null,
  sponsorName: row.sponsor_name || null,
  sponsorPhone: row.sponsor_phone || null,
  sponsorCode: row.sponsor_code || null,
})

const findBuyer = async (identifier) => {
  const value = trimmed(identifier)
  if (!value) return null
  if (isUuid(value)) return loadBuyer(value)

  const result = await query(
    `SELECT id FROM users WHERE LOWER(email) = $1 OR referral_code = $2 OR phone = $2 LIMIT 1`,
    [value.toLowerCase(), value],
  )
  return result.rows[0] ? loadBuyer(result.rows[0].id) : null
}

const findSponsorByReferralCode = async (rawCode) => {
  const referralCode = trimmed(rawCode)
  if (!referralCode) return null
  const result = await query(
    `SELECT id, full_name, email, referral_code, knowledge_package
     FROM users
     WHERE referral_code = $1
     LIMIT 1`,
    [referralCode],
  )
  return result.rows[0] || null
}

const createManualOrder = async (req, res) => {
  try {
    const buyer = await findBuyer(req.body.buyer || req.body.email || req.body.userId)
    if (!buyer) {
      return res.status(404).json({ message: 'No user found for that email, phone, or referral code' })
    }

    const pkg = resolvePackage(req.body.packageName)
    if (!pkg) {
      return res.status(400).json({ message: 'Choose Social Expert, Ads Expert, or AI Premium Expert' })
    }

    const grantAccess = req.body.grantAccess !== false
    if (grantAccess) {
      const check = canPurchasePackage(buyer.knowledge_package, pkg.name)
      if (!check.ok) {
        return res.status(400).json({ message: `${buyer.full_name}: ${check.message}` })
      }
    }

    const paymentMethod = trimmed(req.body.paymentMethod).toLowerCase() || null
    if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: 'Choose a valid payment method' })
    }

    const incomingReferral = trimmed(req.body.referralCode || req.body.sponsorCode)
    let assignedSponsorId = null
    if (incomingReferral && !buyer.referred_by) {
      const sponsor = await findSponsorByReferralCode(incomingReferral)
      if (!sponsor) {
        return res.status(400).json({ message: 'Referral code is invalid' })
      }
      if (sponsor.id === buyer.id) {
        return res.status(400).json({ message: 'Buyer cannot be their own referrer' })
      }

      // Attach so future upgrades also pay this affiliate. Existing referrers stay.
      await query(
        `UPDATE users
         SET referred_by = $1,
             referral_source = COALESCE(referral_source, 'joining')
         WHERE id = $2 AND referred_by IS NULL`,
        [sponsor.id, buyer.id],
      )
      buyer.referred_by = sponsor.id
      assignedSponsorId = sponsor.id
    }

    const paymentReference = trimmed(req.body.paymentReference) || null
    const markPaid = req.body.markPaid !== false
    const discountAmount = Number(req.body.discountAmount) || 0
    if (discountAmount < 0 || discountAmount > pkg.listedPrice) {
      return res.status(400).json({ message: 'Discount must be between 0 and the package price' })
    }

    const order = await createOrder({
      userId: buyer.id,
      buyer,
      packageName: pkg.name,
      source: 'manual',
      status: markPaid ? 'paid' : 'pending',
      paymentStatus: markPaid ? 'captured' : 'pending',
      paymentProvider: 'manual',
      paymentMethod,
      paymentReference,
      paidAt: markPaid ? new Date() : null,
      discountAmount,
      promoCode: trimmed(req.body.promoCode).toUpperCase() || null,
      couponCode: trimmed(req.body.couponCode).toUpperCase() || null,
      gstNumber: trimmed(req.body.gstNumber) || null,
      notes: trimmed(req.body.notes) || null,
      createdBy: req.user.id,
      sponsorId: assignedSponsorId || buyer.referred_by || null,
    })

    if (!order) return res.status(500).json({ message: 'Could not record the order' })

    if (grantAccess) {
      await query(`UPDATE users SET knowledge_package = $1 WHERE id = $2`, [pkg.name, buyer.id])
    }

    const payCommissions = req.body.payCommissions !== false && markPaid
    if (payCommissions) {
      await creditUplineCommissions({
        buyerId: buyer.id,
        packageName: pkg.name,
        country: buyer.country,
        orderId: order.id,
        sponsorId: assignedSponsorId || null,
      })
      order.commission_total = await syncCommissionTotal(order.id)
    }

    return res.status(201).json({ order: mapOrder(order) })
  } catch (error) {
    console.error('Manual order error:', error.message)
    return res.status(500).json({ message: 'Could not record the order' })
  }
}

const recordPayment = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) return res.status(404).json({ message: 'Order not found' })

    const existing = await query(`SELECT ${ORDER_FIELDS} FROM orders o WHERE o.id = $1`, [req.params.id])
    const current = existing.rows[0]
    if (!current) return res.status(404).json({ message: 'Order not found' })

    const paymentStatus = trimmed(req.body.paymentStatus).toLowerCase() || 'captured'
    if (!PAYMENT_STATUSES.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Choose a valid payment status' })
    }

    const paymentMethod = trimmed(req.body.paymentMethod).toLowerCase() || null
    if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({ message: 'Choose a valid payment method' })
    }

    const captured = paymentStatus === 'captured'
    const updated = await query(
      `UPDATE orders
       SET payment_status = $1,
           payment_method = COALESCE($2, payment_method),
           payment_reference = COALESCE($3, payment_reference),
           payment_provider = COALESCE($4, payment_provider),
           paid_at = CASE WHEN $5::boolean THEN COALESCE(paid_at, NOW()) ELSE NULL END,
           status = CASE WHEN $5::boolean THEN 'paid' WHEN $1 = 'failed' THEN 'failed' ELSE status END,
           notes = COALESCE($6, notes),
           updated_at = NOW()
       WHERE id = $7
       RETURNING ${ORDER_RETURNING}`,
      [
        paymentStatus,
        paymentMethod,
        trimmed(req.body.paymentReference) || null,
        trimmed(req.body.paymentProvider) || 'manual',
        captured,
        trimmed(req.body.notes) || null,
        req.params.id,
      ],
    )

    const order = updated.rows[0]

    if (captured) {
      await startSubscription(order)
    }

    // A pending order pays no commission until the money lands.
    if (captured && Number(order.commission_total) === 0 && order.user_id) {
      await creditUplineCommissions({
        buyerId: order.user_id,
        packageName: order.package_name,
        country: order.buyer_country,
        orderId: order.id,
      })
      order.commission_total = await syncCommissionTotal(order.id)
    }

    return res.json({ order: mapOrder(order) })
  } catch (error) {
    console.error('Record payment error:', error.message)
    return res.status(500).json({ message: 'Could not update the payment' })
  }
}

const updateOrder = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) return res.status(404).json({ message: 'Order not found' })

    const status = trimmed(req.body.status).toLowerCase()
    if (status && !ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Choose a valid order status' })
    }

    const notes = req.body.notes === undefined ? null : trimmed(req.body.notes)
    const updated = await query(
      `UPDATE orders
       SET status = COALESCE($1, status),
           gst_number = COALESCE($2, gst_number),
           notes = COALESCE($3, notes),
           updated_at = NOW()
       WHERE id = $4
       RETURNING ${ORDER_RETURNING}`,
      [status || null, trimmed(req.body.gstNumber) || null, notes, req.params.id],
    )

    if (!updated.rows[0]) return res.status(404).json({ message: 'Order not found' })
    return res.json({ order: mapOrder(updated.rows[0]) })
  } catch (error) {
    console.error('Update order error:', error.message)
    return res.status(500).json({ message: 'Could not update the order' })
  }
}

const getOrderRequestStats = async (_req, res) => {
  try {
    const result = await query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
         COUNT(*) FILTER (WHERE status = 'paid')::int AS approved,
         COUNT(*) FILTER (WHERE status = 'cancelled')::int AS cancelled
       FROM orders
       WHERE payment_provider = $1`,
      [OFFLINE_PROVIDER],
    )
    const row = result.rows[0]
    return res.json({
      pending: row.pending,
      approved: row.approved,
      cancelled: row.cancelled,
    })
  } catch (error) {
    console.error('Order request stats error:', error.message)
    return res.status(500).json({ message: 'Could not load order requests' })
  }
}

const listOrderRequests = async (req, res) => {
  try {
    const params = [OFFLINE_PROVIDER]
    const clauses = ['o.payment_provider = $1']

    const status = trimmed(req.query.status).toLowerCase()
    if (status && status !== 'all' && ORDER_STATUSES.includes(status)) {
      params.push(status)
      clauses.push(`o.status = $${params.length}`)
    }

    const search = trimmed(req.query.search)
    if (search) {
      params.push(`%${search.toLowerCase()}%`)
      const token = `$${params.length}`
      clauses.push(`(
        LOWER(o.order_number) LIKE ${token}
        OR LOWER(COALESCE(o.buyer_name, '')) LIKE ${token}
        OR LOWER(COALESCE(o.buyer_email, '')) LIKE ${token}
        OR LOWER(COALESCE(o.buyer_phone, '')) LIKE ${token}
        OR LOWER(COALESCE(u.referral_code, '')) LIKE ${token}
      )`)
    }

    const where = `WHERE ${clauses.join(' AND ')}`
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(5, Number(req.query.pageSize) || 20))

    const totals = await query(
      `SELECT COUNT(*)::int AS count
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       ${where}`,
      params,
    )

    const rows = await query(
      `SELECT ${ORDER_FIELDS},
              u.pin_code, u.manager_name, u.manager_phone,
              u.referral_code AS buyer_referral_code,
              u.knowledge_package AS current_package,
              s.full_name AS sponsor_name, s.phone AS sponsor_phone, s.referral_code AS sponsor_code
       FROM orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN users s ON s.id = o.sponsor_id
       ${where}
       ORDER BY o.created_at DESC
       LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      params,
    )

    const count = totals.rows[0].count
    return res.json({
      orders: rows.rows.map(mapOrderRequest),
      page,
      pageSize,
      total: count,
      totalPages: Math.max(1, Math.ceil(count / pageSize)),
    })
  } catch (error) {
    console.error('List order requests error:', error.message)
    return res.status(500).json({ message: 'Could not load order requests' })
  }
}

const approveOrderRequest = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) return res.status(404).json({ message: 'Order not found' })

    const paymentMethod = trimmed(req.body.paymentMethod).toLowerCase()
    if (!['cash', 'upi'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Choose cash or UPI' })
    }

    const existing = await query(`SELECT ${ORDER_FIELDS} FROM orders o WHERE o.id = $1`, [req.params.id])
    const current = existing.rows[0]
    if (!current) return res.status(404).json({ message: 'Order not found' })
    if (current.payment_provider !== OFFLINE_PROVIDER || current.status !== 'pending') {
      return res.status(400).json({ message: 'This order is not waiting for approval' })
    }

    const buyer = current.user_id ? await loadBuyer(current.user_id) : null
    if (!buyer) return res.status(400).json({ message: 'The buyer account no longer exists' })

    const check = canPurchasePackage(buyer.knowledge_package, current.package_name)
    if (!check.ok) return res.status(400).json({ message: check.message })

    const paymentReference = trimmed(req.body.paymentReference) || null
    const extraNote = trimmed(req.body.notes)
    const notes = [current.notes, extraNote].filter(Boolean).join('\n') || null

    const updated = await query(
      `UPDATE orders
       SET status = 'paid',
           payment_status = 'captured',
           payment_method = $1,
           payment_reference = $2,
           paid_at = NOW(),
           notes = $3,
           updated_at = NOW()
       WHERE id = $4
         AND status = 'pending'
         AND payment_provider = $5
       RETURNING ${ORDER_RETURNING}`,
      [paymentMethod, paymentReference, notes, req.params.id, OFFLINE_PROVIDER],
    )

    const order = updated.rows[0]
    if (!order) return res.status(409).json({ message: 'This order was already handled' })

    try {
      await query(`UPDATE users SET knowledge_package = $1 WHERE id = $2`, [check.package.name, buyer.id])
    } catch (error) {
      await query(
        `UPDATE orders
         SET status = 'pending',
             payment_status = 'pending',
             payment_method = NULL,
             payment_reference = NULL,
             paid_at = NULL,
             notes = $2,
             updated_at = NOW()
         WHERE id = $1`,
        [order.id, current.notes],
      )
      throw error
    }

    try {
      await creditUplineCommissions({
        buyerId: buyer.id,
        packageName: order.package_name,
        country: order.buyer_country || buyer.country,
        orderId: order.id,
      })
      order.commission_total = await syncCommissionTotal(order.id)
    } catch (error) {
      console.error('Commission credit failed after approval:', error.message)
    }

    return res.json({ order: mapOrder(order), subscriptionStarted: true })
  } catch (error) {
    console.error('Approve order request error:', error.message)
    return res.status(500).json({ message: 'Could not approve the order' })
  }
}

const rejectOrderRequest = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) return res.status(404).json({ message: 'Order not found' })

    const existing = await query(`SELECT id, status, payment_provider, notes FROM orders WHERE id = $1`, [req.params.id])
    const current = existing.rows[0]
    if (!current) return res.status(404).json({ message: 'Order not found' })
    if (current.payment_provider !== OFFLINE_PROVIDER || current.status !== 'pending') {
      return res.status(400).json({ message: 'This order is not waiting for approval' })
    }

    const reason = trimmed(req.body.reason || req.body.notes)
    const notes = [current.notes, reason ? `Rejected: ${reason}` : 'Rejected by admin'].filter(Boolean).join('\n')

    const updated = await query(
      `UPDATE orders
       SET status = 'cancelled',
           payment_status = 'failed',
           notes = $2,
           updated_at = NOW()
       WHERE id = $1
         AND status = 'pending'
         AND payment_provider = $3
       RETURNING ${ORDER_RETURNING}`,
      [req.params.id, notes, OFFLINE_PROVIDER],
    )

    if (!updated.rows[0]) return res.status(409).json({ message: 'This order was already handled' })
    return res.json({ order: mapOrder(updated.rows[0]) })
  } catch (error) {
    console.error('Reject order request error:', error.message)
    return res.status(500).json({ message: 'Could not reject the order' })
  }
}

module.exports = {
  listOrders,
  getOrder,
  getOrderMeta,
  getOrderStats,
  createManualOrder,
  recordPayment,
  updateOrder,
  listOrderRequests,
  getOrderRequestStats,
  approveOrderRequest,
  rejectOrderRequest,
}
