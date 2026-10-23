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

export const getLearningStats = async () => {
  const response = await api.get('/api/courses/learning-stats')
  return response.data
}

export const recordWatchTime = (slug, lessonId, seconds, { keepalive = false } = {}) => {
  const body = { seconds }
  if (!keepalive) {
    return api.post(`/api/courses/${slug}/lessons/${lessonId}/watch`, body)
  }

  const token = localStorage.getItem('de_token')
  const base = import.meta.env.VITE_API_URL || ''
  return fetch(`${base}/api/courses/${slug}/lessons/${lessonId}/watch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    keepalive: true,
  })
}
