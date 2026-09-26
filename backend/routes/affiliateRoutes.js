const express = require('express')
const { leaderboard } = require('../controllers/affiliateController')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/leaderboard', requireAuth, leaderboard)

module.exports = router
