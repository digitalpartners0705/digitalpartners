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

module.exports = router
