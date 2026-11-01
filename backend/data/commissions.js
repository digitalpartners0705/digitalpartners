/**
 * Promo prices include 18% GST. Net amount = promo price ÷ 1.18.
 * One sale pays three levels up the referral chain and nothing beyond that.
 * Only percents are configured — rupee commissions are calculated from net × percent.
 */
const PACKAGES = {
  'Social Expert': {
    id: 'social-expert',
    mrp: 9999,
    listedPrice: 6999,
    netAmount: 5931.36,
    activePercent: 50.58,
    passivePercent: 10.12,
    secondPercent: 4.21,
    rank: 1,
  },
  'Ads & Creative Expert': {
    id: 'ads-expert',
    mrp: 19999,
    listedPrice: 14999,
    netAmount: 12711.02,
    activePercent: 59.0,
    passivePercent: 9.44,
    secondPercent: 3.93,
    rank: 2,
  },
  'AI & Business Expert': {
    id: 'ai-premium-expert',
    mrp: 29999,
    listedPrice: 21999,
    netAmount: 18643.22,
    activePercent: 64.37,
    passivePercent: 9.65,
    secondPercent: 4.02,
    rank: 3,
  },
}

/** Older stored package names still resolve to the current plan. */
const PACKAGE_ALIASES = {
  'Ads Expert': 'Ads & Creative Expert',
  'AI Premium Expert': 'AI & Business Expert',
}

const INCOME_LEVELS = [
  { level: 1, incomeType: 'active', percentKey: 'activePercent', label: 'Active' },
  { level: 2, incomeType: 'passive', percentKey: 'passivePercent', label: 'Passive' },
  { level: 3, incomeType: 'second', percentKey: 'secondPercent', label: 'Second level' },
]

const MAX_LEVEL = INCOME_LEVELS.length

const PACKAGE_BY_ID = Object.fromEntries(
  Object.entries(PACKAGES).map(([name, pkg]) => [pkg.id, { name, ...pkg }]),
)

const PACKAGE_NAMES = Object.keys(PACKAGES)

const resolvePackage = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return null
  const canonical = PACKAGE_ALIASES[raw] || raw
  if (PACKAGES[canonical]) return { name: canonical, ...PACKAGES[canonical] }
  const byId = PACKAGE_BY_ID[raw.toLowerCase()]
  return byId || null
}

const roundMoney = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100

const commissionForLevel = (packageValue, level) => {
  const pkg = resolvePackage(packageValue)
  const config = INCOME_LEVELS.find((item) => item.level === level)
  if (!pkg || !config) return null

  const percent = pkg[config.percentKey]
  return {
    packageName: pkg.name,
    packageId: pkg.id,
    mrp: pkg.mrp,
    listedPrice: pkg.listedPrice,
    netAmount: pkg.netAmount,
    level: config.level,
    incomeType: config.incomeType,
    commissionPercent: percent,
    amount: roundMoney((pkg.netAmount * percent) / 100),
    rank: pkg.rank,
  }
}

const commissionPlanFor = (packageValue) => {
  const pkg = resolvePackage(packageValue)
  if (!pkg) return null
  return {
    packageName: pkg.name,
    packageId: pkg.id,
    mrp: pkg.mrp,
    listedPrice: pkg.listedPrice,
    netAmount: pkg.netAmount,
    levels: INCOME_LEVELS.map((config) => commissionForLevel(pkg.name, config.level)),
  }
}

const canPurchasePackage = (currentPackageName, nextPackageName) => {
  const next = resolvePackage(nextPackageName)
  if (!next) {
    return { ok: false, message: 'Choose Social Expert, Ads & Creative Expert, or AI & Business Expert' }
  }

  const current = resolvePackage(currentPackageName)
  if (!current) return { ok: true, package: next }

  if (current.name === next.name) {
    return { ok: false, message: 'You already have this package' }
  }
  if (next.rank <= current.rank) {
    return { ok: false, message: 'You can only move to a higher package' }
  }
  return { ok: true, package: next }
}

module.exports = {
  PACKAGES,
  PACKAGE_ALIASES,
  PACKAGE_BY_ID,
  PACKAGE_NAMES,
  INCOME_LEVELS,
  MAX_LEVEL,
  resolvePackage,
  commissionForLevel,
  commissionPlanFor,
  canPurchasePackage,
}
