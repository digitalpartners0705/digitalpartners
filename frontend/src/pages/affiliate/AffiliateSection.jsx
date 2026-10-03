import { useLocation } from 'react-router-dom'

const PAGES = {
  '/affiliate/qualification': {
    title: 'Qualification',
    text: 'Rank targets and qualification status will show here.',
  },
}

function AffiliateSection() {
  const { pathname } = useLocation()
  const page = PAGES[pathname] || { title: 'Affiliate', text: 'This section is coming next.' }

  return (
    <div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{page.title}</h1>
      <p className="mt-1 text-slate-500">{page.text}</p>

      <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <p className="text-lg font-semibold text-slate-900">{page.title} is ready to build next</p>
        <p className="mt-2 text-sm text-slate-500">This page is in the affiliate dashboard and waiting for its content.</p>
      </div>
    </div>
  )
}

export default AffiliateSection
