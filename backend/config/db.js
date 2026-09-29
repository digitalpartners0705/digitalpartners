const dns = require('dns')
const { Pool } = require('pg')

dns.setDefaultResultOrder('ipv4first')

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing from backend/.env')
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 5,
  min: 0,
  keepAlive: true,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 15000,
})

pool.on('error', (error) => {
  console.error('Database connection dropped:', error.message)
})

const RETRY_CODES = new Set(['EAI_AGAIN', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET'])

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const query = async (text, params) => {
  let lastError

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await pool.query(text, params)
    } catch (error) {
      lastError = error
      if (!RETRY_CODES.has(error.code) || attempt === 3) throw error
      await sleep(400 * attempt)
    }
  }

  throw lastError
}

const initUsersTable = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS country TEXT`)
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS state TEXT`)
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS knowledge_package TEXT`)
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS promo_code TEXT`)
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS coupon_code TEXT`)
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS has_gst BOOLEAN NOT NULL DEFAULT FALSE`)
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student'`)
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_key TEXT`)
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT`)
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id) ON DELETE SET NULL`)
  await query(`CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_uidx ON users (referral_code) WHERE referral_code IS NOT NULL`)
  await query(`CREATE INDEX IF NOT EXISTS users_referred_by_idx ON users (referred_by)`)
  await ensureReferralCodes()
}

const createReferralCode = () => String(Math.floor(10_000_000_000 + Math.random() * 90_000_000_000))

const ensureReferralCodes = async () => {
  const missing = await query(`SELECT id FROM users WHERE referral_code IS NULL OR referral_code = ''`)
  for (const row of missing.rows) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const code = createReferralCode()
      try {
        await query(`UPDATE users SET referral_code = $1 WHERE id = $2 AND (referral_code IS NULL OR referral_code = '')`, [
          code,
          row.id,
        ])
        break
      } catch (error) {
        if (error.code !== '23505') throw error
      }
    }
  }
}

const initCatalogTables = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT UNIQUE NOT NULL,
      sort_order INT NOT NULL DEFAULT 0
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS packages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT UNIQUE NOT NULL,
      name TEXT UNIQUE NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      sort_order INT NOT NULL DEFAULT 0
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS courses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      slug TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      instructor TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
      package_id UUID REFERENCES packages(id) ON DELETE SET NULL,
      accent TEXT NOT NULL DEFAULT 'from-indigo-500 to-violet-500',
      thumbnail_key TEXT,
      hours NUMERIC(6,1) NOT NULL DEFAULT 0,
      requires_upgrade BOOLEAN NOT NULL DEFAULT FALSE,
      status TEXT NOT NULL DEFAULT 'published',
      sort_order INT NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS lessons (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      position INT NOT NULL DEFAULT 0,
      duration_seconds INT NOT NULL DEFAULT 0,
      storage_key TEXT,
      external_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

const initAffiliateTables = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS affiliate_earnings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
      earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await query(`ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES users(id) ON DELETE SET NULL`)
  await query(`ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS package_name TEXT`)
  await query(`ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS income_type TEXT NOT NULL DEFAULT 'active'`)
  await query(`ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS commission_percent NUMERIC(6,2)`)
  await query(`ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS net_amount NUMERIC(12,2)`)
  await query(`ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS country TEXT`)
  await query(`CREATE INDEX IF NOT EXISTS affiliate_earnings_user_idx ON affiliate_earnings (user_id)`)
  await query(`CREATE INDEX IF NOT EXISTS affiliate_earnings_earned_at_idx ON affiliate_earnings (earned_at)`)
  await query(`CREATE INDEX IF NOT EXISTS affiliate_earnings_income_type_idx ON affiliate_earnings (income_type)`)
  await query(`DROP INDEX IF EXISTS affiliate_earnings_active_buyer_uidx`)
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS affiliate_earnings_active_buyer_package_uidx
    ON affiliate_earnings (buyer_id, package_name)
    WHERE income_type = 'active' AND buyer_id IS NOT NULL AND package_name IS NOT NULL
  `)
}

const initTrainingTables = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS training_days (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      day_number INT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'published',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await query(`
    CREATE TABLE IF NOT EXISTS training_videos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      day_id UUID NOT NULL REFERENCES training_days(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      position INT NOT NULL DEFAULT 0,
      duration_seconds INT NOT NULL DEFAULT 0,
      storage_key TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

module.exports = {
  pool,
  query,
  initUsersTable,
  initCatalogTables,
  initAffiliateTables,
  initTrainingTables,
  createReferralCode,
  ensureReferralCodes,
}
