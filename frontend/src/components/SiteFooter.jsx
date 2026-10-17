import { Link } from 'react-router-dom'

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

const SOCIALS = [
  {
    id: 'instagram',
    label: 'Instagram',
    href: 'https://instagram.com',
  },
  {
    id: 'youtube',
    label: 'YouTube',
    href: 'https://youtube.com',
  },
  {
    id: 'facebook',
    label: 'Facebook',
    href: 'https://facebook.com',
  },
  {
    id: 'linkedin',
    label: 'LinkedIn',
    href: 'https://linkedin.com',
  },
]

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

  if (id === 'facebook') {
    return (
      <svg {...common}>
        <path d="M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v7h3v-7h2.6l.4-3H14V9Z" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M6.5 9h2.2v9H6.5V9Zm1.1-3.4a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6ZM10.8 9h2.1v1.2h.1c.3-.6 1.1-1.3 2.3-1.3 2.4 0 2.9 1.6 2.9 3.7V18h-2.2v-4.5c0-1.1 0-2.5-1.5-2.5s-1.8 1.2-1.8 2.4V18h-2.2V9Z" />
    </svg>
  )
}

function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-[#0b1020] text-slate-300">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(232,163,23,0.08),transparent_42%),radial-gradient(ellipse_at_bottom_right,rgba(56,189,248,0.08),transparent_40%)]" />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:px-8">
        <div className="md:col-span-2 lg:col-span-1">
          <Link to="/" className="inline-flex items-center gap-2" aria-label="Digital Vidhya home">
            <img src="/assets/Digital-Vidhya-logo.png" alt="Digital Vidhya" className="h-12 w-auto object-contain" />
            <span className="brand-wordmark brand-wordmark-on-dark">
              <span className="brand-wordmark-digital">Digital</span>
              <span className="brand-wordmark-vidhya">Vidhya</span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
            An online learning platform for career-ready skills, expert mentors, and real-world projects.
          </p>
          <a
            href="mailto:support@digitalvidhya.com"
            className="mt-5 inline-flex text-sm font-medium text-gold-300 transition hover:text-gold-200"
          >
            support@digitalvidhya.com
          </a>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white">Quick links</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {QUICK_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="text-slate-400 transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white">Packages</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            {PACKAGE_LINKS.map((link) => (
              <li key={link.label}>
                <Link to={link.to} className="text-slate-400 transition hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-white">Follow us</h3>
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
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 transition hover:border-gold-300/40 hover:bg-gold-300/10 hover:text-gold-200"
              >
                <SocialIcon id={social.id} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} Digital Vidhya. All rights reserved.</p>
          <p className="text-slate-500">Learn · Build · Earn</p>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
