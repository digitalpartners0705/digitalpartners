const express = require('express')
const { leaderboard } = require('../controllers/affiliateController')
const { listPublished, playVideo } = require('../controllers/adminTrainingController')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/leaderboard', requireAuth, leaderboard)
router.get('/trainings', requireAuth, listPublished)
router.get('/trainings/:dayId/videos/:videoId/play', requireAuth, playVideo)

module.exports = router
