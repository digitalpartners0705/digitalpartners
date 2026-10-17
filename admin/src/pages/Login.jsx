import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { getToken, loginAdmin } from '../services/api'

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (getToken()) return <Navigate to="/" replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await loginAdmin({ email: email.trim(), password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not log in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
            DV
          </span>
          <div>
            <p className="text-sm font-semibold text-brand-600">Digital Vidhya</p>
            <p className="text-xs font-medium text-slate-500">Admin panel</p>
          </div>
        </div>
        <h1 className="mt-5 text-2xl font-bold">Admin login</h1>
        <p className="mt-1 text-sm text-slate-500">Manage orders, commissions, courses, and training.</p>
        {error ? <p className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        <label className="mt-5 block text-sm font-medium">
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className={fieldClass} required />
        </label>
        <label className="mt-4 block text-sm font-medium">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={fieldClass}
            required
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="mt-6 w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}

export default Login
