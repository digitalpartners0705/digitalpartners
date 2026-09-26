const { query } = require('../config/db')
const storage = require('./storage')

const COURSE_SELECT = `
  SELECT
    c.id,
    c.slug,
    c.title,
    c.instructor,
    c.description,
    c.accent,
    c.requires_upgrade,
    c.status,
    c.hours,
    c.sort_order,
    c.thumbnail_key,
    c.created_at,
    c.updated_at,
    cat.name AS category_name,
    p.name AS package_name,
    (SELECT COUNT(*)::int FROM lessons l WHERE l.course_id = c.id) AS lesson_count
  FROM courses c
  LEFT JOIN categories cat ON cat.id = c.category_id
  LEFT JOIN packages p ON p.id = c.package_id
`

const formatDuration = (seconds) => {
  const total = Math.max(0, Number(seconds) || 0)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const secs = total % 60
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`
}

const mapLesson = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description || '',
  position: row.position,
  durationSeconds: row.duration_seconds,
  duration: formatDuration(row.duration_seconds),
  hasVideo: Boolean(row.storage_key || row.external_url),
})

const mapCourse = async (row, { includeAdmin = false } = {}) => {
  const course = {
    id: row.slug,
    courseId: row.id,
    title: row.title,
    instructor: row.instructor,
    description: row.description,
    tag: row.category_name || 'Others',
    accent: row.accent,
    lessons: Number(row.lesson_count) || 0,
    hours: Number(row.hours) || 0,
    progress: 0,
    requiresUpgrade: row.requires_upgrade,
    packageName: row.package_name || null,
    thumbnailUrl: await storage.signedGet(row.thumbnail_key),
    status: row.status,
  }

  if (includeAdmin) {
    course.thumbnailKey = row.thumbnail_key
    course.sortOrder = row.sort_order
  }

  return course
}

const listCourses = async ({ publishedOnly = false } = {}) => {
  const result = await query(
    `${COURSE_SELECT}
     WHERE ($1::boolean IS NOT TRUE OR c.status = 'published')
     ORDER BY c.sort_order ASC, c.created_at ASC`,
    [publishedOnly]
  )
  return Promise.all(result.rows.map((row) => mapCourse(row, { includeAdmin: !publishedOnly })))
}

const getCourseBySlug = async (slug, { publishedOnly = false } = {}) => {
  const result = await query(
    `${COURSE_SELECT}
     WHERE c.slug = $1 AND ($2::boolean IS NOT TRUE OR c.status = 'published')`,
    [slug, publishedOnly]
  )
  return result.rows[0] || null
}

const getCourseById = async (id) => {
  const result = await query(`${COURSE_SELECT} WHERE c.id = $1`, [id])
  return result.rows[0] || null
}

const listLessons = async (courseId) => {
  const result = await query(
    `SELECT id, title, description, position, duration_seconds, storage_key, external_url
     FROM lessons
     WHERE course_id = $1
     ORDER BY position ASC, created_at ASC`,
    [courseId]
  )
  return result.rows
}

const canViewCourse = (course, user) => !course.requiresUpgrade || course.title === user?.knowledgePackage

const listCategories = async () => {
  const result = await query('SELECT id, name FROM categories ORDER BY sort_order ASC, name ASC')
  return result.rows
}

const listPackages = async () => {
  const result = await query(
    'SELECT id, slug, name, summary FROM packages ORDER BY sort_order ASC, name ASC'
  )
  return result.rows.map((row) => ({
    id: row.slug,
    packageId: row.id,
    name: row.name,
    summary: row.summary,
  }))
}

module.exports = {
  formatDuration,
  mapLesson,
  mapCourse,
  listCourses,
  getCourseBySlug,
  getCourseById,
  listLessons,
  canViewCourse,
  listCategories,
  listPackages,
}
