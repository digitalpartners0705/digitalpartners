const { query } = require('../config/db')
const catalog = require('../services/catalog')

const getPackageCourses = async (req, res) => {
  try {
    const packageSlug = String(req.params.packageSlug || '').trim().toLowerCase()
    const packages = await catalog.listPackages()
    const matched = packages.find((item) => item.id === packageSlug || item.name.toLowerCase() === packageSlug)
    if (!matched) return res.status(404).json({ message: 'Package not found' })

    const courses = await catalog.listCourses({ publishedOnly: true })
    const packageCourses = courses
      .filter((course) => course.packageName === matched.name)
      .map((course) => ({
        id: course.id,
        title: course.title,
        instructor: course.instructor,
        description: course.description,
        tag: course.tag,
        hours: course.hours,
        lessons: course.lessons,
        accent: course.accent,
        packageName: course.packageName,
        thumbnailUrl: course.thumbnailUrl || null,
      }))

    return res.json({
      package: { id: matched.id, name: matched.name, summary: matched.summary },
      courses: packageCourses,
    })
  } catch (error) {
    console.error('Package courses error:', error.message)
    return res.status(500).json({ message: 'Could not load package courses' })
  }
}

const getCatalog = async (req, res) => {
  try {
    const [courses, categories, packages] = await Promise.all([
      catalog.listCourses({ publishedOnly: true }),
      catalog.listCategories(),
      catalog.listPackages(),
    ])

    const usedCategories = new Set(courses.map((course) => course.tag).filter(Boolean))
    const categoryNames = categories.map((item) => item.name).filter((name) => usedCategories.has(name))

    return res.json({
      categories: ['All', ...categoryNames],
      packages,
      courses,
    })
  } catch (error) {
    console.error('Catalog error:', error.message)
    return res.status(500).json({ message: 'Could not load courses' })
  }
}

const getCourse = async (req, res) => {
  try {
    const row = await catalog.getCourseBySlug(req.params.slug, { publishedOnly: true })
    if (!row) return res.status(404).json({ message: 'Course not found' })

    const course = await catalog.mapCourse(row)
    const lessons = (await catalog.listLessons(row.id)).map(catalog.mapLesson)
    return res.json({ course, lessons })
  } catch (error) {
    console.error('Course error:', error.message)
    return res.status(500).json({ message: 'Could not load this course' })
  }
}

const MAX_WATCH_REPORT_SECONDS = 20

const getLearningStats = async (req, res) => {
  try {
    const result = await query(
      `SELECT COALESCE(SUM(watched_seconds), 0)::int AS seconds
       FROM lesson_watch_time
       WHERE user_id = $1
         AND watched_on >= date_trunc('week', (NOW() AT TIME ZONE 'Asia/Kolkata'))::date
         AND watched_on <= (NOW() AT TIME ZONE 'Asia/Kolkata')::date`,
      [req.user.id],
    )
    const seconds = result.rows[0]?.seconds || 0
    const hours = Math.round((seconds / 3600) * 10) / 10
    return res.json({
      secondsThisWeek: seconds,
      hoursThisWeek: seconds > 0 && hours === 0 ? 0.1 : hours,
    })
  } catch (error) {
    console.error('Learning stats error:', error.message)
    return res.status(500).json({ message: 'Could not load learning time' })
  }
}

const recordWatchTime = async (req, res) => {
  try {
    const seconds = Math.round(Number(req.body.seconds))
    if (!Number.isFinite(seconds) || seconds <= 0) {
      return res.status(400).json({ message: 'Watch time is required' })
    }
    const reported = Math.min(seconds, MAX_WATCH_REPORT_SECONDS)

    const row = await catalog.getCourseBySlug(req.params.slug, { publishedOnly: true })
    if (!row) return res.status(404).json({ message: 'Course not found' })

    const course = await catalog.mapCourse(row)
    const viewer = await query('SELECT knowledge_package FROM users WHERE id = $1', [req.user.id])
    const user = { knowledgePackage: viewer.rows[0]?.knowledge_package }
    if (!catalog.canViewCourse(course, user)) {
      return res.status(403).json({ message: 'Buy this package to watch this course' })
    }

    const lessons = await catalog.listLessons(row.id)
    const lesson = lessons.find((item) => item.id === req.params.lessonId)
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' })

    const durationCap = Number(lesson.duration_seconds) > 0 ? Number(lesson.duration_seconds) : 8 * 60 * 60
    await query(
      `INSERT INTO lesson_watch_time (user_id, lesson_id, watched_on, watched_seconds)
       VALUES ($1, $2, (NOW() AT TIME ZONE 'Asia/Kolkata')::date, $3)
       ON CONFLICT (user_id, lesson_id, watched_on)
       DO UPDATE SET
         watched_seconds = LEAST(lesson_watch_time.watched_seconds + EXCLUDED.watched_seconds, $4),
         updated_at = NOW()`,
      [req.user.id, lesson.id, reported, durationCap],
    )

    return res.json({ saved: true })
  } catch (error) {
    console.error('Watch time error:', error.message)
    return res.status(500).json({ message: 'Could not save watch time' })
  }
}

const playLesson = async (req, res) => {
  try {
    const row = await catalog.getCourseBySlug(req.params.slug, { publishedOnly: true })
    if (!row) return res.status(404).json({ message: 'Course not found' })

    const course = await catalog.mapCourse(row)
    const viewer = await query('SELECT knowledge_package FROM users WHERE id = $1', [req.user.id])
    const user = { knowledgePackage: viewer.rows[0]?.knowledge_package }
    if (!catalog.canViewCourse(course, user)) {
      return res.status(403).json({ message: 'Buy this package to watch this course' })
    }

    const lessons = await catalog.listLessons(row.id)
    const lesson = lessons.find((item) => item.id === req.params.lessonId)
    if (!lesson) return res.status(404).json({ message: 'Lesson not found' })

    if (lesson.storage_key) {
      const url = await require('../services/storage').signedGet(lesson.storage_key, 3600)
      if (!url) {
        return res.status(503).json({ message: 'Video storage is not configured yet' })
      }
      return res.json({ url, expiresIn: 3600 })
    }

    if (lesson.external_url) {
      return res.json({ url: lesson.external_url, expiresIn: null })
    }

    return res.status(404).json({ message: 'This lesson has no video yet' })
  } catch (error) {
    console.error('Play error:', error.message)
    return res.status(500).json({ message: 'Could not start this video' })
  }
}

module.exports = { getCatalog, getPackageCourses, getCourse, playLesson, getLearningStats, recordWatchTime }
