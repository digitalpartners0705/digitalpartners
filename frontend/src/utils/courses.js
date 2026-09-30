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
