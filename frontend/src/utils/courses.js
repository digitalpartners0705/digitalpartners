export const canViewCourse = (course, user) =>
  !course?.requiresUpgrade || course.title === user?.knowledgePackage

export const getEnrolledCourses = (courses, user) => {
  const accessible = courses.filter((course) => canViewCourse(course, user))
  if (!user?.knowledgePackage) return accessible

  return [...accessible].sort((a, b) => {
    if (a.title === user.knowledgePackage) return -1
    if (b.title === user.knowledgePackage) return 1
    return 0
  })
}
