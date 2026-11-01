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
  { day: 2, title: 'The packages', videos: [['Social Expert', 7], ['Ads & Creative Expert', 6], ['AI & Business Expert', 8]] },
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

const ANNOUNCEMENT_SEED = [
  {
    kind: 'featured',
    tag: 'This month',
    title: 'Talk about AI Premium first',
    body: 'AI & Business Expert is the package to open with. A real sale shows on Earnings after it is recorded.',
    panel: 'courses',
    icon: null,
    displayDate: '27 Sep 2026',
    sortOrder: 0,
  },
  {
    kind: 'featured',
    tag: 'Updated',
    title: 'Partner kit was rewritten',
    body: 'The starter file and the three package sheets are new. Send this version before you walk someone through the courses.',
    panel: 'files',
    icon: null,
    displayDate: '24 Sep 2026',
    sortOrder: 1,
  },
  {
    kind: 'notice',
    tag: null,
    title: 'WhatsApp and Telegram rooms only',
    body: 'Community calls stay in those two rooms. Share the one your referral will actually join.',
    panel: null,
    icon: 'rooms',
    displayDate: '22 Sep',
    sortOrder: 0,
  },
  {
    kind: 'notice',
    tag: null,
    title: 'KYC before the first payout',
    body: 'Finish verification before a commission can be sent. Earnings stay at ₹0 until a sale exists.',
    panel: null,
    icon: 'shield',
    displayDate: '18 Sep',
    sortOrder: 1,
  },
  {
    kind: 'notice',
    tag: null,
    title: 'Weekly call notes',
    body: 'This week’s note: lead with the package that matches the learner, then send the brochure.',
    panel: null,
    icon: 'note',
    displayDate: '15 Sep',
    sortOrder: 2,
  },
  {
    kind: 'notice',
    tag: null,
    title: 'Check the link before you share',
    body: 'Use your own referral link with the brochure so the signup is tied to you.',
    panel: null,
    icon: 'link',
    displayDate: '09 Sep',
    sortOrder: 3,
  },
]

const seedAnnouncements = async () => {
  const existing = await query('SELECT COUNT(*)::int AS count FROM announcements')
  if (existing.rows[0].count > 0) return

  for (const item of ANNOUNCEMENT_SEED) {
    await query(
      `INSERT INTO announcements (
         kind, tag, title, body, panel, icon, display_date, status, sort_order, published_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'published', $8, NOW())`,
      [
        item.kind,
        item.tag,
        item.title,
        item.body,
        item.panel,
        item.icon,
        item.displayDate,
        item.sortOrder,
      ],
    )
  }
  console.log(`Seeded ${ANNOUNCEMENT_SEED.length} affiliate announcements`)
}

const ACHIEVEMENT_SEED = [
  {
    title: 'First referral',
    amount: 5000,
    note: 'Your first solid commission from a paid signup.',
    sortOrder: 0,
  },
  {
    title: 'Working partner',
    amount: 10000,
    note: 'Commission crossed the first serious mark.',
    sortOrder: 1,
  },
  {
    title: 'Steady month',
    amount: 25000,
    note: 'A full stretch of referrals, not a single sale.',
    sortOrder: 2,
  },
  {
    title: 'Proven closer',
    amount: 50000,
    note: 'Enough commission to show a repeat habit.',
    sortOrder: 3,
  },
  {
    title: 'One lakh',
    amount: 100000,
    note: 'A six-figure commission total.',
    sortOrder: 4,
  },
  {
    title: 'Pace setter',
    amount: 200000,
    note: 'The highest mark on this board for now.',
    sortOrder: 5,
  },
]

const seedAchievements = async () => {
  const existing = await query('SELECT COUNT(*)::int AS count FROM achievement_milestones')
  if (existing.rows[0].count > 0) return

  for (const item of ACHIEVEMENT_SEED) {
    await query(
      `INSERT INTO achievement_milestones (
         title, amount, note, reward_type, status, sort_order
       ) VALUES ($1, $2, $3, 'none', 'published', $4)`,
      [item.title, item.amount, item.note, item.sortOrder],
    )
  }
  console.log(`Seeded ${ACHIEVEMENT_SEED.length} achievement milestones`)
}

module.exports = {
  seedCatalog,
  ensureAdmin,
  seedTrainingDays,
  seedAnnouncements,
  seedAchievements,
  backfillOrders,
}
