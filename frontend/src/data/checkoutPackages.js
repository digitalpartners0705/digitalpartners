export const CHECKOUT_PACKAGES = [
  {
    id: 'social-expert',
    name: 'Social Expert',
    tagline: 'Start your journey and build a strong social foundation.',
    mrp: 9999,
    price: 6999,
    accent: 'sky',
    badge: null,
    features: [
      'Social media & content creation mastery',
      '20+ practical lessons with ready templates',
      'Community access & peer support',
      'Completion certificate',
      'Affiliate earning eligibility',
    ],
  },
  {
    id: 'ads-expert',
    name: 'Ads & Creative Expert',
    tagline: 'Scale your reach with paid ads and lead generation.',
    mrp: 19900,
    price: 14999,
    accent: 'gold',
    badge: 'Most Popular',
    features: [
      'Everything in Social Expert',
      'Meta & Google paid ad campaigns',
      'Funnel & lead-generation frameworks',
      'Live mentor Q&A sessions',
      'Higher affiliate commission tier',
    ],
  },
  {
    id: 'ai-premium-expert',
    name: 'AI & Business Expert',
    tagline: 'The complete ecosystem to earn confidently online.',
    mrp: 29999,
    price: 21999,
    accent: 'violet',
    badge: 'Best Value',
    features: [
      'Everything in Ads & Creative Expert',
      'AI tools & automation for marketing',
      'Advanced monetization & freelancing playbook',
      '1:1 priority mentorship',
      'Lifetime access & all future updates',
      'Highest affiliate commission tier',
    ],
  },
]

export const PACKAGE_RANK = {
  'Social Expert': 1,
  'Ads Expert': 2,
  'Ads & Creative Expert': 2,
  'AI Premium Expert': 3,
  'AI & Business Expert': 3,
}

export const GST_RATE = 0.18

export const getCheckoutPackage = (nameOrId) => {
  const value = String(nameOrId || '').trim()
  if (!value) return null
  const aliases = {
    'Ads Expert': 'Ads & Creative Expert',
    'AI Premium Expert': 'AI & Business Expert',
  }
  const canonical = aliases[value] || value
  return (
    CHECKOUT_PACKAGES.find((pkg) => pkg.name === canonical || pkg.id === canonical) ||
    CHECKOUT_PACKAGES.find((pkg) => pkg.id === canonical.toLowerCase()) ||
    null
  )
}

/** Promo / referral payable includes 18% GST. Net = payable ÷ 1.18. */
export const priceBreakdown = (pkg, { applyPromo = true } = {}) => {
  const mrp = Number(pkg?.mrp ?? pkg?.price ?? 0)
  const promoPrice = Number(pkg?.price ?? mrp)
  const payable = applyPromo ? promoPrice : mrp
  const discount = Math.max(0, mrp - payable)
  const net = Math.round(payable / (1 + GST_RATE))
  const gst = payable - net
  return {
    mrp,
    discount,
    payable,
    listed: payable,
    net,
    gst,
    total: payable,
    applyPromo,
  }
}

export const formatRupees = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
