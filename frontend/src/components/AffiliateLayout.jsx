import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProfileButton from './ProfileButton'

const navItems = [
  { to: '/affiliate/earnings', label: 'Earnings', icon: 'earnings' },
  { to: '/affiliate/downloads', label: 'Downloads', icon: 'downloads' },
  { to: '/affiliate/announcements', label: 'Announcements', icon: 'announcements' },
  { to: '/affiliate/trainings', label: 'Trainings', icon: 'trainings' },
  { to: '/affiliate/leaderboard', label: 'Leaderboard', icon: 'leaderboard' },
  { to: '/affiliate/kyc', label: 'KYC', icon: 'kyc' },
  { to: '/affiliate/links', label: 'Link Gen', icon: 'links' },
  { to: '/affiliate/ref-info', label: 'Ref Info', icon: 'referrals' },
  { to: '/affiliate/qualification', label: 'Qualification', icon: 'qualification' },
  { to: '/affiliate/achievements', label: 'Achievements', icon: 'achievements' },
  { to: '/affiliate/community', label: 'Community', icon: 'community' },
]

function NavIcon({ name }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, className: 'h-[18px] w-[18px] shrink-0', 'aria-hidden': true }

  if (name === 'earnings') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5M4 19h16" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m7 14 4-4 3 3 5-6" />
      </svg>
    )
  }
  if (name === 'downloads') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m8 10 4 4 4-4" />
        <path strokeLinecap="round" d="M5 19h14" />
      </svg>
    )
  }
  if (name === 'announcements') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 10v4a1 1 0 0 0 1 1h2l4 3V6L7 9H5a1 1 0 0 0-1 1Z" />
        <path strokeLinecap="round" d="M15 9.5a3.5 3.5 0 0 1 0 5" />
      </svg>
    )
  }
  if (name === 'trainings') {
    return (
      <svg {...common}>
        <rect x="3.5" y="5" width="17" height="14" rx="2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m10 9 5 3-5 3V9Z" />
      </svg>
    )
  }
  if (name === 'leaderboard') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 20V10M12 20V4M17 20v-7" />
      </svg>
    )
  }
  if (name === 'kyc') {
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <circle cx="10" cy="11" r="2" />
        <path strokeLinecap="round" d="M14 10h4M14 13h3M7 16h10" />
      </svg>
    )
  }
  if (name === 'links') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" d="M10 13a5 5 0 0 0 7.1.1l1.4-1.4a3.5 3.5 0 0 0-5-5L12 8" />
        <path strokeLinecap="round" d="M14 11a5 5 0 0 0-7.1-.1L5.5 12.3a3.5 3.5 0 0 0 5 5L12 16" />
      </svg>
    )
  }
  if (name === 'referrals') {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="2.5" />
        <circle cx="16" cy="9" r="2" />
        <path strokeLinecap="round" d="M4.5 18a4.5 4.5 0 0 1 9 0M14 18a3.5 3.5 0 0 1 5.5-2.8" />
      </svg>
    )
  }
  if (name === 'qualification') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m8.5 12.5 2.2 2.2 4.8-5" />
      </svg>
    )
  }
  if (name === 'achievements') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m12 3 2.2 4.6 5 .7-3.6 3.5.9 5.1L12 14.8 7.5 17l.9-5.1L4.8 8.3l5-.7L12 3Z" />
      </svg>
    )
  }
  if (name === 'logout') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 7V5H5v14h5v-2" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 12h9" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m16 8 4 4-4 4" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <circle cx="8" cy="9" r="2.2" />
      <circle cx="16" cy="9" r="2.2" />
      <path strokeLinecap="round" d="M4.5 18a3.8 3.8 0 0 1 7 0M12.5 18a3.8 3.8 0 0 1 7 0" />
    </svg>
  )
}

function AffiliateLayout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const firstName = user?.fullName?.split(' ')[0] || 'there'

  useEffect(() => {
    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  return (
    <div className="min-h-screen bg-[#10131c] text-slate-100">
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/10 bg-[#0c0f16] text-slate-300 transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Link to="/affiliate/earnings" className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-300 text-sm font-bold text-slate-900">
            D
          </span>
          <span>
            <span className="block text-sm font-extrabold tracking-tight text-white">Digital Expert</span>
            <span className="block text-[11px] font-medium text-slate-500">Affiliate</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-teal-300 text-slate-900'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <NavIcon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <NavIcon name="logout" />
            Log out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex items-center justify-between gap-4 overflow-visible border-b border-white/10 bg-[#10131c] px-4 py-3 sm:px-8">
          <button
            type="button"
            className="cursor-pointer rounded-lg p-2 text-slate-200 ring-1 ring-white/15 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <p className="text-sm text-slate-400 sm:text-base">
            Hello, <span className="font-semibold text-white">{firstName}</span>
          </p>

          <div className="relative z-50 ml-auto flex items-center gap-2 pr-1 sm:pr-2" ref={menuRef}>
            <ProfileButton editable={false} ringClass="ring-[#10131c]" />
            <button
              type="button"
              onClick={() => setMenuOpen((open) => !open)}
              className="cursor-pointer rounded-full p-1 text-slate-300 hover:bg-white/10"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Open account menu"
            >
              <svg className={`h-4 w-4 transition ${menuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-3 w-56 rounded-xl border border-white/10 bg-[#171b27] py-1 shadow-xl shadow-black/40"
              >
                <Link
                  to="/affiliate/profile"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="block cursor-pointer px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5"
                >
                  Edit your profile
                </Link>
                <Link
                  to="/dashboard"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="block cursor-pointer px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-white/5"
                >
                  Back to dashboard
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false)
                    logout()
                  }}
                  className="block w-full cursor-pointer px-4 py-2.5 text-left text-sm font-medium text-slate-200 hover:bg-white/5"
                >
                  Log out
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <div className="relative z-0 px-4 py-8 sm:px-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default AffiliateLayout
