import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SiteFooter from '../components/SiteFooter'
import { packagePath } from '../data/packages'

const heroStats = [
  { value: '100+', label: 'Expert Mentors', icon: 'mentors', tone: 'text-gold-400' },
  { value: '50+', label: 'Professional Courses', icon: 'book', tone: 'text-sky-400' },
  { value: '10K+', label: 'Learners', icon: 'learners', tone: 'text-sky-400' },
  { value: '4.8/5', label: 'Learner Rating', icon: 'star', tone: 'text-gold-400' },
]

const knowledgePackages = [
  {
    id: 'social-expert',
    name: 'Social Expert',
    shortLabel: 'SOCIAL',
    description: 'Master social media and content creation to start earning online with confidence.',
    price: 9999,
    theme: 'ink',
  },
  {
    id: 'ads-expert',
    name: 'Ads & Creative Expert',
    shortLabel: 'ADS',
    description: 'Learn Meta & Google ads, funnels, and lead generation to scale your reach.',
    price: 19999,
    theme: 'silver',
    badge: 'Most Popular',
  },
  {
    id: 'ai-premium-expert',
    name: 'AI & Business Expert',
    shortLabel: 'AI BUSINESS',
    description: 'Combine AI tools, ads, and monetization into one complete earning ecosystem.',
    price: 29999,
    theme: 'gold',
    featured: true,
    badge: 'Best Value',
  },
]

const whyChoose = [
  {
    id: 'skills',
    title: 'Learn What Matters Today, Lead What’s Next',
    detail: 'Industry-focused packages designed to keep you ahead in a fast-changing digital world.',
    tone: 'bg-[#e7f6ef]',
    accent: 'bg-[#1f9d6a]',
    glow: 'bg-[#1f9d6a]',
    icon: 'rocket',
  },
  {
    id: 'transform',
    title: 'Not Just Certificates, Real Transformation',
    detail: 'Build practical skills that open real career opportunities — not just paper achievements.',
    tone: 'bg-[#fff4e8]',
    accent: 'bg-[#e09a12]',
    glow: 'bg-[#e09a12]',
    icon: 'certificate',
  },
  {
    id: 'mentors',
    title: 'Mentorship That Moves You Forward',
    detail: 'Get personal guidance from experienced mentors who care about your progress.',
    tone: 'bg-[#fdecec]',
    accent: 'bg-[#e11d48]',
    glow: 'bg-[#e11d48]',
    icon: 'mentor',
  },
  {
    id: 'growth',
    title: 'Built for Dreamers & Doers',
    detail: 'Whether you’re starting out or leveling up, Digital Vidhya supports every phase.',
    tone: 'bg-[#eef1fb]',
    accent: 'bg-[#2563eb]',
    glow: 'bg-[#2563eb]',
    icon: 'flag',
  },
]

const instructors = [
  {
    name: 'Ananya Sharma',
    title: 'Social Growth Mentor',
    focus: 'Content systems, Instagram & personal branding',
    initials: 'AS',
    photo: '/assets/mentors/ananya.jpg',
    tone: 'from-[#0b3d38] to-[#14685c]',
    chip: 'Social',
  },
  {
    name: 'Rohan Mehta',
    title: 'Paid Ads Specialist',
    focus: 'Meta Ads, Google campaigns & lead funnels',
    initials: 'RM',
    photo: '/assets/mentors/rohan.jpg',
    tone: 'from-[#10203c] to-[#1e3a5f]',
    chip: 'Ads',
  },
  {
    name: 'Neha Kapoor',
    title: 'AI & Automation Coach',
    focus: 'AI tools, workflows and marketing automation',
    initials: 'NK',
    photo: '/assets/mentors/neha.jpg',
    tone: 'from-[#c48a09] to-[#e0a317]',
    chip: 'AI',
  },
  {
    name: 'Arjun Desai',
    title: 'Freelance Career Mentor',
    focus: 'Client acquisition, offers & delivery systems',
    initials: 'AD',
    photo: '/assets/mentors/arjun.jpg',
    tone: 'from-[#0f2744] to-[#245b8a]',
    chip: 'Career',
  },
]

const testimonials = [
  {
    quote: 'Digital Vidhya helped me switch careers in six months. The projects felt like real work, not busywork.',
    name: 'Aisha Patel',
    role: 'Junior Developer',
    rating: 5,
  },
  {
    quote: 'Clear lessons, great mentors, and a community that actually replies when you get stuck.',
    name: 'Diego Alvarez',
    role: 'Data Analyst',
    rating: 5,
  },
  {
    quote: 'I landed my first design internship after finishing the UI/UX track. Worth every week I put in.',
    name: 'Mina Park',
    role: 'Product Designer',
    rating: 4,
  },
]

const faqs = [
  {
    question: 'Do I need prior experience to start?',
    answer: 'No. Beginner tracks start from the basics, and you can skip ahead if you already know the fundamentals.',
  },
  {
    question: 'Are the certificates recognized?',
    answer: 'Yes. Each completed path includes a shareable certificate you can add to LinkedIn and your resume.',
  },
  {
    question: 'Can I learn at my own pace?',
    answer: 'Absolutely. All courses are self-paced, with lifetime access to the lessons you enroll in.',
  },
  {
    question: 'What if a course is not the right fit?',
    answer: 'Package purchases are final and non-refundable. You keep lifetime access to the courses included in the package you buy.',
  },
  {
    question: 'Do you offer mentor support?',
    answer: 'Paid tracks include mentor Q&A, project reviews, and community channels so you never learn in isolation.',
  },
]

function Stars({ count }) {
  return (
    <div className="flex gap-0.5 text-amber-400" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index}>{index < count ? '★' : '☆'}</span>
      ))}
    </div>
  )
}

function TestimonialCard({ item }) {
  return (
    <blockquote className="h-full rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
      <Stars count={item.rating} />
      <p className="mt-4 text-lg leading-8 text-slate-100">&ldquo;{item.quote}&rdquo;</p>
      <footer className="mt-5">
        <p className="font-semibold">{item.name}</p>
        <p className="text-sm text-indigo-200">{item.role}</p>
      </footer>
    </blockquote>
  )
}

const rupees = (value) => `₹${value.toLocaleString('en-IN')}`

function PackageBox({ label, accent }) {
  return (
    <div className="relative mx-auto w-[9.5rem] shrink-0 sm:w-[11rem]" aria-hidden="true">
      <div
        className="absolute -right-1 top-3 h-[78%] w-4 rounded-r-md opacity-90"
        style={{ background: accent.spine }}
      />
      <div
        className="relative overflow-hidden rounded-xl border border-black/40 shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
        style={{
          background: 'linear-gradient(145deg, #2a2d33 0%, #121418 55%, #0a0b0d 100%)',
          aspectRatio: '3 / 4',
        }}
      >
        <div
          className="absolute inset-y-0 left-0 w-2.5"
          style={{ background: accent.spine }}
        />
        <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/10 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-0 transition duration-500 group-hover:opacity-100 group-focus-within:opacity-100" />
        <div className="flex h-full flex-col justify-between p-4 pl-5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">Digital Vidhya</p>
          <p
            className="font-[Plus_Jakarta_Sans,Inter,sans-serif] text-lg font-extrabold leading-tight tracking-tight sm:text-xl"
            style={{ color: accent.label }}
          >
            {label}
          </p>
          <div className="h-1 w-10 rounded-full" style={{ background: accent.spine }} />
        </div>
      </div>
    </div>
  )
}

function BuyNowButton({ onClick, dark }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-sm font-bold transition duration-300 hover:brightness-110 group-hover:gap-3.5 group-focus-within:gap-3.5 ${
        dark ? 'bg-[#10203c] text-white' : 'bg-ink-950 text-white'
      }`}
    >
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#10203c] transition duration-300 group-hover:translate-x-0.5 group-focus-within:translate-x-0.5">
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5 transition duration-300 group-hover:translate-x-px group-hover:-translate-y-px group-focus-within:translate-x-px group-focus-within:-translate-y-px" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 15 15 5M8 5h7v7" />
        </svg>
      </span>
      Buy Now
    </button>
  )
}

const packageThemes = {
  ink: {
    card: 'bg-[#0b3d38] text-white',
    muted: 'text-white/75',
    spine: '#f5c14a',
    label: '#f5c14a',
    buttonDark: false,
  },
  silver: {
    card: 'bg-[#e8eaee] text-[#10203c]',
    muted: 'text-[#40506c]',
    spine: '#c48a09',
    label: '#f5c14a',
    buttonDark: true,
  },
  gold: {
    card: 'bg-[#f0c14d] text-[#1a1203]',
    muted: 'text-[#4a3808]',
    spine: '#10203c',
    label: '#ffe7a3',
    buttonDark: true,
    glow: 'shadow-[0_0_0_1px_rgba(245,193,74,0.35),0_0_48px_rgba(245,193,74,0.35)]',
  },
}

function WhyIcon({ name }) {
  const common = {
    viewBox: '0 0 48 48',
    className: 'h-10 w-10',
    'aria-hidden': true,
  }

  if (name === 'rocket') {
    return (
      <svg {...common} fill="none">
        <path d="M24 6c6 4 10 12 10 20v4l-4 2-2 6h-8l-2-6-4-2v-4c0-8 4-16 10-20Z" fill="#ff8a4c" />
        <circle cx="24" cy="20" r="3.5" fill="#fff" />
        <path d="M18 36c1.5 3 4 5 6 5s4.5-2 6-5" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" />
        <path d="m14 28-4 2c1 3 3 5 5 6l3-4M34 28l4 2c-1 3-3 5-5 6l-3-4" fill="#fb923c" />
      </svg>
    )
  }

  if (name === 'certificate') {
    return (
      <svg {...common} fill="none">
        <rect x="12" y="8" width="24" height="28" rx="3" fill="#fff" stroke="#c4b5a0" strokeWidth="1.5" />
        <path d="M18 16h12M18 21h12M18 26h8" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
        <circle cx="30" cy="34" r="7" fill="#f5c14a" />
        <path d="m27.5 34 1.7 1.7 3.5-3.8" stroke="#10203c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name === 'mentor') {
    return (
      <svg {...common} fill="none">
        <path d="M16 34c2-8 6-12 8-14 2 2 6 6 8 14" fill="#fde68a" />
        <path d="M24 10c5 3 8 8 9 14-3 1-6 1-9 0-3 1-6 1-9 0 1-6 4-11 9-14Z" fill="#fbbf24" />
        <circle cx="24" cy="20" r="3" fill="#fff7ed" />
        <path d="M18 36c2 2 4 3 6 3s4-1 6-3" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />
        <path d="M24 28v5" stroke="#15803d" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg {...common} fill="none">
      <path d="M10 34h6v6h-6V34Zm10-8h6v14h-6V26Zm10-8h6v22h-6V18Z" fill="#38bdf8" />
      <path d="m14 22 10-10 6 6 8-8" stroke="#0ea5e9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="38" cy="10" r="3" fill="#2563eb" />
    </svg>
  )
}

function StatIcon({ name, className = 'h-8 w-8' }) {
  if (name === 'book') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5.2A2.2 2.2 0 0 1 7.2 3H19v15.5H7.2A2.2 2.2 0 0 0 5 20.7V5.2Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 5.2A2.2 2.2 0 0 1 7.2 7.4H19" />
      </svg>
    )
  }

  if (name === 'star') {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
        <path d="m12 3.2 2.7 5.8 6.3.6-4.8 4.1 1.5 6.1L12 16.8 6.3 19.8l1.5-6.1L3 9.6l6.3-.6L12 3.2Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M8.5 11a2.7 2.7 0 1 0-2.7-2.7A2.7 2.7 0 0 0 8.5 11Zm7 0a2.7 2.7 0 1 0-2.7-2.7A2.7 2.7 0 0 0 15.5 11ZM8.6 12.4c-2.6 0-5.6 1.3-5.6 3.8V18h7.4a5.4 5.4 0 0 1 .8-3.1 7.2 7.2 0 0 0-2.6-2.5Zm6.9 0c-.5 0-1 .1-1.4.2a4.8 4.8 0 0 1 2.3 4.2c.1.4.1.8.1 1.2H21v-1.4c0-2.5-3-3.8-5.5-3.8Z" />
    </svg>
  )
}

function Home() {
  const navigate = useNavigate()
  const packsRef = useRef(null)
  const mentorsRef = useRef(null)
  const whyRef = useRef(null)
  const faqRef = useRef(null)
  const [openFaq, setOpenFaq] = useState(0)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [quoteMotion, setQuoteMotion] = useState('idle')
  const [quoteSliding, setQuoteSliding] = useState(false)
  const quoteSlidingRef = useRef(false)
  const quoteDirectionRef = useRef('next')
  const quoteSwipeRef = useRef({ x: 0, y: 0, active: false })
  const [packsVisible, setPacksVisible] = useState(false)
  const [mentorsVisible, setMentorsVisible] = useState(false)
  const [whyVisible, setWhyVisible] = useState(false)
  const [faqVisible, setFaqVisible] = useState(false)

  const visibleTestimonials = [
    testimonials[activeTestimonial],
    testimonials[(activeTestimonial + 1) % testimonials.length],
  ]
  const upcomingTestimonials = [
    testimonials[(activeTestimonial + 2) % testimonials.length],
    testimonials[(activeTestimonial + 3) % testimonials.length],
  ]
  const previousTestimonials = [
    testimonials[(activeTestimonial - 2 + testimonials.length) % testimonials.length],
    testimonials[(activeTestimonial - 1 + testimonials.length) % testimonials.length],
  ]
  const quotePages = quoteMotion === 'prev'
    ? [previousTestimonials, visibleTestimonials]
    : [visibleTestimonials, upcomingTestimonials]
  const quoteShifted = quoteMotion === 'prev' ? !quoteSliding : quoteSliding

  const startQuoteSlide = (direction) => {
    if (quoteSlidingRef.current) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const step = direction === 'prev' ? -2 : 2
      setActiveTestimonial((index) => (index + step + testimonials.length) % testimonials.length)
      return
    }
    quoteSlidingRef.current = true
    quoteDirectionRef.current = direction
    if (direction === 'next') {
      setQuoteMotion('next')
      setQuoteSliding(true)
      return
    }
    setQuoteMotion('prev')
    setQuoteSliding(false)
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setQuoteSliding(true))
    })
  }

  const finishQuoteSlide = (event) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform') return
    if (!quoteSlidingRef.current) return
    const step = quoteDirectionRef.current === 'prev' ? -2 : 2
    quoteSlidingRef.current = false
    setActiveTestimonial((index) => (index + step + testimonials.length) % testimonials.length)
    setQuoteMotion('idle')
    setQuoteSliding(false)
  }

  const handleQuotePointerDown = (event) => {
    quoteSwipeRef.current = { x: event.clientX, y: event.clientY, active: true }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleQuotePointerUp = (event) => {
    if (!quoteSwipeRef.current.active) return
    const dx = event.clientX - quoteSwipeRef.current.x
    const dy = event.clientY - quoteSwipeRef.current.y
    quoteSwipeRef.current.active = false
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy)) return
    startQuoteSlide(dx < 0 ? 'next' : 'prev')
  }

  useEffect(() => {
    const node = packsRef.current
    if (!node) return undefined

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) {
      setPacksVisible(true)
      setMentorsVisible(true)
      setWhyVisible(true)
      setFaqVisible(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          if (entry.target === packsRef.current) setPacksVisible(true)
          if (entry.target === mentorsRef.current) setMentorsVisible(true)
          if (entry.target === whyRef.current) setWhyVisible(true)
          if (entry.target === faqRef.current) setFaqVisible(true)
        })
      },
      { threshold: 0.22 },
    )

    observer.observe(node)
    if (mentorsRef.current) observer.observe(mentorsRef.current)
    if (whyRef.current) observer.observe(whyRef.current)
    if (faqRef.current) observer.observe(faqRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      startQuoteSlide('next')
    }, 3000)

    return () => window.clearInterval(intervalId)
  }, [])

  const handleBuy = (packageId) => {
    navigate(packagePath(packageId))
  }

  return (
    <main>
      <section id="home" className="relative overflow-hidden bg-ink-950 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(37,99,235,0.22),transparent_46%),radial-gradient(ellipse_at_72%_42%,rgba(14,165,233,0.14),transparent_40%)]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 sm:pt-32 lg:px-8 lg:pb-16">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-6">
            <div>
              <p className="hero-rise inline-flex items-center gap-2 rounded-full border border-[#2c4d7c] bg-[#0c1c34] px-4 py-1.5 text-sm font-medium text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-sky-300" fill="currentColor" aria-hidden="true">
                  <path d="M12 3 1.5 8.2 12 13.4 20 9.3v6.2h1.6V8.6L12 3Zm-5.2 9.1v3.2c0 1.6 2.3 3.2 5.2 3.2s5.2-1.6 5.2-3.2v-3.2L12 14.7l-5.2-2.6Z" />
                </svg>
                Practical Skills for a Better Tomorrow
              </p>
              <h1 className="mt-6 font-[Plus_Jakarta_Sans,Inter,sans-serif] text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.45rem]">
                <span className="hero-rise block" style={{ animationDelay: '0.12s' }}>Learn Skills.</span>
                <span className="hero-rise block" style={{ animationDelay: '0.24s' }}>
                  Build <span className="gold-text hero-gold-live">Your Career.</span>
                </span>
                <span className="hero-rise block" style={{ animationDelay: '0.36s' }}>
                  <span className="gold-text hero-gold-live">Earn Online.</span>
                </span>
              </h1>
              <p className="hero-rise mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-[17px]" style={{ animationDelay: '0.48s' }}>
                Learn practical digital skills from industry experts and turn your knowledge into real career
                opportunities, freelance projects and online income.
              </p>

              <div className="hero-rise" style={{ animationDelay: '0.6s' }}>
                <a
                  href="#courses"
                  className="hero-cta mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 px-6 py-3 text-sm font-bold text-[#1a1203] shadow-[0_10px_28px_rgba(245,193,74,0.32)] transition hover:brightness-105"
                >
                  Explore Courses
                  <span aria-hidden="true">→</span>
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="pointer-events-none absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2" aria-hidden="true">
                <div className="hero-glow h-72 w-72 rounded-full bg-sky-500/30 blur-3xl" />
              </div>
              <div className="pointer-events-none absolute left-[64%] top-[18%] -translate-x-1/2" aria-hidden="true">
                <div className="hero-glow h-44 w-44 rounded-full bg-gold-400/25 blur-3xl" style={{ animationDelay: '1.1s' }} />
              </div>

              <span className="hero-particle pointer-events-none absolute left-[6%] top-[10%] h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,0.95)]" aria-hidden="true" />
              <span className="hero-particle pointer-events-none absolute right-[8%] top-[6%] h-1.5 w-1.5 rounded-full bg-gold-300 shadow-[0_0_14px_rgba(245,193,74,0.95)]" style={{ animationDelay: '0.7s' }} aria-hidden="true" />
              <span className="hero-particle pointer-events-none absolute bottom-[16%] left-[4%] h-1.5 w-1.5 rounded-full bg-white/90 shadow-[0_0_12px_rgba(255,255,255,0.8)]" style={{ animationDelay: '1.3s' }} aria-hidden="true" />
              <span className="hero-particle pointer-events-none absolute right-[3%] top-[46%] h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_14px_rgba(56,189,248,0.9)]" style={{ animationDelay: '0.4s' }} aria-hidden="true" />

              <div className="hero-float relative">
                <div
                  className="pointer-events-none absolute z-20"
                  style={{ left: '40%', top: '1%', width: '36%', aspectRatio: '1 / 1' }}
                  aria-hidden="true"
                >
                  <div className="hero-orbit relative h-full w-full">
                    <span className="absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-300 shadow-[0_0_16px_5px_rgba(245,193,74,0.9)]" />
                    <span className="absolute bottom-[4%] right-[6%] h-2 w-2 rounded-full bg-sky-300 shadow-[0_0_14px_4px_rgba(56,189,248,0.9)]" />
                  </div>
                  <div className="hero-orbit-slow absolute inset-[10%]">
                    <span className="absolute left-0 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_10px_3px_rgba(255,255,255,0.8)]" />
                  </div>
                </div>

                <img
                  src="/assets/hero.png"
                  alt="Digital Vidhya platform on a laptop, with courses, mentors, and certificates"
                  className="relative z-10 w-full object-contain"
                />

                <div className="hero-bob absolute left-[6%] top-[2%] z-30 flex items-center gap-2.5 rounded-2xl border border-white/15 bg-[#07111f]/80 px-3 py-2 shadow-[0_14px_32px_rgba(0,0,0,0.4)] backdrop-blur-md sm:left-[8%] sm:px-3.5 lg:left-[2%]" aria-hidden="true">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-400/15 text-gold-300">
                    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                      <path d="m12 3.2 2.4 5.2 5.7.5-4.3 3.7 1.3 5.5L12 15.4 6.9 18.1l1.3-5.5L3.9 8.9l5.7-.5L12 3.2Z" />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-gold-300">Trending</span>
                    <span className="block text-xs font-bold text-white sm:text-sm">AI & Ads tracks</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-rise mt-6 rounded-2xl border border-white/10 bg-[#07111f]/80 py-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur" style={{ animationDelay: '0.45s' }}>
            <div className="hero-marquee-viewport">
              <div className="hero-marquee">
                {[0, 1].map((copy) => (
                  <div key={copy} className="hero-marquee-group" aria-hidden={copy === 1}>
                    {heroStats.map((stat) => (
                      <div key={`${stat.label}-${copy}`} className="flex shrink-0 items-center gap-3 border-r border-white/10 px-5 lg:min-w-0 lg:flex-1 lg:justify-center lg:px-4">
                        <span className={`shrink-0 ${stat.tone}`}>
                          <StatIcon name={stat.icon} />
                        </span>
                        <div>
                          <p className="text-xl font-extrabold text-white sm:text-2xl">{stat.value}</p>
                          <p className="whitespace-nowrap text-xs text-slate-400 sm:text-sm">{stat.label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" ref={whyRef} className="relative overflow-hidden bg-[#f7f8fa]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className={`mx-auto mb-12 max-w-3xl text-center ${whyVisible ? 'pack-rise' : 'motion-safe:translate-y-6 motion-safe:opacity-0'}`}>
            <h2 className="font-[Plus_Jakarta_Sans,Inter,sans-serif] text-3xl font-extrabold tracking-tight text-[#10203c] sm:text-4xl">
              Why Learners Choose Digital Vidhya
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {whyChoose.map((item, index) => (
              <div key={item.id} className="why-card h-full">
                <article
                  className={`group relative h-full overflow-hidden rounded-[1.75rem] bg-white p-1.5 shadow-[0_16px_40px_rgba(16,32,60,0.08)] transition duration-300 hover:shadow-[0_28px_50px_rgba(16,32,60,0.16)] ${
                    whyVisible ? 'pack-rise' : 'motion-safe:translate-y-8 motion-safe:opacity-0'
                  }`}
                  style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                >
                  <div className={`relative flex h-full flex-col items-center overflow-hidden rounded-[1.4rem] px-5 pb-8 pt-7 text-center ${item.tone}`}>
                    <span className={`why-glow pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full blur-2xl ${item.glow}`} aria-hidden="true" />
                    <span className={`absolute inset-x-6 top-0 h-1.5 origin-center scale-x-40 rounded-full transition duration-500 group-hover:scale-x-100 ${item.accent}`} aria-hidden="true" />
                    <p className="text-[11px] font-extrabold tracking-[0.2em] text-[#10203c]/35">0{index + 1}</p>
                    <span className="why-icon relative mt-4" style={{ animationDelay: `${index * 0.35}s` }}>
                      <span className={`absolute inset-0 scale-90 rounded-full opacity-30 blur-md transition duration-500 group-hover:scale-125 group-hover:opacity-70 ${item.accent}`} aria-hidden="true" />
                      <span className="relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-white shadow-[0_10px_24px_rgba(16,32,60,0.12)] ring-4 ring-white transition duration-500 group-hover:scale-110 group-hover:shadow-[0_16px_30px_rgba(16,32,60,0.18)]">
                        <WhyIcon name={item.icon} />
                      </span>
                    </span>
                    <h3 className="relative mt-5 text-base font-bold leading-snug text-[#10203c] sm:text-[17px]">
                      {item.title}
                    </h3>
                    <p className="relative mt-3 text-sm leading-6 text-slate-600">{item.detail}</p>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="courses" ref={packsRef} className="relative overflow-hidden bg-[#0b1220] text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,193,74,0.08),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(15,23,42,0.9),transparent_50%)]" />
        <div className="pack-orb pointer-events-none absolute -left-16 top-24 h-56 w-56 rounded-full bg-gold-400/10 blur-3xl" aria-hidden="true" />
        <div className="pack-orb pointer-events-none absolute -right-10 bottom-10 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" style={{ animationDelay: '1.4s' }} aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className={`max-w-2xl ${packsVisible ? 'pack-rise' : 'motion-safe:translate-y-6 motion-safe:opacity-0'}`}>
              <h2 className="font-[Plus_Jakarta_Sans,Inter,sans-serif] text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                Knowledge Packs
              </h2>
              <p className="mt-3 text-base leading-7 text-slate-300">
                Choose your path, build in-demand skills, and start creating income online.
              </p>
            </div>

            <div className={`inline-flex w-fit items-center rounded-full bg-white/10 p-1 ring-1 ring-white/10 ${packsVisible ? 'pack-rise' : 'motion-safe:translate-y-6 motion-safe:opacity-0'}`} style={{ animationDelay: '0.12s' }}>
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#10203c]">
                Knowledge Packages
                <span className="pack-count flex h-6 w-6 items-center justify-center rounded-full bg-ink-950 text-xs font-bold text-white">
                  {knowledgePackages.length}
                </span>
              </span>
            </div>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {knowledgePackages.map((pkg, index) => {
              const theme = packageThemes[pkg.theme]
              const lightText = pkg.theme === 'ink'

              return (
                <div
                  key={pkg.id}
                  className="pack-card group h-full"
                >
                <article
                  className={`relative flex h-full flex-col overflow-hidden rounded-[1.75rem] p-6 sm:p-7 lg:min-h-[34rem] ${theme.card} ${
                    pkg.featured ? 'pack-glow' : ''
                  } ${packsVisible ? 'pack-rise' : 'motion-safe:translate-y-8 motion-safe:opacity-0'}`}
                  style={{ animationDelay: `${0.16 + index * 0.12}s` }}
                >
                  <span
                    className="pointer-events-none absolute inset-x-6 top-0 z-10 h-1 origin-left scale-x-0 rounded-full transition duration-500 group-hover:scale-x-100 group-focus-within:scale-x-100"
                    style={{ background: theme.spine }}
                    aria-hidden="true"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent_52%)] opacity-0 transition duration-500 group-hover:opacity-100 group-focus-within:opacity-100" aria-hidden="true" />
                  <div className="relative z-10 flex items-start justify-between gap-3">
                    <h3 className="font-[Plus_Jakarta_Sans,Inter,sans-serif] text-2xl font-extrabold tracking-tight sm:text-3xl">
                      {pkg.name}
                    </h3>
                    {pkg.badge ? (
                      <span className="pack-badge shrink-0 rounded-full bg-[#10203c]/12 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-[#10203c]">
                        {pkg.badge}
                      </span>
                    ) : null}
                  </div>

                  <div
                    className="pack-float relative z-10 my-8 flex flex-1 items-center justify-center"
                    style={{ animationDelay: `${index * 0.45}s`, animationDuration: `${4.4 + index * 0.45}s` }}
                  >
                    <div className="pack-book">
                      <PackageBox label={pkg.shortLabel} accent={theme} />
                    </div>
                  </div>

                  <div className="relative z-10">
                    <p className={`text-sm leading-6 ${theme.muted}`}>{pkg.description}</p>
                    <p className={`mt-3 origin-left text-lg font-extrabold transition duration-300 group-hover:scale-105 group-focus-within:scale-105 ${lightText ? 'text-gold-300' : 'text-[#10203c]'}`}>
                      {rupees(pkg.price)}
                    </p>
                    <div className="mt-5">
                      <BuyNowButton dark={!lightText} onClick={() => handleBuy(pkg.id)} />
                    </div>
                  </div>
                </article>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section ref={mentorsRef} className="relative overflow-hidden bg-[#f4f6f9]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_at_top,rgba(245,193,74,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className={`mx-auto max-w-2xl text-center ${mentorsVisible ? 'pack-rise' : 'motion-safe:translate-y-6 motion-safe:opacity-0'}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#c48a09]">Mentors</p>
            <h2 className="mt-3 font-[Plus_Jakarta_Sans,Inter,sans-serif] text-3xl font-extrabold tracking-tight text-[#10203c] sm:text-4xl">
              Learn from industry instructors
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              Get guided by mentors who work with real campaigns, creatives, and clients — not theory alone.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {instructors.map((person, index) => (
              <div
                key={person.name}
                className="mentor-card h-full"
              >
                <article
                  className={`group relative h-full overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white p-6 shadow-[0_10px_30px_rgba(16,32,60,0.06)] transition duration-300 hover:shadow-[0_22px_44px_rgba(16,32,60,0.14)] ${
                    mentorsVisible ? 'pack-rise' : 'motion-safe:translate-y-8 motion-safe:opacity-0'
                  }`}
                  style={{ animationDelay: `${0.12 + index * 0.1}s` }}
                >
                  <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r transition duration-500 group-hover:h-2 ${person.tone}`} />
                  <div className="flex items-start justify-between gap-3">
                    <div className={`relative h-16 w-16 overflow-hidden rounded-2xl bg-gradient-to-br shadow-md ring-2 ring-white transition duration-500 group-hover:ring-4 group-hover:shadow-lg ${person.tone}`}>
                      {person.photo ? (
                        <img
                          src={person.photo}
                          alt={person.name}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-lg font-extrabold text-white">
                          {person.initials}
                        </span>
                      )}
                    </div>
                    <span className="rounded-full bg-[#10203c]/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#10203c] transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-[#10203c] group-hover:text-white">
                      {person.chip}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold tracking-tight text-[#10203c]">{person.name}</h3>
                  <p className="mt-1 text-sm font-semibold text-[#c48a09]">{person.title}</p>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{person.focus}</p>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-16 text-white lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-sm font-semibold text-indigo-300">Testimonials</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">What learners say</h2>
          </div>

          <div
            className="cursor-grab touch-pan-y overflow-hidden active:cursor-grabbing"
            aria-live="polite"
            onPointerDown={handleQuotePointerDown}
            onPointerUp={handleQuotePointerUp}
            onPointerCancel={() => {
              quoteSwipeRef.current.active = false
            }}
          >
            <div
              className="flex w-[200%]"
              style={{
                transform: quoteShifted ? 'translateX(-50%)' : 'translateX(0)',
                transition: quoteSliding ? 'transform 0.75s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
              }}
              onTransitionEnd={finishQuoteSlide}
            >
              {quotePages.map((pair, page) => (
                <div key={page} className="grid w-1/2 shrink-0 grid-cols-1 gap-6 md:grid-cols-2">
                  {pair.map((item) => (
                    <TestimonialCard key={item.name} item={item} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="blog" ref={faqRef} className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <div className={`mb-8 text-center ${faqVisible ? 'faq-grow' : 'motion-safe:scale-75 motion-safe:opacity-0'}`}>
          <p className="text-sm font-semibold text-brand-600">FAQ</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Common questions
          </h2>
        </div>
        <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index
            return (
              <div
                key={faq.question}
                className={faqVisible ? 'faq-grow' : 'motion-safe:scale-75 motion-safe:opacity-0'}
                style={{ animationDelay: `${0.12 + index * 0.08}s` }}
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-semibold text-slate-900">{faq.question}</span>
                  <span className="text-xl text-brand-600">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen ? <p className="faq-grow px-5 pb-5 text-sm leading-6 text-slate-600">{faq.answer}</p> : null}
              </div>
            )
          })}
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}

export default Home
