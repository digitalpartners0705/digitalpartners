const bcrypt = require('bcryptjs')
const { query } = require('../config/db')
const { CATEGORIES, PACKAGES, COURSES, LESSONS, SAMPLE_URLS } = require('../data/catalogSeed')

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
       ON CONFLICT (slug) DO NOTHING`,
      [item.slug, item.name, item.summary, index]
    )
  }

  const existingCourses = await query('SELECT COUNT(*)::int AS count FROM courses')
  if (existingCourses.rows[0].count > 0) return

  for (let index = 0; index < COURSES.length; index += 1) {
    const course = COURSES[index]
    const inserted = await query(
      `INSERT INTO courses (
         slug, title, instructor, description, category_id, package_id,
         accent, hours, requires_upgrade, status, sort_order
       )
       SELECT $1, $2, $3, $4, c.id, p.id, $5, $6, $7, 'published', $8
       FROM (SELECT 1) seed
       LEFT JOIN categories c ON c.name = $9
       LEFT JOIN packages p ON p.name = $10
       ON CONFLICT (slug) DO NOTHING
       RETURNING id`,
      [
        course.slug,
        course.title,
        course.instructor,
        course.description,
        course.accent,
        course.hours,
        course.requiresUpgrade,
        index,
        course.tag,
        course.packageName || null,
      ]
    )

    const courseId = inserted.rows[0]?.id
    if (!courseId) continue

    const titles = LESSONS[course.slug] || []
    for (let lessonIndex = 0; lessonIndex < titles.length; lessonIndex += 1) {
      const minutes = 5 + (lessonIndex % 8)
      const seconds = lessonIndex % 2 === 0 ? 0 : 30
      await query(
        `INSERT INTO lessons (course_id, title, position, duration_seconds, external_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [courseId, titles[lessonIndex], lessonIndex, minutes * 60 + seconds, SAMPLE_URLS[lessonIndex % SAMPLE_URLS.length]]
      )
    }
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

module.exports = { seedCatalog, ensureAdmin }
