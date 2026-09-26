import axios from 'axios'

const TOKEN_KEY = 'de_admin_token'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const getToken = () => localStorage.getItem(TOKEN_KEY)

export const saveSession = (token) => localStorage.setItem(TOKEN_KEY, token)

export const clearSession = () => localStorage.removeItem(TOKEN_KEY)

export const loginAdmin = async (payload) => {
  const response = await api.post('/api/auth/login', payload)
  if (response.data.user?.role !== 'admin') {
    const error = new Error('This account is not an admin')
    error.response = { data: { message: 'This account is not an admin' } }
    throw error
  }
  saveSession(response.data.token)
  return response.data.user
}

export default api
