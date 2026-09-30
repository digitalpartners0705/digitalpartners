/**
 * Percents are of Net Amount after 18% GST (listed × 82%), per the marketing plan.
 * One sale pays three levels up the referral chain and nothing beyond that.
 * Every package purchase pays these percents again for the package that was bought.
 */
const PACKAGES = {
  'Social Expert': {
    id: 'social-expert',
    listedPrice: 6999,
    netAmount: 5740,
    activePercent: 52.26,
    passivePercent: 10.45,
    secondPercent: 4.36,
    rank: 1,
  },
  'Ads Expert': {
    id: 'ads-expert',
    listedPrice: 14999,
    netAmount: 12300,
    activePercent: 52.85,
    passivePercent: 9.76,
    secondPercent: 4.07,
    rank: 2,
  },
  'AI Premium Expert': {
    id: 'ai-premium-expert',
    listedPrice: 21999,
    netAmount: 18040,
    activePercent: 55.43,
    passivePercent: 9.98,
    secondPercent: 4.16,
    rank: 3,
  },
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
  if (PACKAGES[raw]) return { name: raw, ...PACKAGES[raw] }
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
    listedPrice: pkg.listedPrice,
    netAmount: pkg.netAmount,
    levels: INCOME_LEVELS.map((config) => commissionForLevel(pkg.name, config.level)),
  }
}

const canPurchasePackage = (currentPackageName, nextPackageName) => {
  const next = resolvePackage(nextPackageName)
  if (!next) return { ok: false, message: 'Choose Social Expert, Ads Expert, or AI Premium Expert' }

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
  PACKAGE_BY_ID,
  PACKAGE_NAMES,
  INCOME_LEVELS,
  MAX_LEVEL,
  resolvePackage,
  commissionForLevel,
  commissionPlanFor,
  canPurchasePackage,
}
