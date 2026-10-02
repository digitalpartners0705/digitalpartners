const { query } = require('../config/db')
const { INCOME_LEVELS, PACKAGE_NAMES, resolvePackage } = require('../data/commissions')
const { syncCommissionTotal } = require('../services/orders')

const MAX_PAGE_SIZE = 100

const INCOME_TYPES = [...INCOME_LEVELS.map((item) => item.incomeType), 'adjustment']
const ENTRY_STATUSES = ['credited', 'reversed']
const ENTRY_SOURCES = ['sale', 'adjustment']

const trimmed = (value) => String(value ?? '').trim()

const isUuid = (value) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed(value))

const roundMoney = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100

const findUser = async (identifier) => {
  const value = trimmed(identifier)
  if (!value) return null
  if (isUuid(value)) {
    const byId = await query(
      `SELECT id, full_name, email, phone, referral_code, knowledge_package, country, state, created_at
       FROM users WHERE id = $1 LIMIT 1`,
      [value],
    )
    return byId.rows[0] || null
  }

  const result = await query(
    `SELECT id, full_name, email, phone, referral_code, knowledge_package, country, state, created_at
     FROM users
     WHERE LOWER(email) = $1 OR referral_code = $2 OR phone = $2
     LIMIT 1`,
    [value.toLowerCase(), value],
  )
  return result.rows[0] || null
}

const mapEarning = (row) => ({
  id: row.id,
  amount: Number(row.amount),
  packageName: row.package_name,
  incomeType: row.income_type,
  commissionPercent: row.commission_percent != null ? Number(row.commission_percent) : null,
  netAmount: row.net_amount != null ? Number(row.net_amount) : null,
  country: row.country,
  status: row.status || 'credited',
  source: row.source || 'sale',
  notes: row.notes || null,
  reverseReason: row.reverse_reason || null,
  earnedAt: row.earned_at,
  reversedAt: row.reversed_at,
  orderId: row.order_id || null,
  orderNumber: row.order_number || null,
  earner: {
    id: row.user_id,
    name: row.earner_name || null,
    email: row.earner_email || null,
    phone: row.earner_phone || null,
    referralCode: row.earner_code || null,
  },
  buyer: row.buyer_id
    ? {
        id: row.buyer_id,
        name: row.buyer_name || null,
        email: row.buyer_email || null,
        phone: row.buyer_phone || null,
        referralCode: row.buyer_code || null,
      }
    : null,
  createdBy: row.created_by
    ? {
        id: row.created_by,
        name: row.created_by_name || null,
      }
    : null,
})

const buildFilters = (reqQuery) => {
  const params = []
  const clauses = []

  const push = (sql, value) => {
    params.push(value)
    clauses.push(sql.replace('$#', `$${params.length}`))
  }

  const status = trimmed(reqQuery.status).toLowerCase()
  if (status && status !== 'all' && ENTRY_STATUSES.includes(status)) {
    push('e.status = $#', status)
  }

  const incomeType = trimmed(reqQuery.incomeType).toLowerCase()
  if (incomeType && incomeType !== 'all' && INCOME_TYPES.includes(incomeType)) {
    push('e.income_type = $#', incomeType)
  }

  const source = trimmed(reqQuery.source).toLowerCase()
  if (source && source !== 'all' && ENTRY_SOURCES.includes(source)) {
    push('e.source = $#', source)
  }

  const pkg = resolvePackage(reqQuery.packageName)
  if (pkg) {
    push('e.package_name = $#', pkg.name)
  }

  if (isUuid(reqQuery.earnerId)) {
    push('e.user_id = $#', trimmed(reqQuery.earnerId))
  }

  if (isUuid(reqQuery.buyerId)) {
    push('e.buyer_id = $#', trimmed(reqQuery.buyerId))
  }

  if (isUuid(reqQuery.orderId)) {
    push('e.order_id = $#', trimmed(reqQuery.orderId))
  }

  const from = trimmed(reqQuery.from)
  if (from) {
    push(`(e.earned_at AT TIME ZONE 'Asia/Kolkata')::date >= $#::date`, from)
  }

  const to = trimmed(reqQuery.to)
  if (to) {
    push(`(e.earned_at AT TIME ZONE 'Asia/Kolkata')::date <= $#::date`, to)
  }

  const search = trimmed(reqQuery.search)
  if (search) {
    params.push(`%${search.toLowerCase()}%`)
    const token = `$${params.length}`
    clauses.push(`(
      LOWER(COALESCE(earner.full_name, '')) LIKE ${token}
      OR LOWER(COALESCE(earner.email, '')) LIKE ${token}
      OR LOWER(COALESCE(earner.referral_code, '')) LIKE ${token}
      OR LOWER(COALESCE(buyer.full_name, '')) LIKE ${token}
      OR LOWER(COALESCE(buyer.email, '')) LIKE ${token}
      OR LOWER(COALESCE(buyer.referral_code, '')) LIKE ${token}
      OR LOWER(COALESCE(o.order_number, '')) LIKE ${token}
      OR LOWER(COALESCE(e.notes, '')) LIKE ${token}
    )`)
  }

  return {
    where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    params,
  }
}

const SORTS = {
  newest: 'e.earned_at DESC',
  oldest: 'e.earned_at ASC',
  highest: 'e.amount DESC, e.earned_at DESC',
  lowest: 'e.amount ASC, e.earned_at DESC',
}

const JOIN_SQL = `
  FROM affiliate_earnings e
  LEFT JOIN users earner ON earner.id = e.user_id
  LEFT JOIN users buyer ON buyer.id = e.buyer_id
  LEFT JOIN users admin ON admin.id = e.created_by
  LEFT JOIN orders o ON o.id = e.order_id
`

const SELECT_SQL = `
  e.id, e.user_id, e.buyer_id, e.amount, e.package_name, e.income_type,
  e.commission_percent, e.net_amount, e.country, e.earned_at,
  e.order_id, e.status, e.reversed_at, e.notes, e.source, e.created_by, e.reverse_reason,
  earner.full_name AS earner_name, earner.email AS earner_email,
  earner.phone AS earner_phone, earner.referral_code AS earner_code,
  buyer.full_name AS buyer_name, buyer.email AS buyer_email,
  buyer.phone AS buyer_phone, buyer.referral_code AS buyer_code,
  admin.full_name AS created_by_name,
  o.order_number
`

const listCommissions = async (req, res) => {
  try {
    const { where, params } = buildFilters(req.query)
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(5, Number(req.query.pageSize) || 25))
    const orderBy = SORTS[trimmed(req.query.sort)] || SORTS.newest

    const totals = await query(
      `SELECT
         COUNT(*)::int AS count,
         COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'credited'), 0) AS credited,
         COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'reversed'), 0) AS reversed,
         COUNT(*) FILTER (WHERE e.status = 'credited')::int AS credited_count,
         COUNT(*) FILTER (WHERE e.status = 'reversed')::int AS reversed_count,
         COUNT(*) FILTER (WHERE e.source = 'adjustment')::int AS adjustment_count
       ${JOIN_SQL}
       ${where}`,
      params,
    )

    const rows = await query(
      `SELECT ${SELECT_SQL}
       ${JOIN_SQL}
       ${where}
       ORDER BY ${orderBy}
       LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      params,
    )

    const summary = totals.rows[0]
    return res.json({
      commissions: rows.rows.map(mapEarning),
      page,
      pageSize,
      total: summary.count,
      totalPages: Math.max(1, Math.ceil(summary.count / pageSize)),
      totals: {
        entries: summary.count,
        credited: Number(summary.credited),
        reversed: Number(summary.reversed),
        creditedCount: summary.credited_count,
        reversedCount: summary.reversed_count,
        adjustmentCount: summary.adjustment_count,
      },
    })
  } catch (error) {
    console.error('List commissions error:', error.message)
    return res.status(500).json({ message: 'Could not load commissions' })
  }
}

const getCommissionStats = async (_req, res) => {
  try {
    const overall = await query(
      `SELECT
         COUNT(*)::int AS entries,
         COUNT(*) FILTER (WHERE status = 'credited')::int AS credited_count,
         COUNT(*) FILTER (WHERE status = 'reversed')::int AS reversed_count,
         COUNT(*) FILTER (WHERE source = 'adjustment')::int AS adjustment_count,
         COALESCE(SUM(amount) FILTER (WHERE status = 'credited'), 0) AS credited,
         COALESCE(SUM(amount) FILTER (WHERE status = 'reversed'), 0) AS reversed,
         COALESCE(SUM(amount) FILTER (
           WHERE status = 'credited'
             AND (earned_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
         ), 0) AS credited_today,
         COUNT(*) FILTER (
           WHERE (earned_at AT TIME ZONE 'Asia/Kolkata')::date = (NOW() AT TIME ZONE 'Asia/Kolkata')::date
         )::int AS entries_today,
         COALESCE(SUM(amount) FILTER (
           WHERE status = 'credited' AND earned_at >= NOW() - INTERVAL '30 days'
         ), 0) AS credited_30d
       FROM affiliate_earnings`,
    )

    const byIncome = await query(
      `SELECT income_type,
              COUNT(*) FILTER (WHERE status = 'credited')::int AS entries,
              COALESCE(SUM(amount) FILTER (WHERE status = 'credited'), 0) AS amount
       FROM affiliate_earnings
       GROUP BY income_type`,
    )

    const byPackage = await query(
      `SELECT package_name,
              COUNT(*) FILTER (WHERE status = 'credited')::int AS entries,
              COALESCE(SUM(amount) FILTER (WHERE status = 'credited'), 0) AS amount
       FROM affiliate_earnings
       WHERE package_name IS NOT NULL
       GROUP BY package_name`,
    )

    const topEarners = await query(
      `SELECT e.user_id, u.full_name, u.email, u.referral_code,
              COUNT(*) FILTER (WHERE e.status = 'credited')::int AS entries,
              COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'credited'), 0) AS amount
       FROM affiliate_earnings e
       JOIN users u ON u.id = e.user_id
       GROUP BY e.user_id, u.full_name, u.email, u.referral_code
       HAVING COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'credited'), 0) <> 0
       ORDER BY amount DESC
       LIMIT 8`,
    )

    const row = overall.rows[0]
    const incomeMap = new Map(byIncome.rows.map((item) => [item.income_type, item]))
    const packageMap = new Map(byPackage.rows.map((item) => [item.package_name, item]))

    return res.json({
      totals: {
        entries: row.entries,
        creditedCount: row.credited_count,
        reversedCount: row.reversed_count,
        adjustmentCount: row.adjustment_count,
        credited: Number(row.credited),
        reversed: Number(row.reversed),
        creditedToday: Number(row.credited_today),
        entriesToday: row.entries_today,
        credited30d: Number(row.credited_30d),
      },
      byIncomeType: INCOME_TYPES.map((type) => ({
        incomeType: type,
        entries: incomeMap.get(type)?.entries || 0,
        amount: Number(incomeMap.get(type)?.amount || 0),
      })),
      packages: PACKAGE_NAMES.map((name) => ({
        name,
        entries: packageMap.get(name)?.entries || 0,
        amount: Number(packageMap.get(name)?.amount || 0),
      })),
      topEarners: topEarners.rows.map((item) => ({
        id: item.user_id,
        name: item.full_name,
        email: item.email,
        referralCode: item.referral_code,
        entries: item.entries,
        amount: Number(item.amount),
      })),
    })
  } catch (error) {
    console.error('Commission stats error:', error.message)
    return res.status(500).json({ message: 'Could not load commission stats' })
  }
}

const getCommissionMeta = async (_req, res) => {
  try {
    return res.json({
      packages: PACKAGE_NAMES,
      incomeTypes: INCOME_TYPES,
      statuses: ENTRY_STATUSES,
      sources: ENTRY_SOURCES,
      incomeLabels: Object.fromEntries(
        INCOME_LEVELS.map((item) => [item.incomeType, item.label]).concat([['adjustment', 'Adjustment']]),
      ),
    })
  } catch (error) {
    console.error('Commission meta error:', error.message)
    return res.status(500).json({ message: 'Could not load commission options' })
  }
}

const getCommission = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) return res.status(404).json({ message: 'Commission entry not found' })

    const result = await query(
      `SELECT ${SELECT_SQL}
       ${JOIN_SQL}
       WHERE e.id = $1`,
      [req.params.id],
    )
    const row = result.rows[0]
    if (!row) return res.status(404).json({ message: 'Commission entry not found' })
    return res.json({ commission: mapEarning(row) })
  } catch (error) {
    console.error('Get commission error:', error.message)
    return res.status(500).json({ message: 'Could not load the commission entry' })
  }
}

const getEarnerCommissions = async (req, res) => {
  try {
    if (!isUuid(req.params.userId)) return res.status(404).json({ message: 'User not found' })

    const earner = await findUser(req.params.userId)
    if (!earner) return res.status(404).json({ message: 'User not found' })

    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(5, Number(req.query.pageSize) || 50))
    const status = trimmed(req.query.status).toLowerCase()

    const params = [earner.id]
    const clauses = ['e.user_id = $1']
    if (status && status !== 'all' && ENTRY_STATUSES.includes(status)) {
      params.push(status)
      clauses.push(`e.status = $${params.length}`)
    }

    const where = `WHERE ${clauses.join(' AND ')}`

    const totals = await query(
      `SELECT
         COUNT(*)::int AS entries,
         COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'credited'), 0) AS credited,
         COALESCE(SUM(e.amount) FILTER (WHERE e.status = 'reversed'), 0) AS reversed,
         COUNT(*) FILTER (WHERE e.status = 'credited')::int AS credited_count,
         COUNT(*) FILTER (WHERE e.status = 'reversed')::int AS reversed_count
       FROM affiliate_earnings e
       WHERE e.user_id = $1`,
      [earner.id],
    )

    const byIncome = await query(
      `SELECT income_type,
              COALESCE(SUM(amount) FILTER (WHERE status = 'credited'), 0) AS amount,
              COUNT(*) FILTER (WHERE status = 'credited')::int AS entries
       FROM affiliate_earnings
       WHERE user_id = $1
       GROUP BY income_type`,
      [earner.id],
    )

    const rows = await query(
      `SELECT ${SELECT_SQL}
       ${JOIN_SQL}
       ${where}
       ORDER BY e.earned_at DESC
       LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}`,
      params,
    )

    const countResult = await query(
      `SELECT COUNT(*)::int AS count FROM affiliate_earnings e ${where}`,
      params,
    )

    const summary = totals.rows[0]
    const incomeMap = new Map(byIncome.rows.map((item) => [item.income_type, item]))

    return res.json({
      earner: {
        id: earner.id,
        name: earner.full_name,
        email: earner.email,
        phone: earner.phone,
        referralCode: earner.referral_code,
        knowledgePackage: earner.knowledge_package,
        country: earner.country,
        state: earner.state,
        createdAt: earner.created_at,
      },
      totals: {
        entries: summary.entries,
        credited: Number(summary.credited),
        reversed: Number(summary.reversed),
        creditedCount: summary.credited_count,
        reversedCount: summary.reversed_count,
      },
      byIncomeType: INCOME_TYPES.map((type) => ({
        incomeType: type,
        entries: incomeMap.get(type)?.entries || 0,
        amount: Number(incomeMap.get(type)?.amount || 0),
      })),
      commissions: rows.rows.map(mapEarning),
      page,
      pageSize,
      total: countResult.rows[0].count,
      totalPages: Math.max(1, Math.ceil(countResult.rows[0].count / pageSize)),
    })
  } catch (error) {
    console.error('Earner commissions error:', error.message)
    return res.status(500).json({ message: 'Could not load this earner\'s history' })
  }
}

const reverseCommission = async (req, res) => {
  try {
    if (!isUuid(req.params.id)) return res.status(404).json({ message: 'Commission entry not found' })

    const reason = trimmed(req.body.reason) || trimmed(req.body.reverseReason)
    if (!reason) {
      return res.status(400).json({ message: 'Enter a reason for reversing this entry' })
    }

    const existing = await query(
      `SELECT id, status, order_id, amount FROM affiliate_earnings WHERE id = $1`,
      [req.params.id],
    )
    const current = existing.rows[0]
    if (!current) return res.status(404).json({ message: 'Commission entry not found' })
    if (current.status === 'reversed') {
      return res.status(400).json({ message: 'This commission entry is already reversed' })
    }

    const updated = await query(
      `UPDATE affiliate_earnings
       SET status = 'reversed',
           reversed_at = NOW(),
           reverse_reason = $1
       WHERE id = $2 AND status = 'credited'
       RETURNING id, status, amount, order_id, reversed_at, reverse_reason`,
      [reason, req.params.id],
    )

    if (!updated.rows[0]) {
      return res.status(400).json({ message: 'This commission entry is already reversed' })
    }

    if (updated.rows[0].order_id) {
      await syncCommissionTotal(updated.rows[0].order_id)
    }

    const detail = await query(
      `SELECT ${SELECT_SQL}
       ${JOIN_SQL}
       WHERE e.id = $1`,
      [req.params.id],
    )

    return res.json({
      commission: mapEarning(detail.rows[0]),
      reversedAmount: Number(updated.rows[0].amount),
    })
  } catch (error) {
    console.error('Reverse commission error:', error.message)
    return res.status(500).json({ message: 'Could not reverse the commission entry' })
  }
}

/**
 * Manual credit/debit for dispute fixes. Debits are stored as negative amounts so
 * affiliate wallet totals remain a plain sum of credited rows.
 */
const createAdjustment = async (req, res) => {
  try {
    const earner = await findUser(req.body.earner || req.body.earnerId || req.body.email)
    if (!earner) {
      return res.status(404).json({ message: 'No earner found for that email, phone, or referral code' })
    }

    const direction = trimmed(req.body.direction || req.body.type || 'credit').toLowerCase()
    if (!['credit', 'debit'].includes(direction)) {
      return res.status(400).json({ message: 'Choose credit or debit' })
    }

    const rawAmount = Number(req.body.amount)
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return res.status(400).json({ message: 'Enter an amount greater than zero' })
    }

    const notes = trimmed(req.body.notes) || trimmed(req.body.reason)
    if (!notes) {
      return res.status(400).json({ message: 'Enter a note explaining this adjustment' })
    }

    let buyerId = null
    if (trimmed(req.body.buyer) || trimmed(req.body.buyerId)) {
      const buyer = await findUser(req.body.buyer || req.body.buyerId)
      if (!buyer) {
        return res.status(404).json({ message: 'No buyer found for that email, phone, or referral code' })
      }
      if (buyer.id === earner.id) {
        return res.status(400).json({ message: 'Earner and buyer cannot be the same person' })
      }
      buyerId = buyer.id
    }

    const pkg = resolvePackage(req.body.packageName)
    let orderId = null
    if (trimmed(req.body.orderId) || trimmed(req.body.orderNumber)) {
      const orderLookup = isUuid(req.body.orderId)
        ? await query(`SELECT id, package_name FROM orders WHERE id = $1`, [trimmed(req.body.orderId)])
        : await query(`SELECT id, package_name FROM orders WHERE order_number = $1`, [
            trimmed(req.body.orderNumber).toUpperCase(),
          ])
      const order = orderLookup.rows[0]
      if (!order) return res.status(404).json({ message: 'Order not found' })
      orderId = order.id
    }

    const amount = direction === 'debit' ? -roundMoney(rawAmount) : roundMoney(rawAmount)
    const incomeType = trimmed(req.body.incomeType).toLowerCase() || 'adjustment'
    if (!INCOME_TYPES.includes(incomeType)) {
      return res.status(400).json({ message: 'Choose a valid income type' })
    }

    const inserted = await query(
      `INSERT INTO affiliate_earnings (
         user_id, buyer_id, amount, package_name, income_type,
         commission_percent, net_amount, country, order_id, status,
         notes, source, created_by
       )
       VALUES ($1, $2, $3, $4, $5, NULL, NULL, $6, $7, 'credited', $8, 'adjustment', $9)
       RETURNING id`,
      [
        earner.id,
        buyerId,
        amount,
        pkg?.name || null,
        incomeType,
        earner.country || null,
        orderId,
        notes,
        req.user.id,
      ],
    )

    if (orderId) await syncCommissionTotal(orderId)

    const detail = await query(
      `SELECT ${SELECT_SQL}
       ${JOIN_SQL}
       WHERE e.id = $1`,
      [inserted.rows[0].id],
    )

    return res.status(201).json({ commission: mapEarning(detail.rows[0]) })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({
        message: 'A credited sale commission already exists for this earner, buyer, package, and level',
      })
    }
    console.error('Create adjustment error:', error.message)
    return res.status(500).json({ message: 'Could not record the adjustment' })
  }
}

module.exports = {
  listCommissions,
  getCommissionStats,
  getCommissionMeta,
  getCommission,
  getEarnerCommissions,
  reverseCommission,
  createAdjustment,
}
