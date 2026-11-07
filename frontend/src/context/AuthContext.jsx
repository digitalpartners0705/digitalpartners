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
  const [receivedOrder, setReceivedOrder] = useState(null)
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

  useEffect(() => {
    const dropLocalSession = () => {
      clearSession()
      setUser(null)
      setPendingCheckout(null)
      setReceivedOrder(null)
    }

    const refreshSession = () => {
      if (!getStoredToken()) {
        setUser(null)
        return
      }
      getCurrentUser()
        .then(setUser)
        .catch((error) => {
          const disabled =
            error.response?.data?.code === 'ACCOUNT_DISABLED' ||
            (error.response?.status === 403 &&
              /deactivated/i.test(String(error.response?.data?.message || '')))
          if (disabled || error.response?.status === 401) {
            dropLocalSession()
          }
        })
    }

    const refreshOnFocus = () => refreshSession()
    const onDisabled = () => dropLocalSession()

    window.addEventListener('focus', refreshOnFocus)
    window.addEventListener('de-account-disabled', onDisabled)
    const timer = window.setInterval(refreshSession, 30000)

    return () => {
      window.removeEventListener('focus', refreshOnFocus)
      window.removeEventListener('de-account-disabled', onDisabled)
      window.clearInterval(timer)
    }
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

      navigate(nextUser?.knowledgePackage ? '/dashboard' : '/dashboard/upgrade', { replace: true })
    },
    [navigate],
  )

  const closeCheckout = useCallback(() => {
    if (paying) return
    setPendingCheckout(null)
    setReceivedOrder(null)
    setCheckoutError('')
  }, [paying])

  const payPendingCheckout = useCallback(async () => {
    if (!pendingCheckout || receivedOrder) return
    setPaying(true)
    setCheckoutError('')
    try {
      const data = await purchasePackage(pendingCheckout.name)
      setUser(data.user)
      setReceivedOrder({
        orderNumber: data.order?.orderNumber,
        packageName: data.order?.packageName || pendingCheckout.name,
      })
    } catch (error) {
      setCheckoutError(error.response?.data?.message || 'Could not place the order')
    } finally {
      setPaying(false)
    }
  }, [pendingCheckout, receivedOrder])

  const updateUser = useCallback((nextUser) => setUser(nextUser), [])

  const logout = useCallback(() => {
    clearSession()
    setUser(null)
    setPendingCheckout(null)
    setReceivedOrder(null)
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
            error={checkoutError}
            received={receivedOrder}
            applyPromo={Boolean(user?.referredBy || user?.promoCode)}
            onClose={closeCheckout}
            onPay={payPendingCheckout}
          />
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
