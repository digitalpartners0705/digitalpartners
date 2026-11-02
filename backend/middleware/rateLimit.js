const rateLimit = require('express-rate-limit')

const jsonHandler = (_req, res) => {
  res.status(429).json({
    message: 'Too many requests. Please wait a moment and try again.',
  })
}

/** Stricter limit for login / signup / invite checks */
const authPublicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
})

/** Contact form submissions */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonHandler,
})

module.exports = { authPublicLimiter, contactLimiter }
