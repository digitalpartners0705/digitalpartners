import { Link } from 'react-router-dom'
import AuthModal from '../components/AuthModal'
import Navbar from '../components/Navbar'
import SiteFooter from '../components/SiteFooter'
import { useAuth } from '../context/AuthContext'
import { KNOWLEDGE_PACKAGES } from '../data/signupOptions'

const values = [
  {
    title: 'Practical learning',
    detail: 'Every package is built around real campaigns, tools, and workflows you can use from day one.',
  },
  {
    title: 'Mentor guidance',
    detail: 'Learn with clear structure, expert instruction, and support when you need direction.',
  },
  {
    title: 'Career-ready skills',
    detail: 'Build proof of work across social, ads, and AI so you can grow faster in digital careers.',
  },
]

function About() {
  const { authOpen, authMode, signupDefaults, setAuthMode, closeAuth, handleAuthSuccess } = useAuth()

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 antialiased">
      <Navbar />

      <main>
        <section className="relative overflow-hidden bg-ink-950 pt-28 text-white sm:pt-32">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.25),transparent_48%),radial-gradient(ellipse_at_85%_20%,rgba(245,193,74,0.14),transparent_40%)]" />
          <div className="relative mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold-300">About us</p>
            <h1 className="mt-3 font-[Plus_Jakarta_Sans,Inter,sans-serif] text-3xl font-extrabold tracking-tight sm:text-5xl">
              Building careers with <span className="gold-text">Digital Vidhya.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
              We help learners and creators master modern digital skills through structured packages, practical
              projects, and mentor-led guidance.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold tracking-tight text-[#10203c] sm:text-3xl">Who we are</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Digital Vidhya is an online learning platform focused on career-ready digital skills. From social media
              and paid ads to AI-powered workflows, our programs are designed to take you from fundamentals to
              confident execution.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Whether you are starting fresh or leveling up, we give you a clear path: enroll, learn, practice, and get
              certified — with support along the way.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {values.map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl bg-ink-950 p-6 text-white sm:p-8">
            <h2 className="text-xl font-bold sm:text-2xl">Our packages</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Choose a focused path based on where you want to grow next.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {KNOWLEDGE_PACKAGES.map((name) => (
                <li
                  key={name}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-gold-300"
                >
                  {name}
                </li>
              ))}
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/#courses"
                className="rounded-full bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 px-5 py-2.5 text-sm font-bold text-[#1a1203] transition hover:brightness-105"
              >
                Explore packages
              </Link>
              <Link
                to="/contact"
                className="rounded-full border border-white/25 px-5 py-2.5 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/5"
              >
                Contact us
              </Link>
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

export default About
