const express = require('express')
const { getCatalog, getCourse, playLesson } = require('../controllers/courseController')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.get('/', requireAuth, getCatalog)
router.get('/:slug', requireAuth, getCourse)
router.get('/:slug/lessons/:lessonId/play', requireAuth, playLesson)

module.exports = router
