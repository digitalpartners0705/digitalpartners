const fs = require('fs')
const os = require('os')
const express = require('express')
const multer = require('multer')
const {
  getMeta,
  listCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  uploadFile,
  createLesson,
  updateLesson,
  deleteLesson,
  reorderLessons,
} = require('../controllers/adminCourseController')
const {
  listDays,
  getDay,
  createDay,
  updateDay,
  deleteDay,
  uploadTrainingVideo,
  createVideo,
  updateVideo,
  deleteVideo,
  reorderVideos,
} = require('../controllers/adminTrainingController')
const {
  listOrders,
  getOrder,
  getOrderMeta,
  getOrderStats,
  createManualOrder,
  recordPayment,
  updateOrder,
  listOrderRequests,
  getOrderRequestStats,
  approveOrderRequest,
  rejectOrderRequest,
} = require('../controllers/adminOrderController')
const {
  listCommissions,
  getCommissionStats,
  getCommissionMeta,
  getCommission,
  getEarnerCommissions,
  reverseCommission,
  createAdjustment,
} = require('../controllers/adminCommissionController')
const {
  listContactRequests,
  updateContactRequest,
  deleteContactRequest,
} = require('../controllers/adminContactController')
const {
  listAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} = require('../controllers/adminAnnouncementController')
const {
  listMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} = require('../controllers/adminAchievementController')
const { listKycSubmissions } = require('../controllers/adminKycController')
const { requireAdmin } = require('../middleware/auth')

const router = express.Router()
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 1024 * 1024 * 1024 },
})

const receiveFile = (req, res, next) => {
  upload.single('file')(req, res, (error) => {
    if (!error) return next()
    if (req.file?.path) fs.unlink(req.file.path, () => {})
    const message = error.code === 'LIMIT_FILE_SIZE' ? 'File must be under 1 GB' : 'Could not read the file'
    return res.status(400).json({ message })
  })
}

router.use(requireAdmin)
router.get('/meta', getMeta)
router.get('/order-requests/stats', getOrderRequestStats)
router.get('/order-requests', listOrderRequests)
router.post('/order-requests/:id/approve', approveOrderRequest)
router.post('/order-requests/:id/reject', rejectOrderRequest)
router.get('/orders', listOrders)
router.post('/orders', createManualOrder)
router.get('/orders/meta', getOrderMeta)
router.get('/orders/stats', getOrderStats)
router.get('/orders/:id', getOrder)
router.patch('/orders/:id', updateOrder)
router.post('/orders/:id/payment', recordPayment)
router.get('/commissions', listCommissions)
router.post('/commissions', createAdjustment)
router.get('/commissions/meta', getCommissionMeta)
router.get('/commissions/stats', getCommissionStats)
router.get('/commissions/earners/:userId', getEarnerCommissions)
router.get('/commissions/:id', getCommission)
router.post('/commissions/:id/reverse', reverseCommission)
router.get('/trainings', listDays)
router.post('/trainings', createDay)
router.get('/trainings/:id', getDay)
router.patch('/trainings/:id', updateDay)
router.delete('/trainings/:id', deleteDay)
router.post('/trainings/:id/upload', receiveFile, uploadTrainingVideo)
router.post('/trainings/:id/videos', createVideo)
router.post('/trainings/:id/videos/reorder', reorderVideos)
router.patch('/training-videos/:id', updateVideo)
router.delete('/training-videos/:id', deleteVideo)
router.get('/courses', listCourses)
router.post('/courses', createCourse)
router.post('/uploads', receiveFile, uploadFile)
router.get('/courses/:id', getCourse)
router.patch('/courses/:id', updateCourse)
router.delete('/courses/:id', deleteCourse)
router.post('/courses/:id/lessons', createLesson)
router.post('/courses/:id/lessons/reorder', reorderLessons)
router.patch('/lessons/:id', updateLesson)
router.delete('/lessons/:id', deleteLesson)

router.get('/contact-requests', listContactRequests)
router.patch('/contact-requests/:id', updateContactRequest)
router.delete('/contact-requests/:id', deleteContactRequest)

router.get('/announcements', listAnnouncements)
router.post('/announcements', createAnnouncement)
router.patch('/announcements/:id', updateAnnouncement)
router.delete('/announcements/:id', deleteAnnouncement)

router.get('/achievements', listMilestones)
router.post('/achievements', createMilestone)
router.patch('/achievements/:id', updateMilestone)
router.delete('/achievements/:id', deleteMilestone)

router.get('/kyc', listKycSubmissions)

module.exports = router
