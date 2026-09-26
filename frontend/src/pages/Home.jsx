import { useState } from 'react'

const stats = [
  { value: '10,000+', label: 'Students' },
  { value: '50+', label: 'Courses' },
  { value: '4.8★', label: 'Rating' },
  { value: '95%', label: 'Success Rate' },
]

const courses = [
  {
    title: 'Full-Stack Web Development',
    description: 'Build modern apps with React, Node.js, and databases from scratch.',
    price: '$49',
    tag: 'Development',
    accent: 'from-indigo-500 to-violet-500',
  },
  {
    title: 'Data Science Bootcamp',
    description: 'Learn Python, analytics, and machine learning with hands-on projects.',
    price: '$79',
    tag: 'Data',
    accent: 'from-sky-500 to-indigo-500',
  },
  {
    title: 'UI/UX Design Mastery',
    description: 'Design beautiful, usable products with Figma and proven design systems.',
    price: '$39',
    tag: 'Design',
    accent: 'from-fuchsia-500 to-brand-600',
  },
]

const steps = [
  { number: '01', title: 'Enroll', detail: 'Pick a course and join in minutes.' },
  { number: '02', title: 'Learn', detail: 'Watch lessons and follow structured paths.' },
  { number: '03', title: 'Practice', detail: 'Apply skills with projects and quizzes.' },
  { number: '04', title: 'Get Certified', detail: 'Earn a certificate you can share.' },
]

const instructors = [
  { name: 'Sarah Chen', title: 'Full-Stack Mentor', initials: 'SC', color: 'bg-indigo-500' },
  { name: 'Marcus Reid', title: 'Data Science Lead', initials: 'MR', color: 'bg-sky-500' },
  { name: 'Priya Nair', title: 'Product Design', initials: 'PN', color: 'bg-fuchsia-500' },
  { name: 'James Okonkwo', title: 'Career Coach', initials: 'JO', color: 'bg-violet-500' },
]

const testimonials = [
  {
    quote: 'Digital Expert helped me switch careers in six months. The projects felt like real work, not busywork.',
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
    answer: 'We offer a 7-day refund window on new enrollments if you have not completed more than 20% of the course.',
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

function Home() {
  const [openFaq, setOpenFaq] = useState(0)
  const [activeTestimonial, setActiveTestimonial] = useState(0)
  const [query, setQuery] = useState('')

  const visibleTestimonials = [
    testimonials[activeTestimonial],
    testimonials[(activeTestimonial + 1) % testimonials.length],
  ]

  return (
    <main>
      <section id="home" className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-violet-50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-brand-700 ring-1 ring-brand-100">
              Learn in-demand skills in 2026
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Learn In-Demand Skills, Build Your Career
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Practical courses, expert mentors, and career-ready projects — all in one place.
              Start today and move from beginner to job-ready at your own pace.
            </p>

            <form
              className="mt-8 flex w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-slate-200"
              onSubmit={(event) => event.preventDefault()}
            >
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search courses, skills, or careers"
                className="w-full border-0 bg-transparent px-4 py-3.5 text-sm outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="m-1.5 rounded-xl bg-brand-600 px-4 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Search
              </button>
            </form>

            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href="#courses"
                className="rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700"
              >
                Explore Courses
              </a>
              <a
                href="#about"
                className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Get Started
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-6 -top-6 h-40 w-40 rounded-full bg-brand-200/50 blur-3xl" />
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-violet-700 p-6 shadow-2xl sm:p-8">
              <div className="rounded-2xl bg-white/10 p-5 ring-1 ring-white/20 backdrop-blur">
                <div className="mb-6 flex items-center justify-between text-white">
                  <p className="text-sm font-semibold">Your learning path</p>
                  <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs">Week 4 of 12</span>
                </div>
                <div className="space-y-3">
                  {['React fundamentals', 'Build a portfolio app', 'Interview prep'].map((item, index) => (
                    <div key={item} className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-white">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-bold text-brand-700">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-2/5 rounded-full bg-white" />
                </div>
                <p className="mt-3 text-xs text-indigo-100">38% complete · keep going</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4 lg:px-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-extrabold text-slate-900 sm:text-4xl">{stat.value}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="courses" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-10 max-w-2xl">
          <p className="text-sm font-semibold text-brand-600">Featured packages</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Courses built for real careers
          </h2>
          <p className="mt-3 text-slate-600">
            Hand-picked programs with projects, mentor support, and a clear path to your next role.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <article
              key={course.title}
              className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className={`flex h-40 items-end bg-gradient-to-br ${course.accent} p-4`}>
                <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800">
                  {course.tag}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-lg font-bold text-slate-900">{course.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{course.description}</p>
                <div className="mt-5 flex items-center justify-between">
                  <p className="text-xl font-extrabold text-brand-700">{course.price}</p>
                  <button
                    type="button"
                    className="rounded-xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 hover:bg-brand-100"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="about" className="bg-white">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold text-brand-600">How it works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Enroll, learn, practice, get certified
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title} className="relative rounded-2xl bg-slate-50 p-6 ring-1 ring-slate-200">
                {index < steps.length - 1 ? (
                  <span className="absolute right-[-14px] top-10 hidden h-px w-7 bg-brand-200 lg:block" />
                ) : null}
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-sm font-bold text-white">
                  {step.number}
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{step.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold text-brand-600">Mentors</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Learn from industry instructors
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {instructors.map((person) => (
            <div key={person.name} className="flex flex-col items-center rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-slate-200">
              <div
                className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full text-lg font-bold text-white ring-4 ring-brand-50 ${person.color}`}
              >
                {person.initials}
              </div>
              <h3 className="font-semibold text-slate-900">{person.name}</h3>
              <p className="mt-1 text-sm text-slate-500">{person.title}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 py-16 text-white lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-indigo-300">Testimonials</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">What learners say</h2>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Previous testimonial"
                onClick={() =>
                  setActiveTestimonial((index) => (index === 0 ? testimonials.length - 1 : index - 1))
                }
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              >
                ‹
              </button>
              <button
                type="button"
                aria-label="Next testimonial"
                onClick={() => setActiveTestimonial((index) => (index + 1) % testimonials.length)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              >
                ›
              </button>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {visibleTestimonials.map((item) => (
              <blockquote key={item.name} className="rounded-2xl bg-white/5 p-6 ring-1 ring-white/10">
                <Stars count={item.rating} />
                <p className="mt-4 text-lg leading-8 text-slate-100">&ldquo;{item.quote}&rdquo;</p>
                <footer className="mt-5">
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-indigo-200">{item.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section id="blog" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold text-brand-600">FAQ</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Common questions
          </h2>
        </div>
        <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index
            return (
              <div key={faq.question}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-semibold text-slate-900">{faq.question}</span>
                  <span className="text-xl text-brand-600">{isOpen ? '−' : '+'}</span>
                </button>
                {isOpen ? <p className="px-5 pb-5 text-sm leading-6 text-slate-600">{faq.answer}</p> : null}
              </div>
            )
          })}
        </div>
      </section>

      <footer id="contact" className="border-t border-slate-800 bg-slate-950 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white">
                D
              </span>
              <span className="text-xl font-extrabold text-white">Digital Expert</span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-400">
              An online learning platform for career-ready skills, expert mentors, and real-world projects.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Quick links</h3>
            <ul className="mt-4 space-y-2 text-sm">
              {['Home', 'Courses', 'About', 'Blog', 'Contact'].map((label) => (
                <li key={label}>
                  <a href={`#${label.toLowerCase()}`} className="hover:text-white">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Follow us</h3>
            <div className="mt-4 flex gap-3">
              {['X', 'in', 'Ig', 'Yt'].map((network) => (
                <span
                  key={network}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white"
                >
                  {network}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t border-white/10 py-5 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Digital Expert. All rights reserved.
        </div>
      </footer>
    </main>
  )
}

export default Home
