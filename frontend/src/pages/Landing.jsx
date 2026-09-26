import { Navigate } from 'react-router-dom'
import AuthModal from '../components/AuthModal'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/AuthContext'
import { getStoredToken } from '../services/api'
import Home from './Home'

function Landing() {
  const { user, authOpen, authMode, setAuthMode, closeAuth, handleAuthSuccess } = useAuth()

  if (user || getStoredToken()) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      <Navbar />
      <Home />
      <AuthModal
        isOpen={authOpen}
        mode={authMode}
        onModeChange={setAuthMode}
        onClose={closeAuth}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}

export default Landing
