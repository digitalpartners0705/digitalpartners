const os = require('os')
const express = require('express')
const multer = require('multer')
const { signup, login, me, purchasePackage, updateAvatar, changePassword } = require('../controllers/authController')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 5 * 1024 * 1024 },
})

router.post('/signup', signup)
router.post('/login', login)
router.get('/me', requireAuth, me)
router.post('/purchase', requireAuth, purchasePackage)
router.post('/avatar', requireAuth, upload.single('file'), updateAvatar)
router.post('/password', requireAuth, changePassword)

module.exports = router
