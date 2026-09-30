import api from './api'

export const getCatalog = async () => {
  const response = await api.get('/api/courses')
  return response.data
}

export const getPackageCourses = async (packageSlug) => {
  const response = await api.get(`/api/courses/public/package/${packageSlug}`)
  return response.data
}

export const getCourse = async (slug) => {
  const response = await api.get(`/api/courses/${slug}`)
  return response.data
}

export const getPlayUrl = async (slug, lessonId) => {
  const response = await api.get(`/api/courses/${slug}/lessons/${lessonId}/play`)
  return response.data
}
