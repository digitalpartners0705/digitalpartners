import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import { exportToExcel } from '../utils/exportExcel'

const upiTabs = [
  { id: 'all', label: 'All' },
  { id: 'with', label: 'With UPI' },
  { id: 'without', label: 'Without UPI' },
]

function formatDateTime(isoString) {
  if (!isoString) return '—'
  const date = new Date(isoString)
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function StatCard({ label, value, hint, tone = 'default' }) {
  const valueTone =
    tone === 'warning' ? 'text-amber-700' : tone === 'success' ? 'text-emerald-700' : 'text-slate-900'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1.5 text-2xl font-extrabold tracking-tight ${valueTone}`}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-slate-500">{hint}</p> : null}
    </div>
  )
}

function ExcelIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 2v6h6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 13l3 4m0-4l-3 4" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 13h-3v4h3" />
    </svg>
  )
}

function DetailRow({ label, value, mono = false }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className={`mt-1 text-sm font-medium text-slate-900 ${mono ? 'font-mono tracking-wide' : ''}`}>
        {value || '—'}
      </p>
    </div>
  )
}

function DetailModal({ submission, onClose }) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">KYC details</h2>
            <p className="mt-1 text-xs text-slate-500">Submitted {formatDateTime(submission.submittedAt)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <div className="grid gap-4 rounded-xl border border-slate-200/60 bg-slate-50 p-4 sm:grid-cols-2">
            <DetailRow label="Affiliate name" value={submission.fullName} />
            <DetailRow label="Email" value={submission.email} />
            <DetailRow label="Phone" value={submission.phone} />
            <DetailRow label="Referral code" value={submission.referralCode} mono />
            <DetailRow label="Package" value={submission.knowledgePackage} />
            <DetailRow label="Country" value={submission.country} />
          </div>

          <div className="grid gap-4 rounded-xl border border-slate-200/60 bg-white p-4 sm:grid-cols-2">
            <DetailRow label="Account holder" value={submission.accountHolderName} />
            <DetailRow label="Bank account" value={submission.bankAccountNumber} mono />
            <DetailRow label="IFSC" value={submission.ifscCode} mono />
            <DetailRow label="Bank name" value={submission.bankName} />
            <DetailRow label="Branch" value={submission.branch} />
            <DetailRow label="UPI" value={submission.upi || 'Not added'} mono />
            <DetailRow label="Aadhaar" value={submission.aadhaarNumber} mono />
            <DetailRow label="PAN" value={submission.panNumber} mono />
          </div>
        </div>

        <div className="mt-6 flex justify-end border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function KycPage() {
  const [submissions, setSubmissions] = useState([])
  const [stats, setStats] = useState({ total: 0, withUpi: 0, withoutUpi: 0, today: 0 })
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 })
  const [upiTab, setUpiTab] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selected, setSelected] = useState(null)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.get('/api/admin/kyc', {
        params: {
          upi: upiTab,
          search: search.trim() || undefined,
          page: pagination.page,
          pageSize: pagination.pageSize,
        },
      })
      setSubmissions(response.data.submissions || [])
      setStats(response.data.stats || { total: 0, withUpi: 0, withoutUpi: 0, today: 0 })
      setPagination(response.data.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 })
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load KYC submissions')
    } finally {
      setLoading(false)
    }
  }, [upiTab, search, pagination.page, pagination.pageSize])

  useEffect(() => {
    const timer = setTimeout(load, 200)
    return () => clearTimeout(timer)
  }, [load])

  const handleDownloadExcel = async () => {
    setExporting(true)
    try {
      const response = await api.get('/api/admin/kyc', {
        params: {
          upi: upiTab,
          search: search.trim() || undefined,
          export: true,
        },
      })

      const allRows = response.data.submissions || []
      const dateStr = new Date().toISOString().split('T')[0]

      const headers = [
        { label: 'Affiliate Name', key: 'fullName' },
        { label: 'Email', key: 'email' },
        { label: 'Phone', key: 'phone' },
        { label: 'Referral Code', key: 'referralCode' },
        { label: 'Package', key: 'knowledgePackage' },
        { label: 'Country', key: 'country' },
        { label: 'Account Holder', key: 'accountHolderName' },
        { label: 'Bank Account Number', key: 'bankAccountNumber' },
        { label: 'IFSC', key: 'ifscCode' },
        { label: 'Bank Name', key: 'bankName' },
        { label: 'Branch', key: 'branch' },
        { label: 'UPI', key: 'upi' },
        { label: 'Aadhaar', key: 'aadhaarNumber' },
        { label: 'PAN', key: 'panNumber' },
        { label: 'Submitted At', getter: (row) => formatDateTime(row.submittedAt) },
      ]

      exportToExcel(`digital-vidhya-kyc-${dateStr}`, headers, allRows)
    } catch (err) {
      alert('Failed to download Excel file: ' + (err.response?.data?.message || err.message))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">KYC submissions</h1>
          <p className="mt-1 text-sm text-slate-500">
            Bank, UPI, Aadhaar, and PAN details submitted by affiliates for payouts.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownloadExcel}
          disabled={exporting || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
        >
          <ExcelIcon />
          <span>{exporting ? 'Preparing Excel...' : 'Download Excel'}</span>
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total KYC" value={stats.total} hint="All submissions" />
        <StatCard label="With UPI" value={stats.withUpi} hint="Ready for UPI payout" tone="success" />
        <StatCard
          label="Without UPI"
          value={stats.withoutUpi}
          hint="Bank details only"
          tone={stats.withoutUpi > 0 ? 'warning' : 'default'}
        />
        <StatCard label="Submitted today" value={stats.today} hint="Last 24 hours" />
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex items-center rounded-lg bg-slate-100 p-1">
          {upiTabs.map((tab) => {
            const count =
              tab.id === 'all' ? stats.total : tab.id === 'with' ? stats.withUpi : stats.withoutUpi
            const active = upiTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setUpiTab(tab.id)
                  setPagination((prev) => ({ ...prev, page: 1 }))
                }}
                className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition ${
                  active ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${active ? 'bg-slate-100' : 'bg-white/70'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value)
            setPagination((prev) => ({ ...prev, page: 1 }))
          }}
          placeholder="Search name, email, PAN, account, UPI…"
          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 md:max-w-sm"
        />
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      {loading ? <p className="text-sm text-slate-500">Loading KYC submissions...</p> : null}

      {!loading && submissions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-slate-900">No KYC submissions yet</p>
          <p className="mt-2 text-sm text-slate-500">Affiliate bank and ID details will appear here after they submit KYC.</p>
        </div>
      ) : null}

      {!loading && submissions.length > 0 ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Affiliate</th>
                <th className="px-4 py-3">Bank</th>
                <th className="px-4 py-3">UPI</th>
                <th className="px-4 py-3">PAN / Aadhaar</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((row) => (
                <tr key={row.id} className="align-top hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{row.fullName || '—'}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{row.email}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{row.phone || '—'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{row.bankName}</p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">{row.bankAccountNumber}</p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">{row.ifscCode}</p>
                  </td>
                  <td className="px-4 py-3">
                    {row.upi ? (
                      <span className="font-mono text-xs text-emerald-700">{row.upi}</span>
                    ) : (
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                        Missing
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-mono text-xs text-slate-700">{row.panNumber}</p>
                    <p className="mt-0.5 font-mono text-xs text-slate-500">{row.aadhaarNumber}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDateTime(row.submittedAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(row)}
                      className="cursor-pointer rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {pagination.totalPages > 1 ? (
            <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm">
              <p className="text-slate-500">
                Page {pagination.page} of {pagination.totalPages} · {pagination.total} total
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {selected ? <DetailModal submission={selected} onClose={() => setSelected(null)} /> : null}
    </div>
  )
}

export default KycPage
