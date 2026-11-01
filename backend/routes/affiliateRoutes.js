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
const { listPublishedAnnouncements } = require('../controllers/adminAnnouncementController')
const { listPublishedMilestones } = require('../controllers/adminAchievementController')
const { requireSubscription } = require('../middleware/auth')

const router = express.Router()

router.get('/announcements', requireSubscription, listPublishedAnnouncements)
router.get('/achievements', requireSubscription, listPublishedMilestones)
router.get('/leaderboard', requireSubscription, leaderboard)
router.get('/links', requireSubscription, linkKit)
router.get('/earnings', requireSubscription, myEarnings)
router.get('/leads', requireSubscription, myLeads)
router.get('/ref-info', requireSubscription, myRefInfo)
router.get('/kyc', requireSubscription, getKyc)
router.post('/kyc', requireSubscription, submitKyc)
router.patch('/kyc/upi', requireSubscription, updateKycUpi)
router.get('/trainings', requireSubscription, listPublished)
router.get('/trainings/:dayId/videos/:videoId/play', requireSubscription, playVideo)

module.exports = router
