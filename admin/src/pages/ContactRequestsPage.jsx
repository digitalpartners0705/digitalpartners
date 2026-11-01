import { useCallback, useEffect, useState } from 'react'
import api from '../services/api'
import { exportToExcel } from '../utils/exportExcel'

const statusTabs = [
  { id: 'all', label: 'All' },
  { id: 'pending', label: 'Pending' },
  { id: 'resolved', label: 'Resolved' },
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
    tone === 'warning'
      ? 'text-amber-700'
      : tone === 'success'
      ? 'text-emerald-700'
      : 'text-slate-900'

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

function StatusBadge({ status }) {
  const isResolved = status === 'resolved'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        isResolved
          ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
          : 'bg-amber-50 text-amber-700 ring-amber-200'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isResolved ? 'bg-emerald-500' : 'bg-amber-500'}`}
      />
      {isResolved ? 'Resolved' : 'Pending'}
    </span>
  )
}

function DetailModal({ request, onClose, onUpdate, onDelete }) {
  const [status, setStatus] = useState(request.status)
  const [adminNotes, setAdminNotes] = useState(request.adminNotes || '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onUpdate(request.id, { status, adminNotes })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this contact request?')) return
    setDeleting(true)
    try {
      await onDelete(request.id)
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl sm:p-7 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900">Contact Request</h2>
              <StatusBadge status={status} />
            </div>
            <p className="mt-1 text-xs text-slate-500">Received on {formatDateTime(request.createdAt)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 rounded-xl bg-slate-50 p-4 border border-slate-200/60">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">User Name</p>
              <p className="mt-1 text-sm font-bold text-slate-900">{request.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Email Address</p>
              <a
                href={`mailto:${request.email}`}
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              >
                {request.email}
                <span className="text-xs text-slate-400">✉</span>
              </a>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Phone</p>
              {request.phone ? (
                <div className="mt-1 flex items-center gap-3">
                  <a
                    href={`tel:${request.phone}`}
                    className="text-sm font-semibold text-slate-900 hover:underline"
                  >
                    {request.phone}
                  </a>
                  <a
                    href={`https://wa.me/${request.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    WhatsApp ↗
                  </a>
                </div>
              ) : (
                <p className="mt-1 text-sm text-slate-400">Not provided</p>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Resolved Date</p>
              <p className="mt-1 text-sm text-slate-700">{formatDateTime(request.resolvedAt)}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">User Message</p>
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-800 whitespace-pre-wrap max-h-48 overflow-y-auto">
              {request.message}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Resolution Status</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold border transition ${
                  status === 'pending'
                    ? 'border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-400/30'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Mark Pending
              </button>
              <button
                type="button"
                onClick={() => setStatus('resolved')}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold border transition ${
                  status === 'resolved'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-400/30'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                Mark Resolved
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Admin Notes / Action Taken
            </label>
            <textarea
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Called user on WhatsApp, resolved query regarding Ads course..."
              className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div className="mt-7 flex items-center justify-between border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
          >
            {deleting ? 'Deleting...' : 'Delete Request'}
          </button>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-brand-600 px-5 py-2 text-sm font-bold text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
            >
              {saving ? 'Saving...' : 'Save & Close'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ContactRequestsPage() {
  const [requests, setRequests] = useState([])
  const [stats, setStats] = useState({ total: 0, pending: 0, resolved: 0, today: 0 })
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 1 })
  const [activeTab, setActiveTab] = useState('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState(null)

  const loadRequests = useCallback(async () => {
    setLoading(true)
    try {
      const response = await api.get('/api/admin/contact-requests', {
        params: {
          status: activeTab,
          search: search.trim() || undefined,
          page: pagination.page,
          pageSize: pagination.pageSize,
        },
      })
      setRequests(response.data.requests || [])
      setStats(response.data.stats || { total: 0, pending: 0, resolved: 0, today: 0 })
      setPagination(response.data.pagination || { page: 1, pageSize: 20, total: 0, totalPages: 1 })
    } catch (error) {
      console.error('Error loading contact requests:', error)
    } finally {
      setLoading(false)
    }
  }, [activeTab, search, pagination.page, pagination.pageSize])

  useEffect(() => {
    loadRequests()
  }, [loadRequests])

  const handleUpdate = async (id, payload) => {
    try {
      const response = await api.patch(`/api/admin/contact-requests/${id}`, payload)
      if (response.data.request) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? response.data.request : r))
        )
      }
      loadRequests()
    } catch (error) {
      alert('Failed to update request: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/admin/contact-requests/${id}`)
      setRequests((prev) => prev.filter((r) => r.id !== id))
      loadRequests()
    } catch (error) {
      alert('Failed to delete request: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleQuickStatusToggle = async (request, event) => {
    event.stopPropagation()
    const nextStatus = request.status === 'resolved' ? 'pending' : 'resolved'
    await handleUpdate(request.id, { status: nextStatus, adminNotes: request.adminNotes })
  }

  const handleDownloadExcel = async () => {
    setExporting(true)
    try {
      // Fetch all matching records without pagination
      const response = await api.get('/api/admin/contact-requests', {
        params: {
          status: activeTab,
          search: search.trim() || undefined,
          export: true,
        },
      })

      const allRows = response.data.requests || []
      const dateStr = new Date().toISOString().split('T')[0]

      const headers = [
        { label: 'Request ID', key: 'id' },
        { label: 'Full Name', key: 'name' },
        { label: 'Email', key: 'email' },
        { label: 'Phone', key: 'phone' },
        { label: 'Status', getter: (r) => r.status.toUpperCase() },
        { label: 'Message', key: 'message' },
        { label: 'Admin Notes', key: 'adminNotes' },
        { label: 'Submitted At', getter: (r) => formatDateTime(r.createdAt) },
        { label: 'Resolved At', getter: (r) => formatDateTime(r.resolvedAt) },
      ]

      exportToExcel(`digital-vidhya-contact-requests-${dateStr}`, headers, allRows)
    } catch (error) {
      alert('Failed to download Excel file: ' + (error.response?.data?.message || error.message))
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Contact queries</h1>
          <p className="mt-1 text-sm text-slate-500">
            View, manage, and resolve messages and help requests from the website contact form.
          </p>
        </div>

        {/* Download Excel Button */}
        <button
          type="button"
          onClick={handleDownloadExcel}
          disabled={exporting || loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
          title="Download contact requests as Excel file"
        >
          <ExcelIcon />
          <span>{exporting ? 'Preparing Excel...' : 'Download Excel'}</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Requests" value={stats.total} hint="All-time submissions" />
        <StatCard
          label="Pending Help"
          value={stats.pending}
          hint="Needs attention"
          tone={stats.pending > 0 ? 'warning' : 'default'}
        />
        <StatCard label="Resolved" value={stats.resolved} hint="Successfully answered" tone="success" />
        <StatCard label="Received Today" value={stats.today} hint="Last 24 hours" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        {/* Status Tabs */}
        <div className="flex items-center rounded-lg bg-slate-100 p-1">
          {statusTabs.map((tab) => {
            const count =
              tab.id === 'all' ? stats.total : tab.id === 'pending' ? stats.pending : stats.resolved
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id)
                  setPagination((p) => ({ ...p, page: 1 }))
                }}
                className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-bold transition ${
                  active
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                    active ? 'bg-slate-100 text-slate-800' : 'bg-slate-200/60 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPagination((p) => ({ ...p, page: 1 }))
            }}
            placeholder="Search by name, email, phone, message..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-brand-500 focus:ring-1 focus:ring-brand-400"
          />
        </div>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 bg-slate-50/75 text-xs font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-5 py-3.5">User</th>
                <th className="px-4 py-3.5">Phone</th>
                <th className="px-4 py-3.5">Message</th>
                <th className="px-4 py-3.5">Date</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400">
                    Loading contact requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center">
                    <p className="text-base font-semibold text-slate-700">No contact requests found</p>
                    <p className="mt-1 text-sm text-slate-400">
                      {search ? 'Try clearing your search query.' : 'New submissions will appear here automatically.'}
                    </p>
                  </td>
                </tr>
              ) : (
                requests.map((request) => (
                  <tr
                    key={request.id}
                    onClick={() => setSelectedRequest(request)}
                    className="cursor-pointer transition hover:bg-slate-50/80"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                          {request.name.trim().charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">{request.name}</p>
                          <p className="truncate text-xs text-slate-500">{request.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {request.phone ? (
                        <span className="text-sm text-slate-800 font-medium">{request.phone}</span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4 max-w-xs">
                      <p className="truncate text-sm text-slate-600" title={request.message}>
                        {request.message}
                      </p>
                      {request.adminNotes ? (
                        <p className="mt-0.5 truncate text-[11px] text-brand-600 font-medium">
                          Note: {request.adminNotes}
                        </p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500">
                      {formatDateTime(request.createdAt)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleQuickStatusToggle(request, e)}
                          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                            request.status === 'resolved'
                              ? 'text-amber-700 hover:bg-amber-50'
                              : 'text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title={request.status === 'resolved' ? 'Reopen as pending' : 'Mark as resolved'}
                        >
                          {request.status === 'resolved' ? 'Reopen' : 'Resolve'}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedRequest(request)
                          }}
                          className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700 hover:bg-slate-200"
                        >
                          View
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-sm text-slate-500">
            <p>
              Showing page <span className="font-bold text-slate-700">{pagination.page}</span> of{' '}
              <span className="font-bold text-slate-700">{pagination.totalPages}</span> ({pagination.total} total)
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="rounded-lg border border-slate-200 px-3 py-1 font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="rounded-lg border border-slate-200 px-3 py-1 font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Detail & Resolution Modal */}
      {selectedRequest ? (
        <DetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      ) : null}
    </div>
  )
}

export default ContactRequestsPage
