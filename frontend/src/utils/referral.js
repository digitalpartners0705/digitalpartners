const STORAGE_KEY = 'de_referral'

const PACKAGE_BY_ID = {
  'social-expert': 'Social Expert',
  'ads-expert': 'Ads & Creative Expert',
  'ai-premium-expert': 'AI & Business Expert',
}

export const PACKAGE_SLUGS = {
  'Social Expert': 'social-expert',
  'Ads Expert': 'ads-expert',
  'Ads & Creative Expert': 'ads-expert',
  'AI Premium Expert': 'ai-premium-expert',
  'AI & Business Expert': 'ai-premium-expert',
}

export function packageNameFromSlug(slug) {
  if (!slug) return ''
  const raw = String(slug).trim()
  if (PACKAGE_BY_ID[raw]) return PACKAGE_BY_ID[raw]
  if (PACKAGE_SLUGS[raw]) return raw
  return ''
}

export function readReferral() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveReferral(partial) {
  const current = readReferral() || {}
  const next = {
    ref: partial.ref != null ? String(partial.ref).trim() : current.ref || '',
    package: partial.package != null ? packageNameFromSlug(partial.package) || String(partial.package).trim() : current.package || '',
    country: partial.country != null ? String(partial.country).trim() : current.country || '',
  }
  if (!next.ref && !next.package && !next.country) {
    sessionStorage.removeItem(STORAGE_KEY)
    return null
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export function clearReferral() {
  sessionStorage.removeItem(STORAGE_KEY)
}

export function captureReferralFromSearch(search) {
  const params = new URLSearchParams(search || (typeof window !== 'undefined' ? window.location.search : ''))
  const ref = params.get('ref') || ''
  const packageSlug = params.get('package') || ''
  const country = params.get('country') || ''
  if (!ref && !packageSlug && !country) return readReferral()
  return saveReferral({ ref, package: packageSlug, country })
}

export function buildGeneralLink(origin, referralCode) {
  return `${origin}/?ref=${encodeURIComponent(referralCode)}`
}

export function buildPackageLink(origin, referralCode, packageId, country) {
  const params = new URLSearchParams({
    ref: referralCode,
    package: packageId,
  })
  if (country) params.set('country', country)
  return `${origin}/join?${params.toString()}`
}
