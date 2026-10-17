import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { changePassword, uploadAvatar } from '../services/api'

function downloadInvoice(user) {
  const lines = [
    'Digital Vidhya',
    'Account invoice',
    '',
    `Name: ${user?.fullName?.trim() || '—'}`,
    `Email: ${user?.email?.trim() || '—'}`,
    `Phone: ${user?.phone?.trim() || '—'}`,
    `Package: ${user?.knowledgePackage?.trim() || 'Not selected'}`,
    `Referred by: ${user?.referredByLabel?.trim() || '—'}`,
    `Date: ${new Date().toLocaleDateString()}`,
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'digital-vidhya-invoice.txt'
  link.click()
  URL.revokeObjectURL(url)
}

function formatDisplayName(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function ProfileModal({ user, onClose, onUserChange }) {
  const fileInput = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  const onPhoto = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploading(true)
    setError('')
    setMessage('')
    try {
      const nextUser = await uploadAvatar(file)
      onUserChange(nextUser)
      setMessage('Profile photo updated')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update your photo')
    } finally {
      setUploading(false)
    }
  }

  const onPassword = async (event) => {
    event.preventDefault()
    const currentPassword = passwords.currentPassword
    const newPassword = passwords.newPassword
    const confirmPassword = passwords.confirmPassword

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

  const displayName = formatDisplayName(user?.fullName) || '—'
  const packageName = user?.knowledgePackage?.trim() || 'Not selected'
  const details = [
    { label: 'Email', value: user?.email?.trim() || '—' },
    { label: 'Phone', value: user?.phone?.trim() || '—' },
    { label: 'Referred by', value: user?.referredByLabel?.trim() || '—' },
  ]

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0a1224]/65 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        className="max-h-[90vh] w-full max-w-[22rem] overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(10,18,36,0.35)] ring-1 ring-black/5"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative overflow-hidden bg-ink-950 px-5 pb-14 pt-4 text-white">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(245,193,74,0.22),transparent_45%),radial-gradient(ellipse_at_bottom_left,rgba(14,165,233,0.18),transparent_50%)]"
            aria-hidden="true"
          />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-300">Account</p>
              <h2 id="profile-title" className="mt-0.5 text-base font-bold tracking-tight">
                Profile
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close profile"
              className="cursor-pointer rounded-full p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="relative px-5 pb-5 pt-0">
          <div className="-mt-10 flex flex-col items-center text-center">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="group relative cursor-pointer"
              aria-label="Change profile photo"
              disabled={uploading}
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-[4.75rem] w-[4.75rem] rounded-full object-cover ring-4 ring-white shadow-md"
                />
              ) : (
                <span className="flex h-[4.75rem] w-[4.75rem] items-center justify-center rounded-full bg-gradient-to-br from-sky-600 to-ink-950 text-2xl font-bold text-white ring-4 ring-white shadow-md">
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="absolute bottom-0.5 right-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-gold-400 text-[#1a1203] shadow-sm ring-2 ring-white transition group-hover:brightness-105">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10-10-4-4L4 16v4Z" />
                  <path strokeLinecap="round" d="m13 7 4 4" />
                </svg>
              </span>
            </button>
            <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhoto} />
            <p className="mt-2 text-[11px] text-slate-400">{uploading ? 'Uploading photo…' : 'Click photo to update'}</p>
            <h3 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900">{displayName}</h3>
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-gold-400/15 px-3 py-1 text-xs font-semibold text-[#8f5f08] ring-1 ring-gold-400/35">
              <span className="h-1.5 w-1.5 rounded-full bg-gold-400" />
              {packageName}
            </span>
          </div>

          <dl className="mt-5 space-y-0 overflow-hidden rounded-xl bg-[#f6f8fc] ring-1 ring-slate-200/80">
            {details.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-3.5 py-3 text-sm last:border-b-0">
                <dt className="shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">{item.label}</dt>
                <dd className="min-w-0 truncate text-right font-semibold text-slate-800">{item.value}</dd>
              </div>
            ))}
          </dl>

          {error ? <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-100">{error}</p> : null}
          {message ? <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-700 ring-1 ring-emerald-100">{message}</p> : null}

          {showPassword ? (
            <form onSubmit={onPassword} className="mt-4 space-y-2.5 rounded-xl bg-[#f6f8fc] p-3.5 ring-1 ring-slate-200/80">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Update password</p>
              <input
                type="password"
                autoComplete="current-password"
                value={passwords.currentPassword}
                onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))}
                placeholder="Current password"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                required
              />
              <input
                type="password"
                autoComplete="new-password"
                value={passwords.newPassword}
                onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))}
                placeholder="New password"
                minLength={6}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                required
              />
              <input
                type="password"
                autoComplete="new-password"
                value={passwords.confirmPassword}
                onChange={(event) => setPasswords((current) => ({ ...current, confirmPassword: event.target.value }))}
                placeholder="Confirm new password"
                minLength={6}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/20"
                required
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowPassword(false)
                    setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' })
                    setError('')
                  }}
                  className="cursor-pointer rounded-full px-4 py-2.5 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 transition hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="flex-1 cursor-pointer rounded-full bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 py-2.5 text-sm font-bold text-[#1a1203] shadow-[0_8px_18px_rgba(245,193,74,0.28)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPassword ? 'Saving…' : 'Save password'}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-4 grid gap-2.5">
              <button
                type="button"
                onClick={() => setShowPassword(true)}
                className="w-full cursor-pointer rounded-full bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 py-3 text-sm font-bold text-[#1a1203] shadow-[0_8px_18px_rgba(245,193,74,0.28)] transition hover:brightness-105"
              >
                Change password
              </button>
              <button
                type="button"
                onClick={() => downloadInvoice(user)}
                className="w-full cursor-pointer rounded-full py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-[#f6f8fc] hover:text-sky-700"
              >
                Download invoice
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default ProfileModal
