import { useState } from 'react'
import { loginUser } from '../services/api'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100'

function LoginForm({ onSwitchToSignup, onSuccess }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '', form: '' }))
  }

  const validate = () => {
    const next = {}
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!EMAIL_PATTERN.test(form.email.trim())) next.email = 'Enter a valid email address'
    if (!form.password) next.password = 'Password is required'
    return next
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const data = await loginUser({
        email: form.email.trim(),
        password: form.password,
      })
      onSuccess(data.user)
    } catch (error) {
      setErrors({ form: error.response?.data?.message || 'Could not log in. Please try again' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-brand-600">Welcome back</p>
        <h2 id="auth-modal-title" className="mt-1 text-2xl font-bold text-slate-900">
          Log in to Digital Expert
        </h2>
        <p className="mt-1 text-sm text-slate-500">Continue learning from where you left off.</p>
      </div>

      {errors.form ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{errors.form}</p>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={form.email}
          onChange={updateField}
          className={fieldClass}
        />
        {errors.email ? <p className="mt-1 text-xs text-red-600">{errors.email}</p> : null}
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Password</span>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={form.password}
            onChange={updateField}
            className={`${fieldClass} pr-11`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-brand-600"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        {errors.password ? <p className="mt-1 text-xs text-red-600">{errors.password}</p> : null}
      </label>

      <div className="flex justify-end">
        <button type="button" className="text-sm font-medium text-brand-600 hover:text-brand-700">
          Forgot Password?
        </button>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting ? 'Logging in...' : 'Login'}
      </button>

      <p className="text-center text-sm text-slate-500">
        Don&apos;t have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          Sign Up
        </button>
      </p>
    </form>
  )
}

export default LoginForm
