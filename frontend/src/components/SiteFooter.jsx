import { Link } from 'react-router-dom'
import { SOCIALS as SOCIAL_PAGES } from '../data/community'

const QUICK_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Packages', to: '/#courses' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

const PACKAGE_LINKS = [
  { label: 'Social Expert', to: '/packages/social-expert' },
  { label: 'Ads Expert', to: '/packages/ads-expert' },
  { label: 'AI Premium Expert', to: '/packages/ai-premium-expert' },
]

const SOCIALS = SOCIAL_PAGES.map((social) => ({ id: social.id, label: social.name, href: social.href }))

function SocialIcon({ id }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'currentColor',
    className: 'h-[18px] w-[18px]',
    'aria-hidden': true,
  }

  if (id === 'instagram') {
    return (
      <svg {...common}>
        <path d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9A4.5 4.5 0 0 1 16.5 21h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm0 1.8A2.7 2.7 0 0 0 4.8 7.5v9a2.7 2.7 0 0 0 2.7 2.7h9a2.7 2.7 0 0 0 2.7-2.7v-9a2.7 2.7 0 0 0-2.7-2.7h-9Zm9.75 1.35a1.05 1.05 0 1 1 0 2.1 1.05 1.05 0 0 1 0-2.1ZM12 8.25A3.75 3.75 0 1 1 12 15.75 3.75 3.75 0 0 1 12 8.25Zm0 1.8A1.95 1.95 0 1 0 12 14a1.95 1.95 0 0 0 0-3.95Z" />
      </svg>
    )
  }

  if (id === 'youtube') {
    return (
      <svg {...common}>
        <path d="M22.5 7.2a2.7 2.7 0 0 0-1.9-1.9C18.9 5 12 5 12 5s-6.9 0-8.6.3A2.7 2.7 0 0 0 1.5 7.2 28.4 28.4 0 0 0 1.2 12a28.4 28.4 0 0 0 .3 4.8 2.7 2.7 0 0 0 1.9 1.9C5.1 19 12 19 12 19s6.9 0 8.6-.3a2.7 2.7 0 0 0 1.9-1.9A28.4 28.4 0 0 0 22.8 12a28.4 28.4 0 0 0-.3-4.8ZM10 15.2V8.8l5.6 3.2L10 15.2Z" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.6l.4-3H14V9Z" />
    </svg>
  )
}

function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#0b1020] text-slate-300">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold-400/80 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(232,163,23,0.12),transparent_42%),radial-gradient(ellipse_at_bottom_right,rgba(56,189,248,0.1),transparent_40%)]" />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:px-8">
        <div className="md:col-span-2 lg:col-span-1">
          <Link to="/" className="group inline-flex items-center gap-2" aria-label="Digital Vidhya home">
            <img
              src="/assets/Digital-Vidhya-logo-trim.png"
              alt="Digital Vidhya"
              className="h-14 w-auto object-contain transition duration-300 group-hover:scale-105"
            />
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
            An online learning platform for career-ready skills, expert mentors, and real-world projects.
          </p>
          <a
            href="mailto:support@digitalvidhya.com"
            className="group mt-5 inline-flex items-center gap-2 text-sm font-medium text-gold-300 transition hover:text-gold-200"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold-300/30 bg-gold-300/10 transition duration-300 group-hover:scale-110 group-hover:border-gold-300/70">
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7.5h16v9H4v-9Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 8 7.5 6 7.5-6" />
              </svg>
            </span>
            support@digitalvidhya.com
          </a>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
            Quick links
            <span className="mt-2 block h-0.5 w-8 rounded-full bg-gold-400/80" />
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {QUICK_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="group inline-flex items-center gap-2 text-slate-400 transition duration-300 hover:text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-gold-400 opacity-0 transition duration-300 group-hover:opacity-100" />
                  <span className="relative">
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gold-300 transition-all duration-300 group-hover:w-full" />
                  </span>
                  <span className="translate-x-0 text-gold-300 opacity-0 transition duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
            Packages
            <span className="mt-2 block h-0.5 w-8 rounded-full bg-sky-400/80" />
          </h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {PACKAGE_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="group inline-flex items-center gap-2 text-slate-400 transition duration-300 hover:text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-sky-400 opacity-0 transition duration-300 group-hover:opacity-100" />
                  <span className="relative">
                    {link.label}
                    <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-sky-300 transition-all duration-300 group-hover:w-full" />
                  </span>
                  <span className="text-sky-300 opacity-0 transition duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden="true">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white">
            Follow us
            <span className="mt-2 block h-0.5 w-8 rounded-full bg-gold-400/80" />
          </h3>
          <p className="mt-4 text-sm leading-6 text-slate-400">Updates, tips, and learner stories across our channels.</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {SOCIALS.map((social) => (
              <a
                key={social.id}
                href={social.href}
                target="_blank"
                rel="noreferrer"
                aria-label={social.label}
                title={social.label}
                className="group inline-flex h-11 items-center gap-0 overflow-hidden rounded-full border border-white/10 bg-white/[0.04] px-3 text-slate-200 transition duration-300 hover:-translate-y-1 hover:gap-2 hover:border-gold-300/50 hover:bg-gold-300/10 hover:px-3.5 hover:text-gold-200 hover:shadow-[0_10px_24px_rgba(245,193,74,0.18)]"
              >
                <SocialIcon id={social.id} />
                <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium opacity-0 transition-all duration-300 group-hover:max-w-24 group-hover:opacity-100">
                  {social.label}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Digital Vidhya. All rights reserved.</p>
          <p className="flex items-center gap-2 text-slate-500">
            {['Learn', 'Build', 'Earn'].map((word, index) => (
              <span key={word} className="flex items-center gap-2">
                {index > 0 ? <span aria-hidden="true">·</span> : null}
                <span className="transition duration-300 hover:-translate-y-0.5 hover:text-gold-300">{word}</span>
              </span>
            ))}
          </p>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
