const ACCENTS = [
  { id: 'from-indigo-500 to-violet-500', label: 'Indigo' },
  { id: 'from-sky-500 to-indigo-500', label: 'Sky' },
  { id: 'from-fuchsia-500 to-brand-600', label: 'Fuchsia' },
  { id: 'from-amber-500 to-orange-500', label: 'Amber' },
  { id: 'from-emerald-500 to-teal-600', label: 'Emerald' },
  { id: 'from-rose-500 to-orange-400', label: 'Rose' },
  { id: 'from-sky-600 to-blue-700', label: 'Blue' },
  { id: 'from-red-500 to-rose-600', label: 'Red' },
  { id: 'from-violet-500 to-indigo-600', label: 'Violet' },
  { id: 'from-blue-500 to-indigo-600', label: 'Royal' },
  { id: 'from-emerald-500 to-lime-500', label: 'Lime' },
  { id: 'from-cyan-500 to-sky-600', label: 'Cyan' },
  { id: 'from-brand-500 to-violet-600', label: 'Brand' },
  { id: 'from-orange-500 to-amber-500', label: 'Orange' },
  { id: 'from-teal-500 to-emerald-600', label: 'Teal' },
  { id: 'from-fuchsia-500 to-pink-500', label: 'Pink' },
  { id: 'from-violet-500 to-purple-700', label: 'Purple' },
  { id: 'from-indigo-500 to-slate-700', label: 'Slate indigo' },
  { id: 'from-slate-600 to-zinc-800', label: 'Slate' },
  { id: 'from-brand-600 to-indigo-700', label: 'Deep brand' },
  { id: 'from-amber-600 to-orange-700', label: 'Deep amber' },
  { id: 'from-cyan-600 to-indigo-600', label: 'Cyan indigo' },
  { id: 'from-teal-600 to-emerald-700', label: 'Deep teal' },
]

const DEFAULT_ACCENT = ACCENTS[0].id

const isAllowedAccent = (value) => ACCENTS.some((item) => item.id === value)

module.exports = { ACCENTS, DEFAULT_ACCENT, isAllowedAccent }
