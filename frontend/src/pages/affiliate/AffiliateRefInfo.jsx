import { useMemo, useState } from 'react'
import { PACKAGES, PAYOUTS, REFERRALS } from '../../data/refInfo'

const PACKAGE_TONE = {
  'Social Expert': 'bg-violet-400/15 text-violet-200',
  'Ads Expert': 'bg-sky-400/15 text-sky-200',
  'AI Premium Expert': 'bg-teal-300/15 text-teal-200',
}

function formatDay(iso) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatMoney(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  }).format(amount)
}

function AffiliateRefInfo() {
  const [tab, setTab] = useState('referrals')
  const [query, setQuery] = useState('')
  const [packageName, setPackageName] = useState('All packages')
  const needle = query.trim().toLowerCase()

  const referrals = useMemo(() => {
    return REFERRALS.filter((row) => {
      const matchesPackage = packageName === 'All packages' || row.package === packageName
      const haystack = `${row.name} ${row.phone} ${row.email} ${row.country} ${row.package}`.toLowerCase()
      return matchesPackage && (!needle || haystack.includes(needle))
    })
  }, [needle, packageName])

  const payouts = useMemo(() => {
    return PAYOUTS.filter((row) => {
      const haystack = `${row.invoice} ${row.amount} ${row.status}`.toLowerCase()
      return !needle || haystack.includes(needle)
    })
  }, [needle])

  return (
    <div className="-mx-4 -my-8 min-h-[calc(100vh-4.25rem)] bg-[#10131c] px-4 py-8 text-slate-100 sm:-mx-8 sm:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="inline-flex rounded-full border border-white/10 bg-[#171b27] p-1">
          {[
            ['referrals', 'Referral Details'],
            ['payouts', 'Payout Details'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id)
                setQuery('')
              }}
              className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-semibold ${
                tab === id ? 'bg-teal-300 text-slate-900' : 'text-slate-300 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'referrals' ? (
          <label className="flex items-center gap-2 text-sm text-slate-400">
            <span className="sr-only">Package</span>
            <select
              value={packageName}
              onChange={(event) => setPackageName(event.target.value)}
              className="cursor-pointer rounded-lg border border-white/10 bg-[#171b27] px-3 py-2 text-sm text-slate-100 outline-none"
            >
              <option>All packages</option>
              {PACKAGES.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-[#171b27]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <h1 className="text-xl font-bold tracking-tight">{tab === 'referrals' ? 'Referral Details' : 'Payout Details'}</h1>
          <label className="flex w-full max-w-xs items-center gap-2 rounded-full border border-white/10 bg-[#10131c] px-3 py-2">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" />
              <path strokeLinecap="round" d="m16 16 4 4" />
            </svg>
            <span className="sr-only">Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search"
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </label>
        </div>

        <div className="overflow-x-auto">
          {tab === 'referrals' ? (
            <table className="min-w-[52rem] w-full text-left text-sm">
              <thead>
                <tr className="border-y border-white/10 text-xs uppercase tracking-wide text-teal-200/80">
                  <th className="px-4 py-3 font-medium sm:px-5">S.No</th>
                  <th className="px-3 py-3 font-medium">Customer Name</th>
                  <th className="px-3 py-3 font-medium">Phone Number</th>
                  <th className="px-3 py-3 font-medium">Email</th>
                  <th className="px-3 py-3 font-medium">Purchase Date</th>
                  <th className="px-3 py-3 font-medium">Country</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Package</th>
                </tr>
              </thead>
              <tbody>
                {referrals.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-12 text-center text-slate-400">
                      No referrals match this search.
                    </td>
                  </tr>
                ) : (
                  referrals.map((row, index) => (
                    <tr key={row.id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-4 text-slate-400 sm:px-5">{index + 1}</td>
                      <td className="px-3 py-4 font-medium">{row.name}</td>
                      <td className="px-3 py-4 text-slate-300">{row.phone}</td>
                      <td className="px-3 py-4 text-slate-300">{row.email}</td>
                      <td className="px-3 py-4 text-slate-300">{formatDay(row.date)}</td>
                      <td className="px-3 py-4 text-slate-300">{row.country}</td>
                      <td className="px-4 py-4 sm:px-5">
                        <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${PACKAGE_TONE[row.package]}`}>
                          {row.package}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="min-w-[40rem] w-full text-left text-sm">
              <thead>
                <tr className="border-y border-white/10 text-xs uppercase tracking-wide text-teal-200/80">
                  <th className="px-4 py-3 font-medium sm:px-5">S.No</th>
                  <th className="px-3 py-3 font-medium">Invoice No.</th>
                  <th className="px-3 py-3 font-medium">Amount</th>
                  <th className="px-3 py-3 font-medium">TDS</th>
                  <th className="px-3 py-3 font-medium">Invoice Date</th>
                  <th className="px-4 py-3 font-medium sm:px-5">Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-12 text-center text-slate-400">
                      No payouts match this search.
                    </td>
                  </tr>
                ) : (
                  payouts.map((row, index) => (
                    <tr key={row.id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-4 text-slate-400 sm:px-5">{index + 1}</td>
                      <td className="px-3 py-4 font-medium">{row.invoice}</td>
                      <td className="px-3 py-4 text-slate-200">{formatMoney(row.amount)}</td>
                      <td className="px-3 py-4 text-slate-300">{formatMoney(row.tds)}</td>
                      <td className="px-3 py-4 text-slate-300">{formatDay(row.date)}</td>
                      <td className="px-4 py-4 sm:px-5">
                        <span className="inline-flex rounded-md bg-teal-300/15 px-2.5 py-1 text-xs font-semibold text-teal-200">
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  )
}

export default AffiliateRefInfo
