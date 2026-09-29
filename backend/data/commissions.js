/**
 * Active income only for now (passive / second later).
 * Percents are of Net Amount after 18% GST (listed × 82%), per marketing plan.
 * Every package purchase credits active % for that package (not first purchase only).
 */
const PACKAGES = {
  'Social Expert': {
    id: 'social-expert',
    listedPrice: 6999,
    netAmount: 5740,
    activePercent: 52.26,
    rank: 1,
  },
  'Ads Expert': {
    id: 'ads-expert',
    listedPrice: 14999,
    netAmount: 12300,
    activePercent: 52.85,
    rank: 2,
  },
  'AI Premium Expert': {
    id: 'ai-premium-expert',
    listedPrice: 21999,
    netAmount: 18040,
    activePercent: 55.43,
    rank: 3,
  },
}

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

const activeCommissionFor = (packageValue) => {
  const pkg = resolvePackage(packageValue)
  if (!pkg) return null
  return {
    packageName: pkg.name,
    packageId: pkg.id,
    listedPrice: pkg.listedPrice,
    netAmount: pkg.netAmount,
    commissionPercent: pkg.activePercent,
    amount: roundMoney((pkg.netAmount * pkg.activePercent) / 100),
    incomeType: 'active',
    rank: pkg.rank,
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
  resolvePackage,
  activeCommissionFor,
  canPurchasePackage,
}
