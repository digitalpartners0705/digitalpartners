const express = require('express')
const {
  leaderboard,
  linkKit,
  myEarnings,
  myLeads,
  myRefInfo,
  getKyc,
  submitKyc,
  updateKycUpi,
} = require('../controllers/affiliateController')
const { listPublished, playVideo } = require('../controllers/adminTrainingController')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/leaderboard', requireAuth, leaderboard)
router.get('/links', requireAuth, linkKit)
router.get('/earnings', requireAuth, myEarnings)
router.get('/leads', requireAuth, myLeads)
router.get('/ref-info', requireAuth, myRefInfo)
router.get('/kyc', requireAuth, getKyc)
router.post('/kyc', requireAuth, submitKyc)
router.patch('/kyc/upi', requireAuth, updateKycUpi)
router.get('/trainings', requireAuth, listPublished)
router.get('/trainings/:dayId/videos/:videoId/play', requireAuth, playVideo)

module.exports = router
