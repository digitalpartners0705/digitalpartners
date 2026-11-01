/**
 * When true, logged-in course library / player shows Coming soon.
 * Public marketing pages are unchanged. Flip with VITE_COURSES_COMING_SOON=false
 * once real lesson videos are published.
 */
export const COURSES_COMING_SOON =
  String(import.meta.env.VITE_COURSES_COMING_SOON ?? 'true').toLowerCase() !== 'false'

export const canViewCourse = (course, user) => {
  const userPackage = String(user?.knowledgePackage || '').trim()
  const coursePackage = String(course?.packageName || '').trim()
  if (!userPackage || !coursePackage) return false
  return coursePackage === userPackage
}

export const getEnrolledCourses = (courses, user) => {
  if (!user?.knowledgePackage) return []
  return (courses || []).filter((course) => canViewCourse(course, user))
}
