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

module.exports = { getCatalog, getPackageCourses, getCourse, playLesson }
