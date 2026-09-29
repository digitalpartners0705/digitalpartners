import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearSession, getCurrentUser, getStoredToken, getStoredUser } from '../services/api'
import { captureReferralFromSearch, clearReferral, readReferral } from '../utils/referral'

const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(getStoredUser)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [signupDefaults, setSignupDefaults] = useState({})

  useEffect(() => {
    captureReferralFromSearch()
  }, [])

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

  const openAuth = useCallback((mode, defaults = {}) => {
    const stored = readReferral() || {}
    setAuthMode(mode)
    setSignupDefaults({
      knowledgePackage: defaults.knowledgePackage || stored.package || '',
      country: defaults.country || stored.country || '',
      referralCode: defaults.referralCode || stored.ref || '',
    })
    setAuthOpen(true)
  }, [])

  const closeAuth = useCallback(() => setAuthOpen(false), [])

  const handleAuthSuccess = useCallback(
    (nextUser) => {
      clearReferral()
      setUser(nextUser)
      setAuthOpen(false)
      setSignupDefaults({})
      navigate('/dashboard', { replace: true })
    },
    [navigate],
  )

  const updateUser = useCallback((nextUser) => setUser(nextUser), [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    navigate('/')
  }, [navigate])

  return (
    <AuthContext.Provider
      value={{
        user,
        authOpen,
        authMode,
        signupDefaults,
        setAuthMode,
        openAuth,
        closeAuth,
        handleAuthSuccess,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export { AuthProvider, useAuth }
