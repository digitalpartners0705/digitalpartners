import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import ProfileModal from './ProfileModal'

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}

function ProfileButton({ ringClass = 'ring-brand-100', editable = true }) {
  const { user, updateUser } = useAuth()
  const [open, setOpen] = useState(false)
  const avatar = user?.avatarUrl ? (
    <img src={user.avatarUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
  ) : (
    initials(user?.fullName || 'U')
  )

  if (!editable) {
    return (
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white ring-2 ${ringClass}`}
        aria-hidden="true"
      >
        {avatar}
      </span>
    )
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white ring-2 ${ringClass}`}
        aria-label="Open profile"
      >
        {avatar}
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-slate-900 text-white">
          <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 20h4l10-10-4-4L4 16v4Z" />
          </svg>
        </span>
      </button>
      {open ? <ProfileModal user={user} onClose={() => setOpen(false)} onUserChange={updateUser} /> : null}
    </>
  )
}

export default ProfileButton
