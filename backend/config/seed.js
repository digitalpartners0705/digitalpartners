const bcrypt = require('bcryptjs')
const { query } = require('../config/db')
const { CATEGORIES, PACKAGES } = require('../data/catalogSeed')
const { createOrder, syncCommissionTotal } = require('../services/orders')

const seedCatalog = async () => {
  for (let index = 0; index < CATEGORIES.length; index += 1) {
    await query(
      `INSERT INTO categories (name, sort_order)
       VALUES ($1, $2)
       ON CONFLICT (name) DO NOTHING`,
      [CATEGORIES[index], index]
    )
  }

  for (let index = 0; index < PACKAGES.length; index += 1) {
    const item = PACKAGES[index]
    await query(
      `INSERT INTO packages (slug, name, summary, sort_order)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO UPDATE SET
         name = EXCLUDED.name,
         summary = EXCLUDED.summary,
         sort_order = EXCLUDED.sort_order`,
      [item.slug, item.name, item.summary, index]
    )
  }
}

const ensureAdmin = async () => {
  const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
  const password = String(process.env.ADMIN_PASSWORD || '')
  const fullName = String(process.env.ADMIN_NAME || 'Digital Vidhya Admin').trim()

  if (!email || !password) {
    console.warn('ADMIN_EMAIL or ADMIN_PASSWORD is missing. Admin login is not configured.')
    return
  }

  const existing = await query('SELECT id FROM users WHERE email = $1', [email])
  if (existing.rows[0]) {
    await query(`UPDATE users SET role = 'admin' WHERE email = $1`, [email])
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  await query(
    `INSERT INTO users (full_name, email, password_hash, role)
     VALUES ($1, $2, $3, 'admin')`,
    [fullName, email, passwordHash]
  )
  console.log(`Admin account ready for ${email}`)
}

const TRAINING_DAYS = [
  { day: 1, title: 'Introduction', videos: [['What this work is', 6], ['Who you are talking to', 5], ['What a good week looks like', 4]] },
  { day: 2, title: 'The packages', videos: [['Social Expert', 7], ['Ads Expert', 6], ['AI Premium Expert', 8]] },
  { day: 3, title: 'Your link', videos: [['Where the link lives', 4], ['Send the link with the brochure', 5]] },
  { day: 4, title: 'The first conversation', videos: [['How to open', 6], ['Match one package', 7], ['What to send after', 4]] },
  { day: 5, title: 'The files', videos: [['Partner kit', 5], ['Which brochure to send', 6]] },
  { day: 6, title: 'Community', videos: [['English and Hindi rooms', 4], ['What to tell them before a call', 5]] },
  { day: 7, title: 'After they join', videos: [['A signup is not a sale', 4], ['What shows on Ref Info', 5]] },
  { day: 8, title: 'Earnings', videos: [['When a commission appears', 6], ['What not to promise', 4]] },
  { day: 9, title: 'Payouts', videos: [['Finish KYC first', 5], ['How a payout is sent', 4]] },
  { day: 10, title: 'Your routine', videos: [['A simple weekly plan', 6], ['What to review before you share', 5]] },
]

const seedTrainingDays = async () => {
  const existing = await query('SELECT COUNT(*)::int AS count FROM training_days')
  if (existing.rows[0].count > 0) return

  for (const day of TRAINING_DAYS) {
    const inserted = await query(
      `INSERT INTO training_days (day_number, title, status)
       VALUES ($1, $2, 'published')
       RETURNING id`,
      [day.day, day.title]
    )
    const dayId = inserted.rows[0].id
    for (let index = 0; index < day.videos.length; index += 1) {
      const [title, minutes] = day.videos[index]
      await query(
        `INSERT INTO training_videos (day_id, title, position, duration_seconds)
         VALUES ($1, $2, $3, $4)`,
        [dayId, title, index, minutes * 60]
      )
    }
  }
}

/**
 * Accounts created before order tracking existed only carry a package name, so each one
 * gets a single historical order and its existing commission rows are attached to it.
 */
const backfillOrders = async () => {
  const result = await query(
    `SELECT u.id, u.created_at, u.knowledge_package
     FROM users u
     WHERE u.knowledge_package IS NOT NULL
       AND u.knowledge_package <> ''
       AND NOT EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id)
     ORDER BY u.created_at ASC`,
  )

  let created = 0
  for (const row of result.rows) {
    const order = await createOrder({
      userId: row.id,
      packageName: row.knowledge_package,
      source: 'legacy',
      status: 'paid',
      paymentStatus: 'captured',
      paymentProvider: 'none',
      paidAt: row.created_at,
      notes: 'Recorded from the account package before order tracking existed.',
      createdAt: row.created_at,
    })
    if (!order) continue
    created += 1

    await query(
      `UPDATE affiliate_earnings
       SET order_id = $1
       WHERE order_id IS NULL AND buyer_id = $2 AND package_name = $3`,
      [order.id, row.id, order.package_name],
    )
    await syncCommissionTotal(order.id)
  }

  if (created > 0) {
    console.log(`Recorded ${created} historical order${created === 1 ? '' : 's'} from existing accounts`)
  }
}

module.exports = { seedCatalog, ensureAdmin, seedTrainingDays, backfillOrders }
