import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { getAffiliateRefInfo } from '../../services/api'

const PACKAGE_TONE = {
  'Social Expert': 'bg-violet-400/15 text-violet-200',
  'Ads Expert': 'bg-sky-400/15 text-sky-200',
  'Ads & Creative Expert': 'bg-sky-400/15 text-sky-200',
  'AI Premium Expert': 'bg-teal-300/15 text-teal-200',
  'AI & Business Expert': 'bg-teal-300/15 text-teal-200',
}

const FALLBACK_PACKAGES = ['Social Expert', 'Ads & Creative Expert', 'AI & Business Expert']

function formatDay(value) {
  if (!value) return '—'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
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
  const { user } = useAuth()
  const rawName = user?.fullName?.split(' ')[0] || 'there'
  const firstName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
  const [tab, setTab] = useState('referrals')
  const [query, setQuery] = useState('')
  const [packageName, setPackageName] = useState('All packages')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const needle = query.trim().toLowerCase()

  useEffect(() => {
    let active = true
    setLoading(true)
    getAffiliateRefInfo()
      .then((payload) => {
        if (!active) return
        setData(payload)
        setError('')
      })
      .catch((err) => {
        if (!active) return
        setError(err.response?.data?.message || 'Could not load referral info')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const packages = data?.packages?.length ? data.packages : FALLBACK_PACKAGES
  const allReferrals = data?.referrals || []
  const allPayouts = data?.payouts || []

  const referrals = useMemo(() => {
    return allReferrals.filter((row) => {
      const matchesPackage = packageName === 'All packages' || row.package === packageName
      const haystack = `${row.name} ${row.phone} ${row.email} ${row.country} ${row.package}`.toLowerCase()
      return matchesPackage && (!needle || haystack.includes(needle))
    })
  }, [allReferrals, needle, packageName])

  const payouts = useMemo(() => {
    return allPayouts.filter((row) => {
      const haystack = `${row.invoice} ${row.amount} ${row.status}`.toLowerCase()
      return !needle || haystack.includes(needle)
    })
  }, [allPayouts, needle])

  return (
    <div className="-mx-4 -my-8 min-h-[calc(100vh-4.25rem)] bg-[#10131c] px-4 py-8 text-slate-100 sm:-mx-8 sm:px-8">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
        Hello, <span className="text-teal-300">{firstName}</span>
      </h1>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
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
              {packages.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-100">{error}</p>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-xl border border-white/10 bg-[#171b27]">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
          <h2 className="text-xl font-bold tracking-tight">{tab === 'referrals' ? 'Referral Details' : 'Payout Details'}</h2>
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
                {!loading && referrals.length > 0
                  ? referrals.map((row, index) => (
                    <tr key={row.id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-4 text-slate-400 sm:px-5">{index + 1}</td>
                      <td className="px-3 py-4 font-medium">{row.name}</td>
                      <td className="px-3 py-4 text-slate-300">{row.phone}</td>
                      <td className="px-3 py-4 text-slate-300">{row.email}</td>
                      <td className="px-3 py-4 text-slate-300">{formatDay(row.date)}</td>
                      <td className="px-3 py-4 text-slate-300">{row.country}</td>
                      <td className="px-4 py-4 sm:px-5">
                        <span
                          className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${
                            PACKAGE_TONE[row.package] || 'bg-white/10 text-slate-200'
                          }`}
                        >
                          {row.package}
                        </span>
                      </td>
                    </tr>
                  ))
                  : null}
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
                {!loading && payouts.length > 0
                  ? payouts.map((row, index) => (
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
                  : null}
              </tbody>
            </table>
          )}
        </div>
        {loading ? (
          <p className="px-5 py-12 text-center text-sm text-slate-400">
            {tab === 'referrals' ? 'Loading referrals…' : 'Loading payouts…'}
          </p>
        ) : tab === 'referrals' && referrals.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-400">
            {allReferrals.length === 0
              ? 'No referrals yet. Share a link and your buyers will appear here.'
              : 'No referrals match this search.'}
          </p>
        ) : tab !== 'referrals' && payouts.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-slate-400">
            No payouts yet. Payouts will show here once KYC and transfers are set up.
          </p>
        ) : null}
      </section>
    </div>
  )
}

export default AffiliateRefInfo
