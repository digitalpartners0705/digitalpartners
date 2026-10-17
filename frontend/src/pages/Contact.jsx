import { useState } from 'react'
import AuthModal from '../components/AuthModal'
import Navbar from '../components/Navbar'
import SiteFooter from '../components/SiteFooter'
import { useAuth } from '../context/AuthContext'
import { SOCIALS } from '../data/community'
import { sendContactMessage } from '../services/api'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const fieldClass =
  'w-full rounded-lg border border-[#d5dbe6] bg-white px-3.5 py-2.5 text-sm text-[#12203a] outline-none transition placeholder:text-slate-400 focus:border-[#e0a31a] focus:ring-2 focus:ring-[#f6d98a]'

const contactDetails = [
  {
    label: 'Email',
    value: 'support@digitalvidhya.com',
    href: 'mailto:support@digitalvidhya.com',
    icon: 'mail',
  },
  {
    label: 'Phone',
    value: '+91 98765 43210',
    href: 'tel:+919876543210',
    icon: 'phone',
  },
  {
    label: 'WhatsApp',
    value: 'Chat with us',
    href: 'https://wa.me/919876543210',
    icon: 'chat',
  },
]

function DetailIcon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    className: 'h-5 w-5',
    'aria-hidden': true,
  }

  if (name === 'phone') {
    return (
      <svg {...common}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.6 4.8c.5-.5 1.3-.6 1.9-.2l2 1.3c.6.4.8 1.2.5 1.9l-.8 1.7c-.2.4-.1.9.2 1.2l3.1 3.1c.3.3.8.4 1.2.2l1.7-.8c.7-.3 1.5-.1 1.9.5l1.3 2c.4.6.3 1.4-.2 1.9l-1.1 1.1c-.6.6-1.4.8-2.2.6-2-.5-4.8-2.3-7.3-4.8S4.6 10.7 4.1 8.7c-.2-.8 0-1.6.6-2.2l1.1-1.1Z"
        />
      </svg>
    )
  }

  if (name === 'chat') {
    return (
      <svg {...common}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.5 19.5 4 21l1.2-3.5A7.8 7.8 0 1 1 12 19.8a8 8 0 0 1-4.5-.3Z"
        />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="m5 7 7 5.5L19 7" />
    </svg>
  )
}

function SocialIcon({ id }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    className: 'h-4 w-4',
    'aria-hidden': true,
  }

  if (id === 'facebook') {
    return (
      <svg {...common}>
        <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.6l.4-3H14V9Z" />
      </svg>
    )
  }

  if (id === 'instagram') {
    return (
      <svg {...common}>
        <path d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9A4.5 4.5 0 0 1 16.5 21h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm0 1.8A2.7 2.7 0 0 0 4.8 7.5v9a2.7 2.7 0 0 0 2.7 2.7h9a2.7 2.7 0 0 0 2.7-2.7v-9a2.7 2.7 0 0 0-2.7-2.7h-9Zm9.75 1.35a1.05 1.05 0 1 1 0 2.1 1.05 1.05 0 0 1 0-2.1ZM12 8.25A3.75 3.75 0 1 1 12 15.75 3.75 3.75 0 0 1 12 8.25Zm0 1.8A1.95 1.95 0 1 0 12 14a1.95 1.95 0 0 0 0-3.95Z" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M22.5 7.2a2.7 2.7 0 0 0-1.9-1.9C18.9 5 12 5 12 5s-6.9 0-8.6.3A2.7 2.7 0 0 0 1.5 7.2 28.4 28.4 0 0 0 1.2 12a28.4 28.4 0 0 0 .3 4.8 2.7 2.7 0 0 0 1.9 1.9C5.1 19 12 19 12 19s6.9 0 8.6-.3a2.7 2.7 0 0 0 1.9-1.9A28.4 28.4 0 0 0 22.8 12a28.4 28.4 0 0 0-.3-4.8ZM10 15.2V8.8l5.6 3.2L10 15.2Z" />
    </svg>
  )
}

function Contact() {
  const { authOpen, authMode, signupDefaults, setAuthMode, closeAuth, handleAuthSuccess } = useAuth()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  const updateField = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '', form: '' }))
    setSent(false)
  }

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!EMAIL_PATTERN.test(form.email.trim())) next.email = 'Enter a valid email address'
    if (!form.message.trim()) next.message = 'Message is required'
    else if (form.message.trim().length < 10) next.message = 'Please write at least 10 characters'
    return next
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validate()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)
    try {
      await sendContactMessage(form)
      setSent(true)
      setForm({ name: '', email: '', phone: '', message: '' })
    } catch (error) {
      setErrors({ form: error.response?.data?.message || 'Could not send your message. Please try again later.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-ink-950 pt-28 text-white sm:pt-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.25),transparent_48%),radial-gradient(ellipse_at_85%_20%,rgba(245,193,74,0.14),transparent_40%)]" />
          <div className="relative mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">Contact</p>
            <h1 className="mt-3 font-[Plus_Jakarta_Sans,Inter,sans-serif] text-3xl font-extrabold tracking-tight sm:text-5xl">
              Let’s start a <span className="gold-text">conversation.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Have a question about packages, mentorship, or your account? Send us a message and our team will get back
              to you soon.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.25fr] lg:gap-10">
            <aside className="space-y-5">
              <div className="rounded-2xl bg-ink-950 p-6 text-white shadow-lg ring-1 ring-white/10 sm:p-7">
                <h2 className="text-xl font-bold">Contact details</h2>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Reach Digital Vidhya through any of the channels below. We usually reply within one business day.
                </p>

                <ul className="mt-6 space-y-4">
                  {contactDetails.map((item) => {
                    const content = (
                      <>
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 text-gold-400 ring-1 ring-white/10">
                          <DetailIcon name={item.icon} />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                            {item.label}
                          </span>
                          <span className="mt-1 block text-sm font-semibold text-white">{item.value}</span>
                        </span>
                      </>
                    )

                    return (
                      <li key={item.label}>
                        {item.href ? (
                          <a
                            href={item.href}
                            target={item.href.startsWith('http') ? '_blank' : undefined}
                            rel={item.href.startsWith('http') ? 'noreferrer' : undefined}
                            className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-white/5"
                          >
                            {content}
                          </a>
                        ) : (
                          <div className="flex items-center gap-3 rounded-xl p-2">{content}</div>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Visit</h3>
                <p className="mt-3 text-base font-semibold text-slate-900">Digital Vidhya HQ</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Learning & Growth Hub
                  <br />
                  India
                </p>

                <div className="mt-5 border-t border-slate-100 pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Follow us</p>
                  <div className="mt-3 flex flex-wrap gap-2.5">
                    {SOCIALS.map((social) => (
                      <a
                        key={social.id}
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={social.name}
                        className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition hover:opacity-90 ${social.tone}`}
                      >
                        <SocialIcon id={social.id} />
                        {social.name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            <div className="rounded-2xl border border-[#f3e2b3] bg-[#fffdf8] p-6 shadow-sm sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c48a09]">Send a message</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#10203c]">Contact form</h2>
              <p className="mt-1.5 text-sm text-slate-500">Fill in the details below and we’ll respond shortly.</p>

              {sent ? (
                <p className="mt-5 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">
                  Thanks for reaching out. Your message has been received.
                </p>
              ) : null}

              {errors.form ? (
                <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errors.form}</p>
              ) : null}

              <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-3.5">
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <div>
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Full name</span>
                    <input
                      type="text"
                      name="name"
                      autoComplete="name"
                      placeholder="Your full name"
                      value={form.name}
                      onChange={updateField}
                      className={fieldClass}
                    />
                    {errors.name ? <p className="mt-1.5 text-xs text-red-600">{errors.name}</p> : null}
                  </div>
                  <div>
                    <span className="mb-1.5 block text-sm font-medium text-slate-700">Email</span>
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={form.email}
                      onChange={updateField}
                      className={fieldClass}
                    />
                    {errors.email ? <p className="mt-1.5 text-xs text-red-600">{errors.email}</p> : null}
                  </div>
                </div>

                <div>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Phone</span>
                  <input
                    type="tel"
                    name="phone"
                    autoComplete="tel"
                    placeholder="Optional"
                    value={form.phone}
                    onChange={updateField}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">Message</span>
                  <textarea
                    name="message"
                    rows={5}
                    placeholder="Write your message here..."
                    value={form.message}
                    onChange={updateField}
                    className={`${fieldClass} resize-y`}
                  />
                  {errors.message ? <p className="mt-1.5 text-xs text-red-600">{errors.message}</p> : null}
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#e8a317] py-3 text-sm font-bold text-[#1a1404] shadow-sm transition hover:bg-[#d79610] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? 'Sending...' : 'Send message'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />

      <AuthModal
        isOpen={authOpen}
        mode={authMode}
        signupDefaults={signupDefaults}
        onModeChange={setAuthMode}
        onClose={closeAuth}
        onSuccess={handleAuthSuccess}
      />
    </div>
  )
}

export default Contact
