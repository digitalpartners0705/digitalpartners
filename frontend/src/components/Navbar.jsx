import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const links = [
  { label: 'Home', href: '/#home' },
  { label: 'Courses', href: '/#courses' },
  { label: 'About', href: '/#about' },
  { label: 'Blog', href: '/#blog' },
  { label: 'Contact', href: '/#contact' },
]

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white shadow-sm">
        D
      </span>
      <span className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
        Digital Expert
      </span>
    </Link>
  )
}

function Navbar() {
  const { openAuth } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const handleNavClick = () => setMenuOpen(false)

  const authButtons = (
    <>
      <button
        type="button"
        onClick={() => openAuth('login')}
        className="rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 transition hover:bg-slate-50 hover:text-brand-600"
      >
        Login
      </button>
      <button
        type="button"
        onClick={() => openAuth('signup')}
        className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
      >
        Sign Up
      </button>
    </>
  )

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Logo />

        <ul className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="text-sm font-medium text-slate-600 transition hover:text-brand-600">
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">{authButtons}</div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 ring-1 ring-slate-200 md:hidden"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      <div
        className={`overflow-hidden border-t border-slate-200 bg-white transition-all duration-300 md:hidden ${
          menuOpen ? 'max-h-[28rem] opacity-100' : 'max-h-0 border-t-0 opacity-0'
        }`}
      >
        <ul className="flex flex-col gap-1 px-4 py-3">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                onClick={handleNavClick}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 border-t border-slate-100 px-4 py-3">
          <button
            type="button"
            onClick={() => {
              handleNavClick()
              openAuth('login')
            }}
            className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200"
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              handleNavClick()
              openAuth('signup')
            }}
            className="w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
          >
            Sign Up
          </button>
        </div>
      </div>
    </header>
  )
}

export default Navbar
