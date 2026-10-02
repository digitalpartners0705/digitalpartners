import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { COUNTRIES } from '../../data/signupOptions'
import { changePassword, updateProfile, uploadAvatar } from '../../services/api'

const inputClass =
  'w-full rounded-xl border border-white/10 bg-[#10131c] px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-gold-400/50 focus:ring-2 focus:ring-gold-400/15'

function formatDisplayName(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function AffiliateProfile() {
  const { user, updateUser } = useAuth()
  const fileInput = useRef(null)
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    state: '',
    pinCode: '',
    managerName: '',
    managerPhone: '',
  })
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    setForm({
      fullName: user.fullName || '',
      phone: user.phone || '',
      state: user.state || '',
      pinCode: user.pinCode || '',
      managerName: user.managerName || user.referrerName || '',
      managerPhone: user.managerPhone || user.referrerPhone || '',
    })
  }, [user])

  const states = COUNTRIES[user?.country] || COUNTRIES.India
  const displayName = formatDisplayName(user?.fullName) || '—'

  const setField = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }))
  }

  const onPhoto = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    setError('')
    setMessage('')
    try {
      const nextUser = await uploadAvatar(file)
      updateUser(nextUser)
      setMessage('Profile photo updated')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update your photo')
    } finally {
      setUploading(false)
    }
  }

  const onSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const nextUser = await updateProfile({
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        state: form.state.trim(),
        pinCode: form.pinCode.trim(),
        managerName: form.managerName.trim(),
        managerPhone: form.managerPhone.trim(),
      })
      updateUser(nextUser)
      setMessage('Profile saved')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save your profile')
    } finally {
      setSaving(false)
    }
  }

  const onPassword = async (event) => {
    event.preventDefault()
    const { currentPassword, newPassword, confirmPassword } = passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Fill in all password fields')
      setMessage('')
      return
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      setMessage('')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirm password do not match')
      setMessage('')
      return
    }
    if (newPassword === currentPassword) {
      setError('New password must be different from your current password')
      setMessage('')
      return
    }

    setSavingPassword(true)
    setError('')
    setMessage('')
    try {
      const result = await changePassword({ currentPassword, newPassword, confirmPassword })
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPassword(false)
      setMessage(result.message || 'Password updated')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update your password')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Edit your profile</h1>
        <p className="mt-1 text-sm text-slate-400">Update your affiliate account details.</p>
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#171b27]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,193,74,0.12),transparent_45%),radial-gradient(ellipse_at_bottom_left,rgba(14,165,233,0.1),transparent_50%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-5 px-5 py-6 sm:flex-row sm:items-center sm:gap-6 sm:px-7">
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="group relative mx-auto shrink-0 cursor-pointer sm:mx-0"
            aria-label="Change profile photo"
            disabled={uploading}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt=""
                className="h-24 w-24 rounded-full object-cover ring-2 ring-gold-400/70"
              />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-ink-950 text-3xl font-bold text-white ring-2 ring-gold-400/70">
                {displayName.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="absolute -bottom-0.5 -left-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-gold-400 text-[#1a1203] shadow-md ring-2 ring-[#171b27] transition group-hover:brightness-105">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10-10-4-4L4 16v4Z" />
                <path strokeLinecap="round" d="m13 7 4 4" />
              </svg>
            </span>
          </button>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhoto} />

          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h2 className="truncate text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{displayName}</h2>
            <p className="mt-1 truncate text-sm text-slate-300">{user?.email || '—'}</p>
            <p className="mt-1 text-xs text-slate-500">{uploading ? 'Uploading photo…' : 'Click the photo to change it'}</p>
            <button
              type="button"
              onClick={() => {
                setShowPassword((open) => !open)
                setError('')
                setMessage('')
              }}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 px-4 py-2.5 text-sm font-bold text-[#1a1203] shadow-[0_8px_18px_rgba(245,193,74,0.25)] transition hover:brightness-105"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c.2.6.7 1.1 1.5 1.1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
              </svg>
              Change Password
            </button>
          </div>
        </div>
        <div className="h-1.5 bg-gradient-to-r from-gold-400/80 via-gold-300 to-sky-400/80" />
      </section>

      {showPassword ? (
        <form onSubmit={onPassword} className="space-y-3 rounded-2xl border border-white/10 bg-[#171b27] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">Update password</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="password"
              autoComplete="current-password"
              value={passwords.currentPassword}
              onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))}
              placeholder="Current password"
              className={inputClass}
              required
            />
            <input
              type="password"
              autoComplete="new-password"
              value={passwords.newPassword}
              onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))}
              placeholder="New password"
              minLength={6}
              className={inputClass}
              required
            />
            <input
              type="password"
              autoComplete="new-password"
              value={passwords.confirmPassword}
              onChange={(event) => setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))}
              placeholder="Confirm new password"
              minLength={6}
              className={inputClass}
              required
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={savingPassword}
              className="rounded-full bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 px-5 py-2.5 text-sm font-bold text-[#1a1203] transition hover:brightness-105 disabled:opacity-60"
            >
              {savingPassword ? 'Saving…' : 'Save password'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowPassword(false)
                setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
              }}
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-300 ring-1 ring-white/15 transition hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {error ? <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}
      {message ? <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{message}</p> : null}

      <form onSubmit={onSave} className="space-y-5">
        <section className="rounded-2xl border border-white/10 bg-[#171b27] p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-200">User Name</span>
              <input
                type="text"
                value={form.fullName}
                onChange={setField('fullName')}
                placeholder="User Name"
                className={inputClass}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-200">Contact Number</span>
              <input
                type="tel"
                value={form.phone}
                onChange={setField('phone')}
                placeholder="Contact Number"
                className={inputClass}
                required
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-200">State</span>
              <select value={form.state} onChange={setField('state')} className={inputClass} required>
                <option value="">Select state</option>
                {states.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-200">Pin Code</span>
              <input
                type="text"
                inputMode="numeric"
                value={form.pinCode}
                onChange={setField('pinCode')}
                placeholder="Pin Code"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-200">Manager Name</span>
              <input
                type="text"
                value={form.managerName}
                onChange={setField('managerName')}
                placeholder="Manager Name"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-200">Manager&apos;s Contact Number</span>
              <input
                type="tel"
                value={form.managerPhone}
                onChange={setField('managerPhone')}
                placeholder="Manager's Contact Number"
                className={inputClass}
              />
            </label>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-full bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 py-3.5 text-sm font-bold text-[#1a1203] shadow-[0_10px_24px_rgba(245,193,74,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-12"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </form>
    </div>
  )
}

export default AffiliateProfile
