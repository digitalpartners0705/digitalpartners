import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CheckoutModal from '../components/CheckoutModal'
import { getCheckoutPackage } from '../data/checkoutPackages'
import { clearSession, getCurrentUser, getStoredToken, getStoredUser, purchasePackage } from '../services/api'
import { captureReferralFromSearch, clearReferral, readReferral } from '../utils/referral'

const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const navigate = useNavigate()
  const [user, setUser] = useState(getStoredUser)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [signupDefaults, setSignupDefaults] = useState({})
  const [pendingCheckout, setPendingCheckout] = useState(null)
  const [paying, setPaying] = useState(false)
  const [checkoutError, setCheckoutError] = useState('')

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
    (nextUser, options = {}) => {
      clearReferral()
      setUser(nextUser)
      setAuthOpen(false)
      setSignupDefaults({})
      setCheckoutError('')

      const checkoutPkg = getCheckoutPackage(options.pendingPackage)
      if (checkoutPkg && !nextUser?.knowledgePackage) {
        setPendingCheckout(checkoutPkg)
      } else {
        setPendingCheckout(null)
      }

      navigate('/dashboard', { replace: true })
    },
    [navigate],
  )

  const closeCheckout = useCallback(() => {
    if (paying) return
    setPendingCheckout(null)
    setCheckoutError('')
  }, [paying])

  const payPendingCheckout = useCallback(async () => {
    if (!pendingCheckout) return
    setPaying(true)
    setCheckoutError('')
    try {
      const data = await purchasePackage(pendingCheckout.name)
      setUser(data.user)
      setPendingCheckout(null)
    } catch (error) {
      setCheckoutError(error.response?.data?.message || 'Could not complete the purchase')
    } finally {
      setPaying(false)
    }
  }, [pendingCheckout])

  const updateUser = useCallback((nextUser) => setUser(nextUser), [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    setPendingCheckout(null)
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
      {pendingCheckout ? (
        <>
          <CheckoutModal
            pkg={pendingCheckout}
            paying={paying}
            closeLabel="Pay later"
            onClose={closeCheckout}
            onPay={payPendingCheckout}
          />
          {checkoutError ? (
            <p className="fixed bottom-6 left-1/2 z-[70] w-[min(24rem,calc(100%-2rem))] -translate-x-1/2 rounded-xl border border-red-300/50 bg-red-50 px-4 py-3 text-center text-sm text-red-700 shadow-lg">
              {checkoutError}
            </p>
          ) : null}
        </>
      ) : null}
    </AuthContext.Provider>
  )
}

const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}

export { AuthProvider, useAuth }
