import { Link, Outlet, useNavigate } from 'react-router-dom'
import { clearSession } from '../services/api'

function AdminLayout() {
  const navigate = useNavigate()

  const logout = () => {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">Digital Expert</p>
            <Link to="/" className="text-lg font-bold">
              Course admin
            </Link>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Log out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default AdminLayout
