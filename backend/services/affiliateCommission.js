const { query } = require('../config/db')
const { MAX_LEVEL, commissionForLevel, resolvePackage } = require('../data/commissions')

/**
 * One purchase pays up to three levels of the buyer's referral chain:
 * level 1 active, level 2 passive, level 3 second. Nothing above level 3.
 *
 * An upline only earns if they own a package. A skipped upline does not shift the
 * levels down, so the company retains that share.
 */
const creditCommission = async ({ sponsorId, buyerId, packageName, country, level, orderId = null }) => {
  const commission = commissionForLevel(packageName, level)
  if (!commission || !sponsorId || !buyerId || sponsorId === buyerId) return null

  try {
    const result = await query(
      `INSERT INTO affiliate_earnings (
         user_id, buyer_id, amount, package_name, income_type,
         commission_percent, net_amount, country, order_id
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, amount, package_name, income_type, commission_percent, net_amount, order_id`,
      [
        sponsorId,
        buyerId,
        commission.amount,
        commission.packageName,
        commission.incomeType,
        commission.commissionPercent,
        commission.netAmount,
        country || null,
        orderId,
      ],
    )
    return result.rows[0]
  } catch (error) {
    if (error.code === '23505') return null
    throw error
  }
}

const creditUplineCommissions = async ({ buyerId, packageName, country, orderId = null }) => {
  if (!resolvePackage(packageName)) return []

  const buyer = await query(
    `SELECT id, referred_by, country FROM users WHERE id = $1`,
    [buyerId],
  )
  const buyerRow = buyer.rows[0]
  if (!buyerRow) return []

  const saleCountry = country || buyerRow.country || null
  const visited = new Set([buyerRow.id])
  const credited = []

  let uplineId = buyerRow.referred_by

  for (let level = 1; level <= MAX_LEVEL && uplineId; level += 1) {
    if (visited.has(uplineId)) break
    visited.add(uplineId)

    const upline = await query(
      `SELECT id, referred_by, knowledge_package FROM users WHERE id = $1`,
      [uplineId],
    )
    const uplineRow = upline.rows[0]
    if (!uplineRow) break

    if (resolvePackage(uplineRow.knowledge_package)) {
      const earning = await creditCommission({
        sponsorId: uplineRow.id,
        buyerId: buyerRow.id,
        packageName,
        country: saleCountry,
        level,
        orderId,
      })
      if (earning) credited.push(earning)
    }

    uplineId = uplineRow.referred_by
  }

  return credited
}

module.exports = { creditCommission, creditUplineCommissions }
