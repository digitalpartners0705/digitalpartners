const jwt = require('jsonwebtoken')
const { query } = require('../config/db')

const ACCOUNT_DISABLED_CODE = 'ACCOUNT_DISABLED'
const ACCOUNT_DISABLED_MESSAGE = 'This account has been deactivated. Contact support.'

const accountDisabledPayload = () => ({
  code: ACCOUNT_DISABLED_CODE,
  message: ACCOUNT_DISABLED_MESSAGE,
})

const loadAccountAccess = async (userId) => {
  const result = await query(
    `SELECT role, knowledge_package, COALESCE(is_active, TRUE) AS is_active
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [userId],
  )
  return result.rows[0] || null
}

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ message: 'Please log in to continue' })
  }

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ message: 'Session expired. Please log in again' })
  }

  req.user = payload

  loadAccountAccess(payload.id)
    .then((row) => {
      if (!row) return res.status(401).json({ message: 'Please log in to continue' })
      if (!row.is_active) return res.status(403).json(accountDisabledPayload())
      req.account = row
      return next()
    })
    .catch((error) => {
      console.error('Auth check failed:', error.message)
      return res.status(500).json({ message: 'Could not verify your session' })
    })
}

const requireAdmin = (req, res, next) => {
  requireAuth(req, res, async () => {
    try {
      const row = req.account || (await loadAccountAccess(req.user.id))
      if (!row || row.role !== 'admin') {
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
      const row = req.account || (await loadAccountAccess(req.user.id))
      if (!row) return res.status(401).json({ message: 'Please log in to continue' })
      if (row.role === 'admin' || String(row.knowledge_package || '').trim()) return next()
      return res.status(403).json({ message: 'Choose a package before using this area' })
    } catch (error) {
      console.error('Subscription check failed:', error.message)
      return res.status(500).json({ message: 'Could not verify your subscription' })
    }
  })
}

module.exports = {
  requireAuth,
  requireAdmin,
  requireSubscription,
  ACCOUNT_DISABLED_CODE,
  ACCOUNT_DISABLED_MESSAGE,
  accountDisabledPayload,
}
