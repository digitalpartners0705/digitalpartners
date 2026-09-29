import { useEffect } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getStoredToken } from '../services/api'
import { captureReferralFromSearch, packageNameFromSlug } from '../utils/referral'

function Join() {
  const [params] = useSearchParams()
  const { openAuth } = useAuth()
  const loggedIn = Boolean(getStoredToken())
  const ref = params.get('ref') || ''
  const packageSlug = params.get('package') || ''
  const country = params.get('country') || ''

  useEffect(() => {
    if (loggedIn) return
    const captured = captureReferralFromSearch(`?ref=${encodeURIComponent(ref)}&package=${encodeURIComponent(packageSlug)}&country=${encodeURIComponent(country)}`)
    openAuth('signup', {
      knowledgePackage: packageNameFromSlug(captured?.package || packageSlug) || '',
      country: captured?.country || country || '',
      referralCode: captured?.ref || ref || '',
    })
  }, [loggedIn, openAuth, ref, packageSlug, country])

  if (loggedIn) {
    return <Navigate to="/dashboard" replace />
  }

  return <Navigate to="/" replace />
}

export default Join
