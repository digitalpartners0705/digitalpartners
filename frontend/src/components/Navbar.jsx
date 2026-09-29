import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { label: 'Home', href: '#home' },
  { label: 'Courses', href: '#courses' },
  { label: 'About Us', href: '#about' },
  { label: 'Contact', href: '#contact' },
]

function isCurrent(href, hash) {
  const current = hash || '#home'
  if (href === '#home') return current === '#home' || current === '#'
  return current === href
}

function Logo() {
  return (
    <Link to="/" className="shrink-0" aria-label="Digital Aarambh home">
      <img src="/assets/logo.png" alt="Digital Aarambh" className="h-16 w-auto sm:h-20" />
    </Link>
  )
}

function Navbar() {
  const { openAuth } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [hash, setHash] = useState(() => (typeof window === 'undefined' ? '#home' : window.location.hash))
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash)
    const syncScroll = () => setScrolled(window.scrollY > 8)
    syncScroll()
    window.addEventListener('hashchange', syncHash)
    window.addEventListener('scroll', syncScroll, { passive: true })
    return () => {
      window.removeEventListener('hashchange', syncHash)
      window.removeEventListener('scroll', syncScroll)
    }
  }, [])

  const handleNavClick = (href) => {
    setMenuOpen(false)
    setHash(href)
  }

  const authButtons = (fullWidth) => (
    <>
      <button
        type="button"
        onClick={() => {
          setMenuOpen(false)
          openAuth('login')
        }}
        className={`${fullWidth ? 'w-full' : ''} rounded-full border border-white/25 px-5 py-2 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5`}
      >
        Login
      </button>
      <button
        type="button"
        onClick={() => {
          setMenuOpen(false)
          openAuth('signup')
        }}
        className={`${fullWidth ? 'w-full' : ''} rounded-full bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 px-5 py-2 text-sm font-bold text-[#1a1203] shadow-[0_8px_20px_rgba(245,193,74,0.28)] transition hover:brightness-105`}
      >
        Register
      </button>
    </>
  )

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors ${
        scrolled || menuOpen ? 'bg-ink-950' : 'bg-transparent'
      }`}
    >
      <nav className="relative mx-auto flex max-w-7xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
        <Logo />

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-12 lg:flex xl:gap-20">
          {links.map((link) => {
            const active = isCurrent(link.href, hash)
            return (
              <li key={link.label}>
                <a
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => handleNavClick(link.href)}
                  className={`text-sm font-medium transition ${
                    active
                      ? 'border-b-2 border-gold-400 pb-1 text-gold-400'
                      : 'text-white/75 hover:text-white'
                  }`}
                >
                  {link.label}
                </a>
              </li>
            )
          })}
        </ul>

        <div className="flex items-center justify-end gap-3">
          <div className="hidden items-center gap-3 lg:flex">{authButtons(false)}</div>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-white ring-1 ring-white/15 lg:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      <div
        className={`absolute inset-x-0 top-full z-40 overflow-hidden border-white/10 bg-ink-950 shadow-2xl transition-all duration-300 lg:hidden ${
          menuOpen ? 'max-h-[40rem] border-t opacity-100' : 'pointer-events-none max-h-0 opacity-0'
        }`}
      >
        <ul className="flex flex-col gap-1 px-4 py-3">
          {links.map((link) => {
            const active = isCurrent(link.href, hash)
            return (
              <li key={link.label}>
                <a
                  href={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                    active ? 'bg-white/5 text-gold-400' : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {link.label}
                </a>
              </li>
            )
          })}
        </ul>
        <div className="flex flex-col gap-2 border-t border-white/10 px-4 py-3">{authButtons(true)}</div>
      </div>
    </header>
  )
}

export default Navbar
