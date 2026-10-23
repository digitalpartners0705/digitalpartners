const jwt = require('jsonwebtoken')
const { query } = require('../config/db')

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Please log in to continue' })
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    return next()
  } catch {
    return res.status(401).json({ message: 'Session expired. Please log in again' })
  }
}

const requireAdmin = (req, res, next) => {
  requireAuth(req, res, async () => {
    try {
      const result = await query('SELECT role FROM users WHERE id = $1', [req.user.id])
      if (result.rows[0]?.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' })
      }
      return next()
    } catch (error) {
      console.error('Admin check failed:', error.message)
      return res.status(500).json({ message: 'Could not verify admin access' })
    }
  })
}

const requireSubscription = (req, res, next) => {
  requireAuth(req, res, async () => {
    try {
      const result = await query('SELECT role, knowledge_package FROM users WHERE id = $1', [req.user.id])
      const row = result.rows[0]
      if (!row) return res.status(401).json({ message: 'Please log in to continue' })
      if (row.role === 'admin' || String(row.knowledge_package || '').trim()) return next()
      return res.status(403).json({ message: 'Choose a package before using this area' })
    } catch (error) {
      console.error('Subscription check failed:', error.message)
      return res.status(500).json({ message: 'Could not verify your subscription' })
    }
  })
}

module.exports = { requireAuth, requireAdmin, requireSubscription }
