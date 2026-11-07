import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { adminNav } from '../nav'
import api, { clearSession } from '../services/api'

function NavIcon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    className: 'h-[18px] w-[18px] shrink-0',
    'aria-hidden': true,
  }

  if (name === 'courses') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6.5h11a2 2 0 0 1 2 2V19H6.5A2.5 2.5 0 0 1 4 16.5v-10Z" />
        <path strokeLinecap="round" d="M17 8.5h2.5A1.5 1.5 0 0 1 21 10v9h-4" />
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

  if (name === 'requests') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h11M8 12h11M8 18h11" />
        <path strokeLinecap="round" d="M4 6h.01M4 12h.01M4 18h.01" />
      </svg>
    )
  }

  if (name === 'orders') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h9.5L19 7.5V20H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
        <path strokeLinecap="round" d="M9 11h6M9 15h4" />
      </svg>
    )
  }

  if (name === 'commissions') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8" />
        <path strokeLinecap="round" d="M12 8v8M9.5 10.5c.5-.8 1.4-1.2 2.5-1.2 1.4 0 2.5.7 2.5 1.8S13.4 13 12 13s-2.5.6-2.5 1.7c0 1.1 1.1 1.8 2.5 1.8 1.1 0 2-.4 2.5-1.2" />
      </svg>
    )
  }

  if (name === 'contact') {
    return (
      <svg {...common}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 19.5 4 21l1.2-3.5A7.8 7.8 0 1 1 12 19.8a8 8 0 0 1-4.5-.3Z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 10h7M8.5 14h4" />
      </svg>
    )
  }

  if (name === 'announcements') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 10v4a1 1 0 0 0 1 1h2l4 3V6L7 9H5a1 1 0 0 0-1 1Z" />
        <path strokeLinecap="round" d="M15 9.5a3.5 3.5 0 0 1 0 5" />
        <path strokeLinecap="round" d="M17.5 7a6.5 6.5 0 0 1 0 10" />
      </svg>
    )
  }

  if (name === 'achievements') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
        <path strokeLinecap="round" d="M7 6H5.5A2.5 2.5 0 0 0 5.5 11H7M17 6h1.5A2.5 2.5 0 0 1 18.5 11H17" />
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

  if (name === 'users') {
    return (
      <svg {...common}>
        <circle cx="9" cy="8" r="3" />
        <path strokeLinecap="round" d="M3.5 19c.6-2.6 2.8-4 5.5-4s4.9 1.4 5.5 4" />
        <circle cx="17" cy="9" r="2.2" />
        <path strokeLinecap="round" d="M16 15.2c1.8.3 3.2 1.4 3.8 3.3" />
      </svg>
    )
  }

  if (name === 'referrer') {
    return (
      <svg {...common}>
        <circle cx="7.5" cy="8" r="2.5" />
        <circle cx="16.5" cy="8" r="2.5" />
        <circle cx="12" cy="16.5" r="2.5" />
        <path strokeLinecap="round" d="M9.5 9.5 11 14M14.5 9.5 13 14" />
      </svg>
    )
  }

  if (name === 'external') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M12 9v6" />
        <path strokeLinecap="round" d="M4 10h16" />
      </svg>
    )
  }

  if (name === 'leaderboard') {
    return (
      <svg {...common}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 19V10M12 19V5M19 19v-6" />
        <path strokeLinecap="round" d="M4 19h16" />
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

function pageCrumb(pathname) {
  if (pathname.startsWith('/commissions/earners/')) return 'Earner history'
  if (pathname.startsWith('/commissions')) return 'Commissions'
  if (pathname.startsWith('/order-requests')) return 'Order requests'
  if (pathname.startsWith('/orders')) {
    return pathname === '/orders' ? 'Orders' : 'Order details'
  }
  if (pathname.startsWith('/trainings')) {
    if (pathname.endsWith('/edit')) return 'Edit day'
    if (pathname !== '/trainings') return 'Videos'
    return 'Training'
  }
  if (pathname === '/courses/new') return 'New course'
  if (pathname.endsWith('/edit')) return 'Edit course'
  if (pathname.startsWith('/courses/') && pathname !== '/courses') return 'Lessons'
  if (pathname.startsWith('/contact')) return 'Contact queries'
  if (pathname.startsWith('/announcements')) return 'Announcements'
  if (pathname.startsWith('/achievements')) return 'Achievements'
  if (pathname.startsWith('/kyc')) return 'KYC submissions'
  if (pathname.startsWith('/leaderboard-visibility')) return 'Leaderboard visibility'
  if (pathname.startsWith('/users')) return 'Users'
  if (pathname.startsWith('/external-earnings')) return 'External earnings'
  if (pathname.startsWith('/change-referrer')) return 'Change referrer'
  if (pathname.startsWith('/courses')) return 'Courses'
  return 'Admin'
}

function AdminLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)
  const [pendingRequests, setPendingRequests] = useState(0)

  useEffect(() => {
    api
      .get('/api/auth/me')
      .then((response) => setUser(response.data.user || null))
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  useEffect(() => {
    const loadCount = () => {
      api
        .get('/api/admin/order-requests/stats')
        .then((response) => setPendingRequests(response.data.pending || 0))
        .catch(() => setPendingRequests(0))
    }
    loadCount()
    window.addEventListener('order-requests-changed', loadCount)
    return () => window.removeEventListener('order-requests-changed', loadCount)
  }, [pathname])

  const logout = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  const displayName = user?.fullName || 'Admin'
  const initial = displayName.trim().charAt(0).toUpperCase() || 'A'

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
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Link to="/orders" className="flex items-center border-b border-slate-100 px-5 py-4" aria-label="Digital Vidhya admin home">
          <div className="min-w-0">
            <img
              src="/assets/Digital-Vidhya-logo-trim.png"
              alt="Digital Vidhya"
              className="h-11 w-auto max-w-full object-contain"
            />
            <span className="mt-1.5 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
              Admin panel
            </span>
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {adminNav.map((section) => (
            <div key={section.label} className="mb-6">
              <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{section.label}</p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-100'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`
                    }
                  >
                    <NavIcon name={item.icon} />
                    <span className="truncate">{item.label}</span>
                    {item.to === '/order-requests' && pendingRequests > 0 ? (
                      <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[11px] font-bold text-amber-800">
                        {pendingRequests > 99 ? '99+' : pendingRequests}
                      </span>
                    ) : null}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="mb-1 flex items-center gap-3 px-2 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {initial}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
              <p className="truncate text-xs text-slate-500">{user?.email || 'Signed in'}</p>
            </div>
          </div>
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
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md sm:px-8">
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
          <p className="text-sm text-slate-500">
            Admin
            <span className="mx-2 text-slate-300">/</span>
            <span className="font-semibold text-slate-900">{pageCrumb(pathname)}</span>
          </p>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
