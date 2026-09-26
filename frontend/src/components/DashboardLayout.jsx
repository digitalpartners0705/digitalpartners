import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProfileButton from './ProfileButton'

const navItems = [
  { to: '/dashboard', label: 'Overview', end: true, icon: 'home' },
  { to: '/dashboard/browse', label: 'Browse courses', icon: 'browse' },
  { to: '/dashboard/courses', label: 'My courses', icon: 'courses' },
  { to: '/dashboard/certificates', label: 'Certificates', icon: 'certificate' },
  { to: '/dashboard/updates', label: 'Recent updates', icon: 'updates' },
  { to: '/dashboard/upgrade', label: 'Upgrade plan', icon: 'upgrade' },
]

function NavIcon({ name }) {
  const common = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, className: 'h-[18px] w-[18px] shrink-0', 'aria-hidden': true }

  if (name === 'home') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
      </svg>
    )
  }
  if (name === 'browse') {
    return (
      <svg {...common}>
        <circle cx="11" cy="11" r="6.5" />
        <path strokeLinecap="round" d="m16 16 4 4" />
      </svg>
    )
  }
  if (name === 'courses') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6.5h11a2 2 0 0 1 2 2V19H6.5A2.5 2.5 0 0 1 4 16.5v-10Z" />
        <path strokeLinecap="round" d="M17 8.5h2.5A1.5 1.5 0 0 1 21 10v9h-4" />
      </svg>
    )
  }
  if (name === 'certificate') {
    return (
      <svg {...common}>
        <circle cx="12" cy="9" r="4.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 13.2 8 20l4-2 4 2-1-6.8" />
      </svg>
    )
  }
  if (name === 'updates') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 16.5h12l-1.2-2.1V10a4.8 4.8 0 0 0-9.6 0v4.4L6 16.5Z" />
        <path strokeLinecap="round" d="M10 16.5a2 2 0 0 0 4 0" />
      </svg>
    )
  }
  if (name === 'upgrade') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v10" />
        <path strokeLinecap="round" strokeLinejoin="round" d="m8 8 4-4 4 4" />
        <path strokeLinecap="round" d="M5 20h14" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 7V5H5v14h5v-2" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 12h9" />
      <path strokeLinecap="round" strokeLinejoin="round" d="m16 8 4 4-4 4" />
    </svg>
  )
}

function DashboardLayout() {
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const firstName = user?.fullName?.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-[#f3f5fb] text-slate-800">
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white text-slate-700 transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Link to="/dashboard" className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
            D
          </span>
          <span className="text-base font-extrabold tracking-tight text-slate-900">Digital Expert</span>
        </Link>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <NavIcon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          >
            <NavIcon name="logout" />
            Log out
          </button>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-slate-200/80 bg-white/80 px-4 py-3 backdrop-blur-md sm:px-8">
          <button
            type="button"
            className="rounded-xl p-2 text-slate-700 ring-1 ring-slate-200 lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <p className="hidden text-sm text-slate-500 sm:block">
            Welcome back, <span className="font-semibold text-slate-800">{firstName}</span>
          </p>
          <div className="ml-auto flex items-center gap-6 pr-1 sm:gap-7 sm:pr-2">
            <Link
              to="/affiliate"
              className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3.5 py-2 text-xs font-semibold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100 hover:ring-brand-200 sm:px-4 sm:text-sm"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h6m0 0v6m0-6-8 8M7 8H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" />
              </svg>
              Affiliate panel
            </Link>
            <ProfileButton />
          </div>
        </header>

        <div className="px-4 py-8 sm:px-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
