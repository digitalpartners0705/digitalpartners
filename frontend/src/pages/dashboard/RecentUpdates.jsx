import { COMMUNITIES, SOCIALS } from '../../data/community'

function TelegramIcon({ className = 'h-12 w-12' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#2AABEE" />
      <path
        fill="#fff"
        d="M17.6 7.2 5.9 11.7c-.8.3-.8.8-.1 1l3 .9 1.1 3.5c.1.4.2.5.6.5.3 0 .4-.1.6-.3l1.5-1.4 3.1 2.3c.6.3 1 .2 1.1-.5l2-9.5c.2-.8-.3-1.2-.9-.9Zm-7.4 7.1-.3 2.2-.9-3.1 6.4-4c.3-.2.5 0 .3.2l-5.5 4.7Z"
      />
    </svg>
  )
}

function WhatsAppIcon({ className = 'h-12 w-12' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#25D366"
        d="M12 1.25C6.06 1.25 1.25 6.06 1.25 12c0 1.94.52 3.77 1.43 5.35L1.25 22.75l5.55-1.45A10.75 10.75 0 1 0 12 1.25Z"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="1.15"
        strokeLinejoin="round"
        d="M12 3.35a8.65 8.65 0 0 0-7.37 13.17l.2.33-.86 3.13 3.21-.84.31.19A8.65 8.65 0 1 0 12 3.35Z"
      />
      <path
        fill="#fff"
        d="M16.47 14.13c-.25-.12-1.47-.72-1.7-.8-.23-.09-.39-.13-.56.12-.16.25-.64.81-.78.97-.15.17-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43h-.48a.92.92 0 0 0-.66.31c-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.13.17 1.75 2.68 4.25 3.75.59.26 1.05.41 1.41.52.6.19 1.14.16 1.56.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.23-.17-.48-.29Z"
      />
    </svg>
  )
}

function SocialMark({ id }) {
  if (id === 'facebook') {
    return (
      <svg className="h-7 w-7" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
        <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h2.6l.4-3H13v-2c0-.6.4-1 1-1Z" />
      </svg>
    )
  }

  if (id === 'instagram') {
    return (
      <svg className="h-7 w-7" viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f58529" />
            <stop offset="50%" stopColor="#dd2a7b" />
            <stop offset="100%" stopColor="#515bd4" />
          </linearGradient>
        </defs>
        <rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="url(#ig-grad)" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3.4" fill="none" stroke="url(#ig-grad)" strokeWidth="1.8" />
        <circle cx="17.1" cy="6.9" r="1" fill="url(#ig-grad)" />
      </svg>
    )
  }

  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="#FF0000" aria-hidden="true">
      <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18.1 4.8 12 4.8 12 4.8s-6.1 0-7.7.5A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.6.5 7.7.5 7.7.5s6.1 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8ZM10 15.2V8.8L15.2 12 10 15.2Z" />
    </svg>
  )
}

function RecentUpdates() {
  return (
    <section className="relative overflow-hidden rounded-2xl bg-ink-950 px-5 py-10 text-white shadow-lg ring-1 ring-white/10 sm:px-8 sm:py-12">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(14,165,233,0.14),transparent_42%),radial-gradient(ellipse_at_bottom_right,rgba(245,193,74,0.12),transparent_40%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl">
        <div className="relative mb-10 text-center sm:mb-12">
          <p
            className="pointer-events-none absolute left-1/2 top-1/2 w-[140%] -translate-x-1/2 -translate-y-1/2 select-none text-center text-[clamp(2.5rem,10vw,5.5rem)] font-black uppercase tracking-[0.08em] text-white/[0.04]"
            aria-hidden="true"
          >
            Our community
          </p>
          <p className="relative text-xs font-semibold uppercase tracking-[0.22em] text-gold-300">Digital Vidhya</p>
          <h1 className="relative mt-3 text-3xl font-black uppercase tracking-[0.12em] sm:text-5xl">
            Our <span className="gold-text">community</span>
          </h1>
          <p className="relative mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
            Join our official community rooms and follow us on the channels you already use.
          </p>
        </div>

        <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2">
          {COMMUNITIES.map((group) => {
            const isWhatsApp = group.platform === 'whatsapp' || group.id === 'whatsapp'
            return (
              <a
                key={group.id}
                href={group.href}
                target="_blank"
                rel="noreferrer"
                className="group relative flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-gold-400/55 bg-[#0f1830]/90 px-5 pb-8 pt-10 transition hover:border-gold-300 hover:bg-[#121c38] hover:shadow-[0_0_28px_rgba(245,193,74,0.12)]"
              >
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-b from-gold-300 via-gold-400 to-gold-500 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-[#1a1203] shadow-[0_6px_14px_rgba(245,193,74,0.35)] [clip-path:polygon(8%_0,92%_0,100%_100%,0_100%)]">
                  Must join!
                </span>

                <span className="relative flex h-20 w-20 items-center justify-center">
                  <span
                    className={`absolute inset-0 rounded-full blur-xl transition ${
                      isWhatsApp
                        ? 'bg-emerald-500/25 group-hover:bg-emerald-400/35'
                        : 'bg-sky-400/25 group-hover:bg-sky-300/35'
                    }`}
                  />
                  <span
                    className={`relative ${
                      isWhatsApp
                        ? 'text-[#25D366] drop-shadow-[0_0_18px_rgba(37,211,102,0.55)]'
                        : 'text-[#2AABEE] drop-shadow-[0_0_18px_rgba(42,171,238,0.55)]'
                    }`}
                  >
                    {isWhatsApp ? <WhatsAppIcon /> : <TelegramIcon />}
                  </span>
                </span>

                <div className="mt-7 flex w-full items-center gap-3">
                  <span className="h-px flex-1 bg-white/15" />
                  <span className="text-lg font-semibold tracking-wide text-white">{group.language}</span>
                  <span className="h-px flex-1 bg-white/15" />
                </div>
              </a>
            )
          })}
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          {SOCIALS.map((social) => (
            <a
              key={social.id}
              href={social.href}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center gap-4 rounded-2xl border border-white/12 bg-[#0f1830]/80 px-5 py-5 transition hover:border-gold-400/40 hover:bg-[#121c38]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ring-1 ring-white/10 transition group-hover:ring-gold-400/30">
                <SocialMark id={social.id} />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-semibold tracking-tight text-white">{social.name}</span>
                <span className="mt-0.5 block truncate text-sm text-slate-400">{social.handle}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

export default RecentUpdates
