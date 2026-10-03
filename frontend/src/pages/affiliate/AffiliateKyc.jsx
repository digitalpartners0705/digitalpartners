import { useEffect, useState } from 'react'
import { getAffiliateKyc, submitAffiliateKyc, updateAffiliateKycUpi } from '../../services/api'

const inputClass =
  'mt-2 w-full rounded-xl border border-white/10 bg-[#0d1018] px-3.5 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-teal-300/40 focus:ring-2 focus:ring-teal-300/10 disabled:cursor-not-allowed disabled:opacity-60'

const EMPTY = {
  accountHolderName: '',
  bankAccountNumber: '',
  ifscCode: '',
  bankName: '',
  branch: '',
  upi: '',
  aadhaarNumber: '',
  panNumber: '',
}

function formatDay(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Field({ label, required, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-slate-300">
          {label}
          {required ? <span className="ml-0.5 text-rose-400">*</span> : null}
        </span>
        {hint ? <span className="text-[11px] font-medium text-slate-500">{hint}</span> : null}
      </span>
      {children}
    </label>
  )
}

function Section({ eyebrow, title, children }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-[#171b27]/90">
      <div className="border-b border-white/10 px-5 py-4 sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300/80">{eyebrow}</p>
        <h2 className="mt-1 text-base font-bold tracking-tight text-white">{title}</h2>
      </div>
      <div className="grid gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">{children}</div>
    </section>
  )
}

function DetailRow({ label, value, className = '' }) {
  return (
    <div className={`rounded-xl border border-white/10 bg-[#10131c]/80 px-4 py-3 ${className}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className="mt-1.5 break-all text-sm font-semibold text-slate-100">{value || '—'}</p>
    </div>
  )
}

function applyKycToForm(nextKyc) {
  return {
    accountHolderName: nextKyc.accountHolderName || '',
    bankAccountNumber: nextKyc.bankAccountNumber || '',
    ifscCode: nextKyc.ifscCode || '',
    bankName: nextKyc.bankName || '',
    branch: nextKyc.branch || '',
    upi: nextKyc.upi || '',
    aadhaarNumber: nextKyc.aadhaarNumber || '',
    panNumber: nextKyc.panNumber || '',
  }
}

function AffiliateKyc() {
  const [form, setForm] = useState(EMPTY)
  const [kyc, setKyc] = useState(null)
  const [locked, setLocked] = useState(false)
  const [canAddUpi, setCanAddUpi] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingUpi, setSavingUpi] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    getAffiliateKyc()
      .then((payload) => {
        if (!active) return
        setLocked(Boolean(payload.locked || payload.submitted))
        setCanAddUpi(Boolean(payload.canAddUpi || payload.kyc?.canAddUpi))
        setKyc(payload.kyc || null)
        if (payload.kyc) setForm(applyKycToForm(payload.kyc))
        setError('')
      })
      .catch((err) => {
        if (!active) return
        setError(err.response?.data?.message || 'Could not load KYC details')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const setField = (key) => (event) => {
    let value = event.target.value
    if (key === 'ifscCode' || key === 'panNumber') value = value.toUpperCase()
    if (key === 'bankAccountNumber' || key === 'aadhaarNumber') value = value.replace(/\D/g, '')
    setForm((current) => ({ ...current, [key]: value }))
  }

  const onSave = async (event) => {
    event.preventDefault()
    if (locked) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload = await submitAffiliateKyc({
        accountHolderName: form.accountHolderName.trim(),
        bankAccountNumber: form.bankAccountNumber.trim(),
        ifscCode: form.ifscCode.trim(),
        bankName: form.bankName.trim(),
        branch: form.branch.trim(),
        upi: form.upi.trim(),
        aadhaarNumber: form.aadhaarNumber.trim(),
        panNumber: form.panNumber.trim(),
      })
      setLocked(true)
      setCanAddUpi(Boolean(payload.canAddUpi || payload.kyc?.canAddUpi))
      setKyc(payload.kyc)
      setForm(applyKycToForm(payload.kyc))
      setMessage(payload.message || 'KYC saved successfully.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save KYC details')
    } finally {
      setSaving(false)
    }
  }

  const onSaveUpi = async (event) => {
    event.preventDefault()
    if (!canAddUpi) return
    setSavingUpi(true)
    setError('')
    setMessage('')
    try {
      const payload = await updateAffiliateKycUpi(form.upi.trim())
      setCanAddUpi(false)
      setKyc(payload.kyc)
      setForm(applyKycToForm(payload.kyc))
      setMessage(payload.message || 'UPI saved successfully.')
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save UPI')
    } finally {
      setSavingUpi(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#171b27]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(45,212,191,0.16),transparent_42%),radial-gradient(ellipse_at_bottom_left,rgba(245,193,74,0.1),transparent_48%)]"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7 sm:py-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-300/80">Payout verification</p>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">KYC</h1>
            <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-400">
              Share your bank and ID details once. We use them for affiliate payouts.
            </p>
          </div>
          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
              locked
                ? 'bg-teal-400/15 text-teal-200 ring-teal-300/30'
                : 'bg-amber-400/10 text-amber-100 ring-amber-300/25'
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${locked ? 'bg-teal-300' : 'bg-amber-300'}`} />
            {locked ? `Submitted ${formatDay(kyc?.submittedAt)}` : 'Not submitted yet'}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#171b27] px-6 py-16 text-center text-sm text-slate-400">
          Loading KYC…
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {!locked ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
              Check every field carefully — after save, bank and ID details stay locked. UPI can be added later if you skip it.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{error}</div>
          ) : null}
          {message ? (
            <div className="rounded-2xl border border-teal-400/25 bg-teal-400/10 px-4 py-3 text-sm text-teal-100">{message}</div>
          ) : null}

          {locked ? (
            <div className="space-y-4">
              <Section eyebrow="01" title="Bank account">
                <DetailRow label="Account holder name" value={form.accountHolderName} />
                <DetailRow label="Bank account number" value={form.bankAccountNumber} />
                <DetailRow label="IFSC code" value={form.ifscCode} />
                <DetailRow label="Bank name" value={form.bankName} />
                <DetailRow label="Branch" value={form.branch} />
                {canAddUpi ? (
                  <form onSubmit={onSaveUpi} className="sm:col-span-2">
                    <Field label="UPI" hint="Optional — add anytime">
                      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                        <input
                          value={form.upi}
                          onChange={setField('upi')}
                          className={`${inputClass} mt-0`}
                          disabled={savingUpi}
                          placeholder="name@bank"
                        />
                        <button
                          type="submit"
                          disabled={savingUpi || !form.upi.trim()}
                          className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-teal-300 px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingUpi ? 'Saving…' : 'Save UPI'}
                        </button>
                      </div>
                    </Field>
                  </form>
                ) : (
                  <DetailRow label="UPI" value={form.upi} />
                )}
              </Section>
              <Section eyebrow="02" title="Identity">
                <DetailRow label="Aadhaar number" value={form.aadhaarNumber} />
                <DetailRow label="PAN number" value={form.panNumber} />
              </Section>
            </div>
          ) : (
            <form onSubmit={onSave} className="space-y-4">
              <Section eyebrow="01" title="Bank account">
                <Field label="Account holder name" required className="sm:col-span-2">
                  <input
                    value={form.accountHolderName}
                    onChange={setField('accountHolderName')}
                    className={inputClass}
                    required
                    disabled={saving}
                    autoComplete="name"
                    placeholder="Name as on the bank account"
                  />
                </Field>
                <Field label="Bank account number" required>
                  <input
                    value={form.bankAccountNumber}
                    onChange={setField('bankAccountNumber')}
                    className={inputClass}
                    required
                    disabled={saving}
                    inputMode="numeric"
                    placeholder="9–18 digits"
                  />
                </Field>
                <Field label="IFSC code" required>
                  <input
                    value={form.ifscCode}
                    onChange={setField('ifscCode')}
                    className={inputClass}
                    required
                    disabled={saving}
                    maxLength={11}
                    placeholder="ABCD0123456"
                  />
                </Field>
                <Field label="Bank name" required>
                  <input
                    value={form.bankName}
                    onChange={setField('bankName')}
                    className={inputClass}
                    required
                    disabled={saving}
                    placeholder="e.g. HDFC Bank"
                  />
                </Field>
                <Field label="Branch" required>
                  <input
                    value={form.branch}
                    onChange={setField('branch')}
                    className={inputClass}
                    required
                    disabled={saving}
                    placeholder="Branch name or city"
                  />
                </Field>
                <Field label="UPI" hint="Optional" className="sm:col-span-2">
                  <input
                    value={form.upi}
                    onChange={setField('upi')}
                    className={inputClass}
                    disabled={saving}
                    placeholder="name@bank"
                  />
                </Field>
              </Section>

              <Section eyebrow="02" title="Identity documents">
                <Field label="Aadhaar number" required>
                  <input
                    value={form.aadhaarNumber}
                    onChange={setField('aadhaarNumber')}
                    className={inputClass}
                    required
                    disabled={saving}
                    inputMode="numeric"
                    maxLength={12}
                    placeholder="12-digit Aadhaar"
                  />
                </Field>
                <Field label="PAN number" required>
                  <input
                    value={form.panNumber}
                    onChange={setField('panNumber')}
                    className={inputClass}
                    required
                    disabled={saving}
                    maxLength={10}
                    placeholder="ABCDE1234F"
                  />
                </Field>
              </Section>

              <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#171b27] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-400">
                  Bank and ID details can be submitted only once. UPI can be added later if you leave it blank.
                </p>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-teal-300 px-5 py-2.5 text-sm font-bold text-slate-900 transition hover:bg-teal-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save KYC details'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

export default AffiliateKyc
