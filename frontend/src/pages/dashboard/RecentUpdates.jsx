import { COMMUNITIES, RESOURCE_HUB, RESOURCE_ITEMS, SOCIALS } from '../../data/community'

function SocialMark({ id }) {
  if (id === 'facebook') {
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1Z" />
      </svg>
    )
  }

  if (id === 'instagram') {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
        <rect x="4" y="4" width="16" height="16" rx="5" />
        <circle cx="12" cy="12" r="3.2" />
        <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    )
  }

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18.1 4.8 12 4.8 12 4.8s-6.1 0-7.7.5A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.6.5 7.7.5 7.7.5s6.1 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8ZM10 15.2V8.8L15.2 12 10 15.2Z" />
    </svg>
  )
}

function RecentUpdates() {
  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-3xl bg-[#1b2140] px-6 py-8 text-white sm:px-8">
        <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-brand-500/25" />
        <div className="absolute -bottom-16 right-24 h-32 w-32 rounded-full bg-sky-400/15" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-indigo-100 ring-1 ring-white/15">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live this week
          </span>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-4xl">Stay close to the community</h1>
          <p className="mt-3 text-sm leading-6 text-slate-300 sm:text-base">
            Join a language group, grab this week’s resources, and follow Digital Expert where you already scroll.
          </p>
        </div>
        <div className="relative mt-6 flex flex-wrap gap-2">
          {['2 communities', 'Weekly webinars', 'Social drops'].map((item) => (
            <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100 ring-1 ring-white/10">
              {item}
            </span>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand-600">Must join</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">Learner communities</h2>
          </div>
          <p className="hidden text-sm text-slate-500 sm:block">English or Hindi. Pick one room.</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {COMMUNITIES.map((group) => (
            <article key={group.id} className="flex overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className={`flex w-24 shrink-0 flex-col items-center justify-center bg-gradient-to-b text-white sm:w-28 ${group.tint}`}>
                <span className="text-2xl font-black">{group.mark}</span>
                <span className="mt-1 px-2 text-center text-xs font-medium text-white/85">{group.language}</span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-bold text-slate-900">{group.name}</h3>
                  <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                    {group.members}
                  </span>
                </div>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{group.description}</p>
                <a
                  href={group.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex w-fit items-center justify-center rounded-lg bg-[#1b2140] px-4 py-2 text-sm font-semibold text-white hover:bg-[#242b4f]"
                >
                  Join now
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-600">Resource desk</p>
            <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">{RESOURCE_HUB.title}</h2>
            <p className="mt-1 max-w-xl text-sm text-slate-500">{RESOURCE_HUB.description}</p>
          </div>
          <a
            href={RESOURCE_HUB.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Open this week’s kit
          </a>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {RESOURCE_ITEMS.map((item, index) => (
            <article key={item.title} className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <p className="text-xs font-bold tracking-wide text-brand-600">0{index + 1}</p>
              <h3 className="mt-2 font-bold text-slate-900">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-500">{item.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-4">
          <p className="text-sm font-semibold text-brand-600">Follow along</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900">Official socials</h2>
        </div>
        <div className="grid overflow-hidden rounded-2xl border border-slate-200 bg-white md:grid-cols-3">
          {SOCIALS.map((social, index) => (
            <a
              key={social.id}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className={`flex items-center gap-3 px-4 py-4 transition hover:bg-slate-50 ${
                index > 0 ? 'border-t border-slate-200 md:border-l md:border-t-0' : ''
              }`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${social.tone}`}>
                <SocialMark id={social.id} />
              </span>
              <span className="min-w-0">
                <span className="block font-bold text-slate-900">{social.name}</span>
                <span className="block truncate text-sm text-slate-500">{social.handle}</span>
              </span>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}

export default RecentUpdates
