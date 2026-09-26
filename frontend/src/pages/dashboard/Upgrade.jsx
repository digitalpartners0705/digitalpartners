function Upgrade() {
  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Upgrade plan</h1>
      <p className="mt-1 text-slate-500">Unlock every course, mentor reviews, and certificates.</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm font-semibold text-slate-500">Starter</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">Free</p>
          <p className="mt-2 text-sm text-slate-600">Your current plan. Access to enrolled courses only.</p>
        </article>
        <article className="rounded-2xl bg-[#1b2140] p-6 text-white shadow-lg">
          <p className="text-sm font-semibold text-indigo-200">Pro</p>
          <p className="mt-2 text-3xl font-extrabold">₹999 / month</p>
          <ul className="mt-4 space-y-2 text-sm text-indigo-100">
            <li>All current and future courses</li>
            <li>Mentor Q&A and project reviews</li>
            <li>Verified certificates</li>
          </ul>
          <button
            type="button"
            className="mt-6 w-full rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600"
          >
            Coming soon
          </button>
        </article>
      </div>
    </div>
  )
}

export default Upgrade
