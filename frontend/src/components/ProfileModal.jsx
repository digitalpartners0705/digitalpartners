import { useRef, useState } from 'react'
import { changePassword, uploadAvatar } from '../services/api'

function downloadInvoice(user) {
  const lines = [
    'Digital Expert',
    'Account invoice',
    '',
    `Name: ${user?.fullName || ''}`,
    `Email: ${user?.email || ''}`,
    `Phone: ${user?.phone || ''}`,
    `Package: ${user?.knowledgePackage || ''}`,
    `Date: ${new Date().toLocaleDateString()}`,
  ]
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'digital-expert-invoice.txt'
  link.click()
  URL.revokeObjectURL(url)
}

function ProfileModal({ user, onClose, onUserChange }) {
  const fileInput = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
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
    setSavingPassword(true)
    setError('')
    setMessage('')
    try {
      const result = await changePassword(passwords)
      setPasswords({ currentPassword: '', newPassword: '' })
      setShowPassword(false)
      setMessage(result.message || 'Password updated')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update your password')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-white px-6 pb-6 pt-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md px-2 py-1 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            Close
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <h2 id="profile-title" className="sr-only">
            Your profile
          </h2>
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="relative cursor-pointer"
            aria-label="Change profile photo"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="h-28 w-28 rounded-full object-cover ring-4 ring-slate-100" />
            ) : (
              <span className="flex h-28 w-28 items-center justify-center rounded-full bg-brand-600 text-3xl font-bold text-white ring-4 ring-brand-100">
                {(user?.fullName || 'U').slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10-10-4-4L4 16v4Z" />
                <path strokeLinecap="round" d="m13 7 4 4" />
              </svg>
            </span>
          </button>
          <input ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhoto} />
          <p className="mt-3 text-xs text-slate-400">{uploading ? 'Uploading photo...' : 'Pencil updates your photo'}</p>

          <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{user?.fullName}</p>
          <div className="mt-3 w-full space-y-1 text-sm text-slate-600">
            <p>{user?.email}</p>
            <p>{user?.phone || 'No phone added'}</p>
            <p>
              Referred by <span className="font-semibold text-slate-800">{user?.promoCode || '—'}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={() => downloadInvoice(user)}
            className="mt-3 cursor-pointer text-sm font-semibold text-brand-600 underline-offset-2 hover:underline"
          >
            Click here to download invoice
          </button>
        </div>

        <div className="mt-6 rounded-xl bg-[#1b2140] px-4 py-3.5 text-center text-sm font-semibold tracking-wide text-white">
          Package · {user?.knowledgePackage || 'Not selected'}
        </div>

        {error ? <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

        {showPassword ? (
          <form onSubmit={onPassword} className="mt-4 space-y-3">
            <input
              type="password"
              value={passwords.currentPassword}
              onChange={(event) => setPasswords((current) => ({ ...current, currentPassword: event.target.value }))}
              placeholder="Current password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              required
            />
            <input
              type="password"
              value={passwords.newPassword}
              onChange={(event) => setPasswords((current) => ({ ...current, newPassword: event.target.value }))}
              placeholder="New password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-500"
              required
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowPassword(false)}
                className="cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={savingPassword}
                className="flex-1 cursor-pointer rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {savingPassword ? 'Saving...' : 'Save password'}
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowPassword(true)}
            className="mt-3 w-full cursor-pointer rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Change password
          </button>
        )}
      </div>
    </div>
  )
}

export default ProfileModal
