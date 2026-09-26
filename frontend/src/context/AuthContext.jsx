import { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearSession, getCurrentUser, getStoredToken, getStoredUser } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(getStoredUser)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')

  useEffect(() => {
    const token = getStoredToken()
    if (!token) {
      clearSession()
      setUser(null)
      return undefined
    }

    getCurrentUser()
      .then(setUser)
      .catch(() => {
        clearSession()
        setUser(null)
      })
  }, [])

  const openAuth = (mode) => {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  const closeAuth = () => setAuthOpen(false)

  const handleAuthSuccess = (nextUser) => {
    setUser(nextUser)
    setAuthOpen(false)
    navigate('/dashboard', { replace: true })
  }

  const updateUser = (nextUser) => setUser(nextUser)

  const logout = () => {
    clearSession()
    setUser(null)
    navigate('/')
  }

  return (
    <AuthContext.Provider
      value={{ user, authOpen, authMode, setAuthMode, openAuth, closeAuth, handleAuthSuccess, updateUser, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
