import axios from 'axios'

const TOKEN_KEY = 'de_token'
const USER_KEY = 'de_user'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || ''
    const isAuthCall = url.includes('/api/auth/')
    if (error.response?.status === 401 && !isAuthCall) {
      clearSession()
      if (window.location.pathname !== '/') {
        window.location.assign('/')
      }
    }
    return Promise.reject(error)
  }
)

export const getStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY)

export const saveSession = ({ token, user }) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export const signupUser = async (payload) => {
  const response = await api.post('/api/auth/signup', payload)
  saveSession(response.data)
  return response.data
}

export const loginUser = async (payload) => {
  const response = await api.post('/api/auth/login', payload)
  saveSession(response.data)
  return response.data
}

export const getCurrentUser = async () => {
  const response = await api.get('/api/auth/me')
  localStorage.setItem(USER_KEY, JSON.stringify(response.data.user))
  return response.data.user
}

export const uploadAvatar = async (file) => {
  const body = new FormData()
  body.append('file', file)
  const response = await api.post('/api/auth/avatar', body)
  localStorage.setItem(USER_KEY, JSON.stringify(response.data.user))
  return response.data.user
}

export const changePassword = async (payload) => {
  const response = await api.post('/api/auth/password', payload)
  return response.data
}

export const purchasePackage = async (packageName) => {
  const response = await api.post('/api/auth/purchase', { packageName })
  localStorage.setItem(USER_KEY, JSON.stringify(response.data.user))
  return response.data
}

export const getLeaderboard = async () => {
  const response = await api.get('/api/affiliate/leaderboard')
  return response.data
}

export const getAffiliateEarnings = async () => {
  const response = await api.get('/api/affiliate/earnings')
  return response.data
}

export const getAffiliateLeads = async () => {
  const response = await api.get('/api/affiliate/leads')
  return response.data
}

export const getTrainings = async () => {
  const response = await api.get('/api/affiliate/trainings')
  return response.data
}

export const getTrainingPlayUrl = async (dayId, videoId) => {
  const response = await api.get(`/api/affiliate/trainings/${dayId}/videos/${videoId}/play`)
  return response.data
}

export default api
