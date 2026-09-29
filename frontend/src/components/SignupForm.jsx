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
  'w-full rounded-lg border border-[#d5dbe6] bg-white px-3.5 py-2.5 text-sm text-[#12203a] outline-none transition placeholder:text-slate-400 focus:border-[#e0a31a] focus:ring-2 focus:ring-[#f6d98a]'

const selectClass = `${fieldClass} appearance-none pr-10`

const primaryButtonClass =
  'rounded-xl bg-[#e8a317] py-3 text-sm font-bold text-[#1a1404] shadow-sm transition hover:bg-[#d79610] disabled:cursor-not-allowed disabled:opacity-70'

function Field({ label, error, children }) {
  return (
    <div className="min-w-0">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      {children}
      {error ? <p className="mt-1.5 text-xs leading-4 text-red-600">{error}</p> : null}
    </div>
  )
}

function Chevron() {
  return (
    <svg
      className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

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
    <form onSubmit={step === 1 ? goNext : handleSubmit} noValidate className="space-y-5">
      <div className="pr-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c48a09]">Register</p>
        <h2 id="auth-modal-title" className="mt-1 text-2xl font-bold tracking-tight text-[#10203c]">
          Create your account
        </h2>
        <p className="mt-1.5 text-sm leading-6 text-slate-500">
          {step === 1
            ? 'Tell us who you are so we can set up your profile.'
            : 'Choose a package and secure your account.'}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#10203c] text-xs font-bold text-[#f6c445]">
            1
          </span>
          <span className="text-sm font-medium text-slate-800">Profile</span>
        </div>
        <span className={`h-px flex-1 ${step >= 2 ? 'bg-[#e8a317]' : 'bg-[#e4e9f1]'}`} />
        <div className="flex items-center gap-2">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
              step >= 2 ? 'bg-[#10203c] text-[#f6c445]' : 'bg-[#eef2f7] text-slate-400'
            }`}
          >
            2
          </span>
          <span className={`text-sm font-medium ${step >= 2 ? 'text-slate-800' : 'text-slate-400'}`}>Account</span>
        </div>
      </div>

      {errors.form ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.form}</p>
      ) : null}

      {step === 1 ? (
        <div className="space-y-3.5">
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={updateField}
              className={fieldClass}
            />
          </Field>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Full name" error={errors.fullName}>
              <input
                type="text"
                name="fullName"
                autoComplete="name"
                placeholder="Your full name"
                value={form.fullName}
                onChange={updateField}
                className={fieldClass}
              />
            </Field>

            <Field label="Contact number" error={errors.phone}>
              <input
                type="tel"
                name="phone"
                autoComplete="tel"
                placeholder="Your phone number"
                value={form.phone}
                onChange={updateField}
                className={fieldClass}
              />
            </Field>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <Field label="Country" error={errors.country}>
              <div className="relative">
                <select name="country" value={form.country} onChange={updateField} className={selectClass}>
                  <option value="">Select country</option>
                  {COUNTRY_NAMES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <Chevron />
              </div>
            </Field>

            <Field label="State" error={errors.state}>
              <div className="relative">
                <select
                  name="state"
                  value={form.state}
                  onChange={updateField}
                  disabled={!form.country}
                  className={`${selectClass} disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400`}
                >
                  <option value="">{form.country ? 'Select state' : 'Select a country first'}</option>
                  {states.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                <Chevron />
              </div>
            </Field>
          </div>

          <button type="submit" className={`${primaryButtonClass} w-full`}>
            Continue
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          <Field label="Knowledge package" error={errors.knowledgePackage}>
            <div className="relative">
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
              <Chevron />
            </div>
          </Field>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="min-w-0">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Promo code</span>
              <div className="flex items-stretch gap-2">
                <input
                  type="text"
                  name="promoCode"
                  placeholder="Optional"
                  value={form.promoCode}
                  onChange={updateField}
                  className={fieldClass}
                />
                <button
                  type="button"
                  onClick={verifyPromo}
                  className="shrink-0 rounded-lg border border-[#e8a317] bg-[#fff8e8] px-4 text-sm font-semibold text-[#1a1404] transition hover:bg-[#f6e2ad]"
                >
                  Verify
                </button>
              </div>
              {promoStatus ? (
                <p className={`mt-1.5 text-xs ${promoValid ? 'text-emerald-600' : 'text-red-600'}`}>{promoStatus}</p>
              ) : null}
            </div>

            <div className="min-w-0">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">Coupon code</span>
              <div className="flex items-stretch gap-2">
                <input
                  type="text"
                  name="couponCode"
                  placeholder="Optional"
                  value={form.couponCode}
                  onChange={updateField}
                  className={fieldClass}
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  className="shrink-0 rounded-lg border border-[#e8a317] bg-[#fff8e8] px-4 text-sm font-semibold text-[#1a1404] transition hover:bg-[#f6e2ad]"
                >
                  Apply
                </button>
              </div>
              {couponStatus ? (
                <p className={`mt-1.5 text-xs ${couponValid ? 'text-emerald-600' : 'text-red-600'}`}>{couponStatus}</p>
              ) : null}
            </div>
          </div>

          <Field label="Password" error={errors.password}>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                autoComplete="new-password"
                placeholder="Create a password"
                value={form.password}
                onChange={updateField}
                className={`${fieldClass} pr-16`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>

          <label className="flex items-center gap-3 rounded-lg border border-[#d5dbe6] bg-white px-3.5 py-3 text-sm text-[#12203a]">
            <input
              type="checkbox"
              name="hasGst"
              checked={form.hasGst}
              onChange={updateField}
              className="h-4 w-4 rounded border-slate-300 text-gold-500 focus:ring-gold-400"
            />
            I have a GST number
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border border-[#d5dbe6] bg-white px-5 py-3 text-sm font-semibold text-[#12203a] transition hover:bg-[#f4f7fb]"
            >
              Back
            </button>
            <button type="submit" disabled={submitting} className={`${primaryButtonClass} min-w-0 flex-1`}>
              {submitting ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-sm text-slate-500">
        Already have an account?{' '}
        <button type="button" onClick={onSwitchToLogin} className="font-semibold text-[#10203c] hover:text-[#c48a09]">
          Login
        </button>
      </p>
    </form>
  )
}

export default SignupForm
