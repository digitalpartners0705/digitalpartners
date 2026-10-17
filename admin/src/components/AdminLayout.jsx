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
  if (pathname.startsWith('/contact')) return 'Contact requests'
  if (pathname.startsWith('/courses')) return 'Courses'
  return 'Admin'
}

function AdminLayout() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    api
      .get('/api/auth/me')
      .then((response) => setUser(response.data.user || null))
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    setSidebarOpen(false)
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
        <Link to="/orders" className="flex items-center gap-3 border-b border-slate-100 px-5 py-5" aria-label="Digital Vidhya admin home">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
            DV
          </span>
          <span>
            <span className="block text-sm font-extrabold tracking-tight text-slate-900">Digital Vidhya</span>
            <span className="mt-0.5 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
              Admin panel
            </span>
          </span>
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
                    {item.label}
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
