const fs = require('fs')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { query, createReferralCode } = require('../config/db')
const { PACKAGE_NAMES, canPurchasePackage } = require('../data/commissions')
const { creditUplineCommissions } = require('../services/affiliateCommission')
const storage = require('../services/storage')

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const USER_FIELDS = `id, full_name, email, phone, country, state, knowledge_package,
  promo_code, coupon_code, has_gst, role, avatar_key, referral_code, referred_by, created_at`

const publicUser = async (row) => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  country: row.country,
  state: row.state,
  knowledgePackage: row.knowledge_package,
  promoCode: row.promo_code,
  couponCode: row.coupon_code,
  hasGst: row.has_gst,
  role: row.role || 'student',
  referralCode: row.referral_code || null,
  referredBy: row.referred_by || null,
  avatarUrl: await storage.signedGet(row.avatar_key),
  createdAt: row.created_at,
})

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role || 'student' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )

const allocateReferralCode = async () => {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    const code = createReferralCode()
    const existing = await query(`SELECT 1 FROM users WHERE referral_code = $1 LIMIT 1`, [code])
    if (!existing.rows[0]) return code
  }
  throw new Error('Could not allocate a referral code')
}

const REFERRAL_SOURCES = new Set(['joining', 'package'])

const normalizeReferralSource = (value) => {
  const source = String(value || '').trim().toLowerCase()
  return REFERRAL_SOURCES.has(source) ? source : null
}

const findSponsorByCode = async (rawCode) => {
  const referralCode = String(rawCode || '').trim()
  if (!referralCode) return null
  const result = await query(
    `SELECT id, referral_code, knowledge_package
     FROM users
     WHERE referral_code = $1
     LIMIT 1`,
    [referralCode],
  )
  return result.rows[0] || null
}

const signup = async (req, res) => {
  try {
    const fullName = String(req.body.fullName || '').trim()
    const email = String(req.body.email || '').trim().toLowerCase()
    const phone = String(req.body.phone || '').trim()
    const country = String(req.body.country || '').trim()
    const state = String(req.body.state || '').trim()
    const knowledgePackage = String(req.body.knowledgePackage || '').trim()
    const promoCode = String(req.body.promoCode || '').trim().toUpperCase() || null
    const couponCode = String(req.body.couponCode || '').trim().toUpperCase() || null
    const password = String(req.body.password || '')
    const hasGst = Boolean(req.body.hasGst)
    const incomingReferral = String(req.body.referralCode || req.body.ref || '').trim()
    const referralSource = normalizeReferralSource(req.body.referralSource)

    if (!email) return res.status(400).json({ message: 'Email Id is required' })
    if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ message: 'Enter a valid email address' })
    if (!fullName) return res.status(400).json({ message: 'Full name is required' })
    if (!phone) return res.status(400).json({ message: 'Contact number is required' })
    if (!country) return res.status(400).json({ message: 'Country is required' })
    if (!state) return res.status(400).json({ message: 'State is required' })
    if (!knowledgePackage) return res.status(400).json({ message: 'Please select a knowledge package' })
    if (!PACKAGE_NAMES.includes(knowledgePackage)) {
      return res.status(400).json({ message: 'Choose Social Expert, Ads Expert, or AI Premium Expert' })
    }
    if (!password) return res.status(400).json({ message: 'Password is required' })
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' })

    const sponsor = await findSponsorByCode(incomingReferral)
    if (incomingReferral && !sponsor) {
      return res.status(400).json({ message: 'Referral code is invalid' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const referralCode = await allocateReferralCode()
    const result = await query(
      `INSERT INTO users (
         full_name, email, phone, country, state, knowledge_package,
         promo_code, coupon_code, has_gst, password_hash, referral_code, referred_by,
         referral_source
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING ${USER_FIELDS}`,
      [
        fullName,
        email,
        phone,
        country,
        state,
        knowledgePackage,
        promoCode,
        couponCode,
        hasGst,
        passwordHash,
        referralCode,
        sponsor?.id || null,
        sponsor?.id ? referralSource || 'joining' : null,
      ],
    )

    const created = result.rows[0]
    if (sponsor?.id) {
      await creditUplineCommissions({
        buyerId: created.id,
        packageName: knowledgePackage,
        country,
      })
    }

    const user = await publicUser(created)
    return res.status(201).json({ token: signToken(user), user })
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'An account with this email already exists' })
    }
    console.error('Signup error:', error.message)
    return res.status(500).json({ message: 'Could not create account. Please try again' })
  }
}

const login = async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase()
    const password = String(req.body.password || '')

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' })
    }

    const result = await query(
      `SELECT ${USER_FIELDS}, password_hash
       FROM users WHERE email = $1`,
      [email],
    )

    const row = result.rows[0]
    if (!row) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const matches = await bcrypt.compare(password, row.password_hash)
    if (!matches) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (!row.referral_code) {
      const code = await allocateReferralCode()
      await query(`UPDATE users SET referral_code = $1 WHERE id = $2`, [code, row.id])
      row.referral_code = code
    }

    const user = await publicUser(row)
    return res.json({ token: signToken(user), user })
  } catch (error) {
    console.error('Login error:', error.message)
    return res.status(500).json({ message: 'Could not log in. Please try again' })
  }
}

const me = async (req, res) => {
  try {
    const result = await query(`SELECT ${USER_FIELDS} FROM users WHERE id = $1`, [req.user.id])

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'User not found' })
    }

    const row = result.rows[0]
    if (!row.referral_code) {
      const code = await allocateReferralCode()
      await query(`UPDATE users SET referral_code = $1 WHERE id = $2`, [code, row.id])
      row.referral_code = code
    }

    return res.json({ user: await publicUser(row) })
  } catch (error) {
    console.error('Me error:', error.message)
    return res.status(500).json({ message: 'Could not load profile' })
  }
}

const purchasePackage = async (req, res) => {
  try {
    const packageName = String(req.body.packageName || req.body.knowledgePackage || '').trim()
    if (!packageName) {
      return res.status(400).json({ message: 'Please select a package to buy' })
    }

    const current = await query(`SELECT ${USER_FIELDS} FROM users WHERE id = $1`, [req.user.id])
    const row = current.rows[0]
    if (!row) return res.status(404).json({ message: 'User not found' })

    const check = canPurchasePackage(row.knowledge_package, packageName)
    if (!check.ok) {
      return res.status(400).json({ message: check.message })
    }

    const updated = await query(
      `UPDATE users SET knowledge_package = $1 WHERE id = $2 RETURNING ${USER_FIELDS}`,
      [check.package.name, row.id],
    )

    const credited = await creditUplineCommissions({
      buyerId: row.id,
      packageName: check.package.name,
      country: row.country,
    })

    return res.json({
      user: await publicUser(updated.rows[0]),
      purchase: {
        packageName: check.package.name,
        commissionCredited: credited.length > 0,
        levelsPaid: credited.map((earning) => earning.income_type),
      },
    })
  } catch (error) {
    console.error('Purchase error:', error.message)
    return res.status(500).json({ message: 'Could not complete the purchase' })
  }
}

const updateAvatar = async (req, res) => {
  const tempPath = req.file?.path
  try {
    if (!storage.isConfigured()) {
      return res.status(503).json({ message: 'Photo upload is not available until storage is configured.' })
    }
    if (!req.file) return res.status(400).json({ message: 'Choose a photo to upload' })

    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp'])
    if (!allowed.has(req.file.mimetype)) {
      return res.status(400).json({ message: 'Use a JPG, PNG, or WEBP photo' })
    }

    const current = await query('SELECT avatar_key FROM users WHERE id = $1', [req.user.id])
    const previousKey = current.rows[0]?.avatar_key
    const safeName = String(req.file.originalname || 'photo').replace(/[^a-zA-Z0-9._-]/g, '-').slice(-60)
    const key = `avatars/${req.user.id}/${Date.now()}-${safeName}`
    await storage.putObject(key, fs.createReadStream(tempPath), req.file.mimetype)
    if (previousKey && previousKey !== key) {
      await storage.removeObject(previousKey).catch(() => {})
    }

    const updated = await query(
      `UPDATE users SET avatar_key = $1 WHERE id = $2 RETURNING ${USER_FIELDS}`,
      [key, req.user.id],
    )
    return res.json({ user: await publicUser(updated.rows[0]) })
  } catch (error) {
    console.error('Avatar error:', error.message)
    return res.status(500).json({ message: 'Could not update your photo' })
  } finally {
    if (tempPath) fs.unlink(tempPath, () => {})
  }
}

const changePassword = async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || '')
    const nextPassword = String(req.body.newPassword || '')
    if (!currentPassword || !nextPassword) {
      return res.status(400).json({ message: 'Enter your current password and a new password' })
    }
    if (nextPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' })
    }

    const result = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id])
    const row = result.rows[0]
    if (!row) return res.status(404).json({ message: 'User not found' })

    const matches = await bcrypt.compare(currentPassword, row.password_hash)
    if (!matches) return res.status(401).json({ message: 'Current password is incorrect' })

    const passwordHash = await bcrypt.hash(nextPassword, 10)
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.user.id])
    return res.json({ message: 'Password updated' })
  } catch (error) {
    console.error('Password error:', error.message)
    return res.status(500).json({ message: 'Could not update your password' })
  }
}

module.exports = { signup, login, me, purchasePackage, updateAvatar, changePassword }
