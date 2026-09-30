const bcrypt = require('bcryptjs')
const { query } = require('../config/db')
const { CATEGORIES, PACKAGES } = require('../data/catalogSeed')

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
  const fullName = String(process.env.ADMIN_NAME || 'Digital Expert Admin').trim()

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

module.exports = { seedCatalog, ensureAdmin, seedTrainingDays }
