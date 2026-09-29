const { query } = require('../config/db')
const { activeCommissionFor } = require('../data/commissions')

/**
 * Credits active income for one package purchase.
 * Same buyer can generate multiple commissions across packages (Social, then Ads, etc.).
 * Same buyer + same package + active is only credited once.
 */
const creditActiveCommission = async ({ sponsorId, buyerId, packageName, country }) => {
  const commission = activeCommissionFor(packageName)
  if (!commission || !sponsorId || !buyerId || sponsorId === buyerId) return null

  try {
    const result = await query(
      `INSERT INTO affiliate_earnings (
         user_id, buyer_id, amount, package_name, income_type,
         commission_percent, net_amount, country
       )
       VALUES ($1, $2, $3, $4, 'active', $5, $6, $7)
       RETURNING id, amount, package_name, commission_percent, net_amount`,
      [
        sponsorId,
        buyerId,
        commission.amount,
        commission.packageName,
        commission.commissionPercent,
        commission.netAmount,
        country || null,
      ],
    )
    return result.rows[0]
  } catch (error) {
    if (error.code === '23505') return null
    throw error
  }
}

const creditSponsorForPurchase = async ({ buyerId, packageName, country }) => {
  const buyer = await query(`SELECT id, referred_by, country FROM users WHERE id = $1`, [buyerId])
  const row = buyer.rows[0]
  if (!row?.referred_by) return null

  return creditActiveCommission({
    sponsorId: row.referred_by,
    buyerId: row.id,
    packageName,
    country: country || row.country || null,
  })
}

module.exports = { creditActiveCommission, creditSponsorForPurchase }
