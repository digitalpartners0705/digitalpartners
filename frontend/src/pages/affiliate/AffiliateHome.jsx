import { useAuth } from '../../context/AuthContext'

function AffiliateHome() {
  const { user } = useAuth()
  const firstName = user?.fullName?.split(' ')[0] || 'there'

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 lg:grid lg:grid-cols-[1.4fr_1fr]">
        <div className="px-6 py-7 sm:px-8">
          <span className="inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Affiliate workspace
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Hello, {firstName}
          </h1>
          <p className="mt-2 max-w-lg text-slate-500">
            This is your affiliate area. Share Digital Arambh, track referrals, and come back to your courses anytime.
          </p>
        </div>
        <div className="relative bg-[#1b2140] px-6 py-7 text-white sm:px-8">
          <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-brand-500/30" />
          <div className="absolute -bottom-10 right-10 h-20 w-20 rounded-full bg-brand-400/20" />
          <p className="relative text-sm font-medium text-indigo-200">Need your courses?</p>
          <p className="relative mt-2 text-lg font-semibold">Open the profile menu and choose Back to dashboard.</p>
        </div>
      </section>
    </div>
  )
}

export default AffiliateHome
