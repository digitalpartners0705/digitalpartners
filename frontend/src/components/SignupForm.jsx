import { useState } from 'react'
import { signupUser } from '../services/api'
import {
  COUNTRIES,
  COUNTRY_NAMES,
  KNOWLEDGE_PACKAGES,
  VALID_COUPON_CODES,
  VALID_PROMO_CODES,
} from '../data/signupOptions'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const fieldClass =
  'mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-100'

const selectClass = `${fieldClass} appearance-none`

function SignupForm({ onSwitchToLogin, onSuccess }) {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    phone: '',
    country: '',
    state: '',
    knowledgePackage: '',
    promoCode: '',
    couponCode: '',
    password: '',
    hasGst: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [promoStatus, setPromoStatus] = useState('')
  const [couponStatus, setCouponStatus] = useState('')

  const states = form.country ? COUNTRIES[form.country] || [] : []

  const updateField = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value }
      if (name === 'country') next.state = ''
      return next
    })
    setErrors((prev) => ({ ...prev, [name]: '', form: '' }))
    if (name === 'promoCode') setPromoStatus('')
    if (name === 'couponCode') setCouponStatus('')
  }

  const validateStepOne = () => {
    const next = {}
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!EMAIL_PATTERN.test(form.email.trim())) next.email = 'Enter a valid email address'
    if (!form.fullName.trim()) next.fullName = 'Full name is required'
    if (!form.phone.trim()) next.phone = 'Contact number is required'
    if (!form.country) next.country = 'Country is required'
    if (!form.state) next.state = 'State is required'
    return next
  }

  const validateStepTwo = () => {
    const next = {}
    if (!form.knowledgePackage) next.knowledgePackage = 'Please select a knowledge package'
    if (!form.password) next.password = 'Password is required'
    else if (form.password.length < 6) next.password = 'Password must be at least 6 characters'
    return next
  }

  const goNext = (event) => {
    event.preventDefault()
    const nextErrors = validateStepOne()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return
    setStep(2)
  }

  const verifyPromo = () => {
    const code = form.promoCode.trim().toUpperCase()
    if (!code) {
      setPromoStatus('Enter a promo code')
      return
    }
    setPromoStatus(VALID_PROMO_CODES[code] || 'Invalid promo code')
  }

  const applyCoupon = () => {
    const code = form.couponCode.trim().toUpperCase()
    if (!code) {
      setCouponStatus('Enter a coupon code')
      return
    }
    setCouponStatus(VALID_COUPON_CODES[code] || 'Invalid coupon code')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateStepTwo()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      const data = await signupUser({
        email: form.email.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        country: form.country,
        state: form.state,
        knowledgePackage: form.knowledgePackage,
        promoCode: form.promoCode.trim().toUpperCase() || null,
        couponCode: form.couponCode.trim().toUpperCase() || null,
        password: form.password,
        hasGst: form.hasGst,
      })
      onSuccess(data.user)
    } catch (error) {
      setErrors({ form: error.response?.data?.message || 'Could not create account. Please try again' })
    } finally {
      setSubmitting(false)
    }
  }

  const promoValid = Boolean(VALID_PROMO_CODES[form.promoCode.trim().toUpperCase()])
  const couponValid = Boolean(VALID_COUPON_CODES[form.couponCode.trim().toUpperCase()])

  return (
    <form onSubmit={step === 1 ? goNext : handleSubmit} noValidate className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-brand-600">Get started</p>
        <h2 id="auth-modal-title" className="mt-1 text-2xl font-bold text-slate-900">
          Create your account
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {step === 1 ? 'Tell us who you are so we can set up your profile.' : 'Choose a package and secure your account.'}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-brand-600' : 'bg-slate-200'}`} />
        <span className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-brand-600' : 'bg-slate-200'}`} />
      </div>
      <p className="text-xs font-medium text-slate-500">Step {step} of 2</p>

      {errors.form ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{errors.form}</p>
      ) : null}

      {step === 1 ? (
        <>
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
            <span className="text-sm font-medium text-slate-700">Full name</span>
            <input
              type="text"
              name="fullName"
              autoComplete="name"
              placeholder="Your full name"
              value={form.fullName}
              onChange={updateField}
              className={fieldClass}
            />
            {errors.fullName ? <p className="mt-1 text-xs text-red-600">{errors.fullName}</p> : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Contact number</span>
            <input
              type="tel"
              name="phone"
              autoComplete="tel"
              placeholder="Your phone number"
              value={form.phone}
              onChange={updateField}
              className={fieldClass}
            />
            {errors.phone ? <p className="mt-1 text-xs text-red-600">{errors.phone}</p> : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Country</span>
            <select name="country" value={form.country} onChange={updateField} className={selectClass}>
              <option value="">Select country</option>
              {COUNTRY_NAMES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            {errors.country ? <p className="mt-1 text-xs text-red-600">{errors.country}</p> : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">State</span>
            <select
              name="state"
              value={form.state}
              onChange={updateField}
              disabled={!form.country}
              className={`${selectClass} disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <option value="">{form.country ? 'Select state' : 'Select a country first'}</option>
              {states.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            {errors.state ? <p className="mt-1 text-xs text-red-600">{errors.state}</p> : null}
          </label>

          <button
            type="submit"
            className="w-full rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Continue
          </button>
        </>
      ) : (
        <>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Knowledge package</span>
            <select
              name="knowledgePackage"
              value={form.knowledgePackage}
              onChange={updateField}
              className={selectClass}
            >
              <option value="">Choose a package</option>
              {KNOWLEDGE_PACKAGES.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            {errors.knowledgePackage ? (
              <p className="mt-1 text-xs text-red-600">{errors.knowledgePackage}</p>
            ) : null}
          </label>

          <div>
            <span className="text-sm font-medium text-slate-700">Promo code</span>
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                name="promoCode"
                placeholder="Optional"
                value={form.promoCode}
                onChange={updateField}
                className={`${fieldClass} mt-0`}
              />
              <button
                type="button"
                onClick={verifyPromo}
                className="shrink-0 rounded-xl px-4 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50"
              >
                Verify
              </button>
            </div>
            {promoStatus ? (
              <p className={`mt-1 text-xs ${promoValid ? 'text-emerald-600' : 'text-red-600'}`}>{promoStatus}</p>
            ) : null}
          </div>

          <div>
            <span className="text-sm font-medium text-slate-700">Coupon code</span>
            <div className="mt-1.5 flex gap-2">
              <input
                type="text"
                name="couponCode"
                placeholder="Optional"
                value={form.couponCode}
                onChange={updateField}
                className={`${fieldClass} mt-0`}
              />
              <button
                type="button"
                onClick={applyCoupon}
                className="shrink-0 rounded-xl px-4 text-sm font-semibold text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50"
              >
                Apply
              </button>
            </div>
            {couponStatus ? (
              <p className={`mt-1 text-xs ${couponValid ? 'text-emerald-600' : 'text-red-600'}`}>{couponStatus}</p>
            ) : null}
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={form.password}
                onChange={updateField}
                className={`${fieldClass} pr-14`}
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

          <label className="flex items-center gap-3 rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              name="hasGst"
              checked={form.hasGst}
              onChange={updateField}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            I have a GST number
          </label>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </>
      )}

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-brand-600 hover:text-brand-700"
        >
          Login
        </button>
      </p>
    </form>
  )
}

export default SignupForm
