import { Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import AuthModal from '../components/AuthModal'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getStoredToken } from '../services/api'
import { captureReferralFromSearch } from '../utils/referral'
import { hasSubscription } from '../utils/subscription'
import Home from './Home'

function Landing() {
  const { user, authOpen, authMode, signupDefaults, setAuthMode, closeAuth, handleAuthSuccess } = useAuth()

  useEffect(() => {
    captureReferralFromSearch()
  }, [])

  if (user || getStoredToken()) {
    return <Navigate to={user && !hasSubscription(user) ? '/dashboard/upgrade' : '/dashboard'} replace />
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      <Navbar />
      <Home />
      <AuthModal
        isOpen={authOpen}
        mode={authMode}
        signupDefaults={signupDefaults}
        onModeChange={setAuthMode}
        onClose={closeAuth}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}

export default Landing
