const fs = require('fs')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { query } = require('../config/db')
const storage = require('../services/storage')

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const USER_FIELDS = `id, full_name, email, phone, country, state, knowledge_package,
  promo_code, coupon_code, has_gst, role, avatar_key, created_at`

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
  avatarUrl: await storage.signedGet(row.avatar_key),
  createdAt: row.created_at,
})

const signToken = (user) =>
  jwt.sign(
    { id: user.id, email: user.email, role: user.role || 'student' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )

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

    if (!email) return res.status(400).json({ message: 'Email Id is required' })
    if (!EMAIL_PATTERN.test(email)) return res.status(400).json({ message: 'Enter a valid email address' })
    if (!fullName) return res.status(400).json({ message: 'Full name is required' })
    if (!phone) return res.status(400).json({ message: 'Contact number is required' })
    if (!country) return res.status(400).json({ message: 'Country is required' })
    if (!state) return res.status(400).json({ message: 'State is required' })
    if (!knowledgePackage) return res.status(400).json({ message: 'Please select a knowledge package' })
    if (!password) return res.status(400).json({ message: 'Password is required' })
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' })

    const passwordHash = await bcrypt.hash(password, 10)
    const result = await query(
      `INSERT INTO users (
         full_name, email, phone, country, state, knowledge_package,
         promo_code, coupon_code, has_gst, password_hash
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING ${USER_FIELDS}`,
      [fullName, email, phone, country, state, knowledgePackage, promoCode, couponCode, hasGst, passwordHash]
    )

    const user = await publicUser(result.rows[0])
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
      [email]
    )

    const row = result.rows[0]
    if (!row) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const matches = await bcrypt.compare(password, row.password_hash)
    if (!matches) {
      return res.status(401).json({ message: 'Invalid email or password' })
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
    const result = await query(
      `SELECT ${USER_FIELDS} FROM users WHERE id = $1`,
      [req.user.id]
    )

    if (!result.rows[0]) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.json({ user: await publicUser(result.rows[0]) })
  } catch (error) {
    console.error('Me error:', error.message)
    return res.status(500).json({ message: 'Could not load profile' })
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
      [key, req.user.id]
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

module.exports = { signup, login, me, updateAvatar, changePassword }
