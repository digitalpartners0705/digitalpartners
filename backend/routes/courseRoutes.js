const express = require('express')
const { getCatalog, getPackageCourses, getCourse, playLesson, getLearningStats, recordWatchTime } = require('../controllers/courseController')
const { requireSubscription } = require('../middleware/auth')

const router = express.Router()

router.get('/public/package/:packageSlug', getPackageCourses)
router.get('/', requireSubscription, getCatalog)
router.get('/learning-stats', requireSubscription, getLearningStats)
router.post('/:slug/lessons/:lessonId/watch', requireSubscription, recordWatchTime)
router.get('/:slug', requireSubscription, getCourse)
router.get('/:slug/lessons/:lessonId/play', requireSubscription, playLesson)

module.exports = router
