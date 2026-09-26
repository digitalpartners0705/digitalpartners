import { useAuth } from '../../context/AuthContext'

function AffiliateProfile() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Edit your profile</h1>
      <p className="mt-1 text-slate-500">These are the details on your Digital Expert account.</p>

      <div className="mt-8 max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Full name</p>
          <p className="mt-1 font-semibold text-slate-900">{user?.fullName || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</p>
          <p className="mt-1 font-semibold text-slate-900">{user?.email || '—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Phone</p>
          <p className="mt-1 font-semibold text-slate-900">{user?.phone || '—'}</p>
        </div>
      </div>
    </div>
  )
}

export default AffiliateProfile
