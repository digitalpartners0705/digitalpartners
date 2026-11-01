import { Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import AuthModal from '../components/AuthModal'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getStoredToken } from '../services/api'
import { captureReferralFromSearch, packageNameFromSlug } from '../utils/referral'
import { hasSubscription } from '../utils/subscription'
import Home from './Home'

function Landing() {
  const { user, authOpen, authMode, signupDefaults, openAuth, setAuthMode, closeAuth, handleAuthSuccess } =
    useAuth()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref') || ''
    const packageSlug = params.get('package') || ''
    const country = params.get('country') || ''
    const captured = captureReferralFromSearch()

    // Referral / package links should open registration immediately
    if (!ref && !packageSlug) return
    if (getStoredToken()) return

    openAuth('signup', {
      knowledgePackage: packageNameFromSlug(captured?.package || packageSlug) || '',
      country: captured?.country || country || '',
      referralCode: captured?.ref || ref || '',
    })
  }, [openAuth])

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
