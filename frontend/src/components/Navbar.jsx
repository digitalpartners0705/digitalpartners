import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { KNOWLEDGE_PACKAGES } from '../data/signupOptions'
import { PACKAGE_SLUGS } from '../utils/referral'

const links = [
  { label: 'Home', to: '/', hash: '#home' },
  { label: 'Packages', to: '/', hash: '#courses', dropdown: true },
  { label: 'About Us', to: '/about' },
  { label: 'Contact', to: '/contact' },
]

const packageLinks = KNOWLEDGE_PACKAGES.map((name) => ({
  label: name,
  to: `/packages/${PACKAGE_SLUGS[name]}`,
}))

function Logo() {
  return (
    <Link to="/" className="shrink-0" aria-label="Digital Vidhya home">
      <img src="/assets/Digital-Vidhya-logo-trim.png" alt="Digital Vidhya" className="h-10 w-auto sm:h-12" />
    </Link>
  )
}

function Chevron({ open }) {
  return (
    <svg
      className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function linkHref(link) {
  if (!link.hash) return link.to
  return `${link.to}${link.hash}`
}

function Navbar() {
  const { openAuth } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [packagesOpen, setPackagesOpen] = useState(false)
  const [mobilePackagesOpen, setMobilePackagesOpen] = useState(false)
  const [hash, setHash] = useState(() => (typeof window === 'undefined' ? '#home' : window.location.hash))
  const [scrolled, setScrolled] = useState(false)
  const packagesRef = useRef(null)
  const onHome = location.pathname === '/'
  const onAbout = location.pathname === '/about'
  const onContact = location.pathname === '/contact'
  const onPackage = location.pathname.startsWith('/packages/')
  const solidHeader = scrolled || menuOpen || onAbout || onContact || onPackage

  useEffect(() => {
    const syncHash = () => setHash(window.location.hash)
    const syncScroll = () => setScrolled(window.scrollY > 8)
    syncHash()
    syncScroll()
    window.addEventListener('hashchange', syncHash)
    window.addEventListener('scroll', syncScroll, { passive: true })
    return () => {
      window.removeEventListener('hashchange', syncHash)
      window.removeEventListener('scroll', syncScroll)
    }
  }, [location.pathname])

  useEffect(() => {
    if (!packagesOpen) return undefined
    const onPointerDown = (event) => {
      if (packagesRef.current && !packagesRef.current.contains(event.target)) {
        setPackagesOpen(false)
      }
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setPackagesOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [packagesOpen])

  const isActive = (link) => {
    if (link.to === '/about') return onAbout
    if (link.to === '/contact') return onContact
    if (link.dropdown) return onPackage || (onHome && (hash === '#courses'))
    if (!onHome) return false
    const current = hash || '#home'
    if (link.hash === '#home') return current === '#home' || current === '' || current === '#'
    return current === link.hash
  }

  const closeMenus = () => {
    setMenuOpen(false)
    setPackagesOpen(false)
    setMobilePackagesOpen(false)
  }

  const handleSectionClick = (link) => {
    closeMenus()
    if (link.hash) setHash(link.hash)
  }

  const authButtons = (fullWidth) => (
    <>
      <button
        type="button"
        onClick={() => {
          closeMenus()
          openAuth('login')
        }}
        className={`${fullWidth ? 'w-full' : ''} rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white transition duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/5`}
      >
        Login
      </button>
      <button
        type="button"
        onClick={() => {
          closeMenus()
          openAuth('signup')
        }}
        className={`${fullWidth ? 'w-full' : ''} rounded-full bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 px-5 py-2.5 text-sm font-bold text-[#1a1203] shadow-[0_8px_20px_rgba(245,193,74,0.28)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(245,193,74,0.42)] hover:brightness-105`}
      >
        Register
      </button>
    </>
  )

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-5 lg:px-8">
      <div className="relative mx-auto max-w-7xl">
      <nav
        className={`relative flex items-center justify-between rounded-2xl border px-4 py-2.5 transition-all duration-300 sm:px-5 ${
          solidHeader
            ? 'border-white/10 bg-ink-950/90 shadow-[0_18px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl'
            : 'border-transparent bg-transparent shadow-none'
        }`}
      >
        <Logo />

        <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex xl:gap-2">
          {links.map((link) => {
            const active = isActive(link)
            if (link.dropdown) {
              return (
                <li key={link.label} className="relative" ref={packagesRef}>
                  <button
                    type="button"
                    aria-expanded={packagesOpen}
                    aria-haspopup="menu"
                    onClick={() => setPackagesOpen((open) => !open)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition duration-300 xl:px-5 ${
                      active || packagesOpen
                        ? 'bg-white/10 text-gold-300 shadow-[inset_0_0_0_1px_rgba(245,193,74,0.3)]'
                        : 'text-white/75 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {link.label}
                    <Chevron open={packagesOpen} />
                  </button>
                  {packagesOpen ? (
                    <div
                      role="menu"
                      className="absolute left-1/2 top-full z-50 mt-4 w-60 -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-ink-950/95 p-2 shadow-[0_20px_44px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                    >
                      {packageLinks.map((item) => (
                        <Link
                          key={item.label}
                          to={linkHref(item)}
                          role="menuitem"
                          onClick={() => handleSectionClick(item)}
                          className="block rounded-xl px-4 py-2.5 text-sm font-medium text-white/80 transition duration-200 hover:translate-x-0.5 hover:bg-white/5 hover:text-gold-300"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </li>
              )
            }

            return (
              <li key={link.label}>
                <Link
                  to={linkHref(link)}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => handleSectionClick(link)}
                  className={`inline-flex rounded-full px-4 py-2 text-sm font-medium transition duration-300 xl:px-5 ${
                    active
                      ? 'bg-white/10 text-gold-300 shadow-[inset_0_0_0_1px_rgba(245,193,74,0.3)]'
                      : 'text-white/75 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
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
        className={`absolute inset-x-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border-white/10 bg-ink-950/95 shadow-[0_20px_44px_rgba(0,0,0,0.5)] backdrop-blur-xl transition-all duration-300 lg:hidden ${
          menuOpen ? 'max-h-[40rem] border opacity-100' : 'pointer-events-none max-h-0 opacity-0'
        }`}
      >
        <ul className="flex flex-col gap-1 px-4 py-3">
          {links.map((link) => {
            const active = isActive(link)
            if (link.dropdown) {
              return (
                <li key={link.label}>
                  <button
                    type="button"
                    aria-expanded={mobilePackagesOpen}
                    onClick={() => setMobilePackagesOpen((open) => !open)}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium ${
                      active || mobilePackagesOpen
                        ? 'bg-white/5 text-gold-400'
                        : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {link.label}
                    <Chevron open={mobilePackagesOpen} />
                  </button>
                  {mobilePackagesOpen ? (
                    <ul className="mt-1 space-y-0.5 border-l border-white/10 pl-3">
                      {packageLinks.map((item) => (
                        <li key={item.label}>
                          <Link
                            to={linkHref(item)}
                            onClick={() => handleSectionClick(item)}
                            className="block rounded-lg px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-gold-400"
                          >
                            {item.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              )
            }

            return (
              <li key={link.label}>
                <Link
                  to={linkHref(link)}
                  onClick={() => handleSectionClick(link)}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium ${
                    active ? 'bg-white/5 text-gold-400' : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>
        <div className="flex flex-col gap-2 border-t border-white/10 px-4 py-3">{authButtons(true)}</div>
      </div>
      </div>
    </header>
  )
}

export default Navbar
