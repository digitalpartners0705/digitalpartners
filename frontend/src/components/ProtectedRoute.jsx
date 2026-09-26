import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getStoredToken } from '../services/api'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  const hasSession = Boolean(user || getStoredToken())

  if (!hasSession) return <Navigate to="/" replace />
  return children
}

export default ProtectedRoute
