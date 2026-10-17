import { COMMUNITIES, SOCIALS } from '../../data/community'

const CHANNELS = [
  ...SOCIALS,
  {
    id: 'telegram',
    name: 'Telegram',
    href: COMMUNITIES[0].href,
  },
]

function SocialIcon({ id }) {
  const common = { viewBox: '0 0 24 24', className: 'h-6 w-6', 'aria-hidden': true }
  if (id === 'youtube') {
    return (
      <svg {...common} fill="currentColor">
        <path d="M23 12.2s0-3.2-.4-4.6c-.2-.9-.9-1.6-1.8-1.8C19.2 5.4 12 5.4 12 5.4s-7.2 0-8.8.4c-.9.2-1.6.9-1.8 1.8C1 9 1 12.2 1 12.2s0 3.2.4 4.6c.2.9.9 1.6 1.8 1.8 1.6.4 8.8.4 8.8.4s7.2 0 8.8-.4c.9-.2 1.6-.9 1.8-1.8.4-1.4.4-4.6.4-4.6ZM9.8 15.5V8.9l6 3.3-6 3.3Z" />
      </svg>
    )
  }
  if (id === 'facebook') {
    return (
      <svg {...common} fill="currentColor">
        <path d="M14.5 8.5V6.8c0-.7.5-1 1.2-1H17V3h-2.1C12.2 3 11 4.4 11 6.6v1.9H9v2.8h2V21h3.5v-9.7h2.3l.4-2.8h-2.7Z" />
      </svg>
    )
  }
  if (id === 'instagram') {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <circle cx="12" cy="12" r="3.5" />
        <circle cx="17.2" cy="6.8" r="0.8" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  return (
    <svg {...common} fill="currentColor">
      <path d="M21.5 4.6 2.8 11.2c-1.3.5-1.2 1.2-.2 1.5l4.8 1.5 1.8 5.6c.2.7.1.9.8.9.5 0 .7-.2 1-.5l2.3-2.2 4.8 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.2-.4-1.8-1.4-1.5ZM8.6 13.7l9.3-5.8c.5-.3.9-.1.5.2l-7.6 6.9-.3 3.3-1.9-4.6Z" />
    </svg>
  )
}

const TONE = {
  youtube: 'bg-red-500/15 text-red-400',
  facebook: 'bg-sky-500/15 text-sky-300',
  instagram: 'bg-pink-500/15 text-pink-300',
  telegram: 'bg-teal-300/15 text-teal-200',
}

function AffiliateCommunity() {
  return (
    <div className="-mx-4 -my-8 min-h-[calc(100vh-4.25rem)] bg-[#10131c] px-4 py-8 text-slate-100 sm:-mx-8 sm:px-8">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Community</h1>
      <p className="mt-2 max-w-xl text-sm text-slate-400">WhatsApp and Hindi rooms for updates, webinar links, and files you can share.</p>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {COMMUNITIES.map((room) => (
          <article key={room.id} className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-[#171b27] p-6">
            <div>
              <p className="text-sm text-slate-400">({room.language})</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight">{room.name}</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">
                Promo files, webinar links, and weekly notes for the {room.language} room. {room.members} members.
              </p>
            </div>
            <a
              href={room.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${room.name}`}
              className="flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full border border-teal-300/40 text-teal-200 hover:bg-teal-300 hover:text-slate-900"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 17 17 7M9 7h8v8" />
              </svg>
            </a>
          </article>
        ))}
      </div>

      <section className="mt-6 rounded-xl border border-white/10 bg-[#171b27] px-6 py-6">
        <h2 className="text-xl font-bold">Socials</h2>
        <div className="mt-6 flex flex-wrap gap-6">
          {CHANNELS.map((item) => (
            <a key={item.id} href={item.href} target="_blank" rel="noreferrer" className="group w-20 cursor-pointer text-center">
              <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-xl ${TONE[item.id]}`}>
                <SocialIcon id={item.id} />
              </span>
              <span className="mt-2 block text-sm text-slate-300 group-hover:text-white">{item.name}</span>
            </a>
          ))}
        </div>
      </section>
    </div>
  )
}

export default AffiliateCommunity
