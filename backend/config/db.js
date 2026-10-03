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
  connectionTimeoutMillis: 30000,
  statement_timeout: 60000,
})

pool.on('error', (error) => {
  console.error('Database connection dropped:', error.message)
})

const RETRY_CODES = new Set([
  'EAI_AGAIN',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  '57P01', // admin_shutdown
  '57P03', // cannot_connect_now
])

const isRetryableDbError = (error) => {
  if (!error) return false
  if (RETRY_CODES.has(error.code)) return true
  const message = String(error.message || '').toLowerCase()
  return (
    message.includes('timeout') ||
    message.includes('terminated') ||
    message.includes('connection') ||
    message.includes('econnreset')
  )
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const query = async (text, params) => {
  let lastError

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await pool.query(text, params)
    } catch (error) {
      lastError = error
      if (!isRetryableDbError(error) || attempt === 3) throw error
      await sleep(500 * attempt)
    }
  }

  throw lastError
}

const waitForDatabase = async (attempts = 5) => {
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      await query('SELECT 1')
      if (attempt > 1) console.log(`Database connected on attempt ${attempt}`)
      return
    } catch (error) {
      lastError = error
      console.warn(`Database not ready (attempt ${attempt}/${attempts}): ${error.message}`)
      if (attempt < attempts) await sleep(1500 * attempt)
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
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_source TEXT`)
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS pin_code TEXT`)
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_name TEXT`)
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_phone TEXT`)
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
  await query(`ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS notes TEXT`)
  await query(`ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'sale'`)
  await query(`ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL`)
  await query(`ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS reverse_reason TEXT`)
  await query(`CREATE INDEX IF NOT EXISTS affiliate_earnings_user_idx ON affiliate_earnings (user_id)`)
  await query(`CREATE INDEX IF NOT EXISTS affiliate_earnings_earned_at_idx ON affiliate_earnings (earned_at)`)
  await query(`CREATE INDEX IF NOT EXISTS affiliate_earnings_income_type_idx ON affiliate_earnings (income_type)`)
  await query(`DROP INDEX IF EXISTS affiliate_earnings_active_buyer_uidx`)
  await query(`DROP INDEX IF EXISTS affiliate_earnings_active_buyer_package_uidx`)
  await query(`DROP INDEX IF EXISTS affiliate_earnings_buyer_package_type_uidx`)

  // One KYC row per user. After insert, affiliates cannot update — support must change it.
  await query(`
    CREATE TABLE IF NOT EXISTS user_kyc (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      account_holder_name TEXT NOT NULL,
      bank_account_number TEXT NOT NULL,
      ifsc_code TEXT NOT NULL,
      bank_name TEXT NOT NULL,
      branch TEXT NOT NULL,
      upi TEXT,
      aadhaar_number TEXT NOT NULL,
      pan_number TEXT NOT NULL,
      submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await query(`CREATE INDEX IF NOT EXISTS user_kyc_user_idx ON user_kyc (user_id)`)
}

const initOrderTables = async () => {
  await query(`CREATE SEQUENCE IF NOT EXISTS order_number_seq START 100001`)

  await query(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_number TEXT UNIQUE NOT NULL,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      package_name TEXT NOT NULL,
      package_slug TEXT,
      listed_price NUMERIC(12,2) NOT NULL DEFAULT 0,
      discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      gross_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      net_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      gst_rate NUMERIC(5,2) NOT NULL DEFAULT 18,
      gst_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      promo_code TEXT,
      coupon_code TEXT,
      status TEXT NOT NULL DEFAULT 'paid',
      source TEXT NOT NULL DEFAULT 'signup',
      payment_status TEXT NOT NULL DEFAULT 'captured',
      payment_provider TEXT NOT NULL DEFAULT 'none',
      payment_method TEXT,
      payment_reference TEXT,
      payment_order_id TEXT,
      payment_signature TEXT,
      paid_at TIMESTAMPTZ,
      buyer_name TEXT,
      buyer_email TEXT,
      buyer_phone TEXT,
      buyer_country TEXT,
      buyer_state TEXT,
      has_gst BOOLEAN NOT NULL DEFAULT FALSE,
      gst_number TEXT,
      sponsor_id UUID REFERENCES users(id) ON DELETE SET NULL,
      commission_total NUMERIC(12,2) NOT NULL DEFAULT 0,
      notes TEXT,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      refunded_at TIMESTAMPTZ,
      refund_amount NUMERIC(12,2),
      refund_reason TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)

  await query(`CREATE INDEX IF NOT EXISTS orders_user_idx ON orders (user_id)`)
  await query(`CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders (created_at DESC)`)
  await query(`CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status)`)
  await query(`CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders (payment_status)`)
  await query(`CREATE INDEX IF NOT EXISTS orders_package_idx ON orders (package_name)`)
  await query(`CREATE INDEX IF NOT EXISTS orders_sponsor_idx ON orders (sponsor_id)`)

  await query(`ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id) ON DELETE SET NULL`)
  await query(`ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'credited'`)
  await query(`ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMPTZ`)
  await query(`ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS notes TEXT`)
  await query(`ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'sale'`)
  await query(`ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL`)
  await query(`ALTER TABLE affiliate_earnings ADD COLUMN IF NOT EXISTS reverse_reason TEXT`)
  // Debit adjustments store a negative amount so wallet totals stay a simple SUM.
  await query(`ALTER TABLE affiliate_earnings DROP CONSTRAINT IF EXISTS affiliate_earnings_amount_check`)
  await query(`CREATE INDEX IF NOT EXISTS affiliate_earnings_order_idx ON affiliate_earnings (order_id)`)
  await query(`CREATE INDEX IF NOT EXISTS affiliate_earnings_status_idx ON affiliate_earnings (status)`)

  // Only sale-level commissions stay unique; admin adjustments can repeat for the same buyer.
  await query(`DROP INDEX IF EXISTS affiliate_earnings_buyer_package_type_uidx`)
  await query(`DROP INDEX IF EXISTS affiliate_earnings_credited_uidx`)
  await query(`
    CREATE UNIQUE INDEX IF NOT EXISTS affiliate_earnings_credited_uidx
    ON affiliate_earnings (user_id, buyer_id, package_name, income_type)
    WHERE buyer_id IS NOT NULL
      AND package_name IS NOT NULL
      AND status = 'credited'
      AND income_type IN ('active', 'passive', 'second')
  `)

  // Purchases are treated as paid until a real gateway is wired in.
  await query(`
    UPDATE orders
    SET payment_status = 'captured',
        paid_at = COALESCE(paid_at, created_at),
        updated_at = NOW()
    WHERE status = 'paid' AND payment_status = 'pending'
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
  waitForDatabase,
  initUsersTable,
  initCatalogTables,
  initAffiliateTables,
  initOrderTables,
  initTrainingTables,
  createReferralCode,
  ensureReferralCodes,
}
