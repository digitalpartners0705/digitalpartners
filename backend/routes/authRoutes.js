const os = require('os')
const express = require('express')
const multer = require('multer')
const {
  signup,
  login,
  me,
  purchasePackage,
  updateAvatar,
  updateProfile,
  changePassword,
  verifyInviteCode,
} = require('../controllers/authController')
const { requireAuth } = require('../middleware/auth')
const { authPublicLimiter } = require('../middleware/rateLimit')

const router = express.Router()
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 5 * 1024 * 1024 },
})

router.post('/signup', authPublicLimiter, signup)
router.post('/verify-invite', authPublicLimiter, verifyInviteCode)
router.get('/verify-invite', authPublicLimiter, verifyInviteCode)
router.post('/login', authPublicLimiter, login)
router.get('/me', requireAuth, me)
router.post('/purchase', requireAuth, purchasePackage)
router.post('/avatar', requireAuth, upload.single('file'), updateAvatar)
router.patch('/profile', requireAuth, updateProfile)
router.post('/password', requireAuth, changePassword)

module.exports = router
