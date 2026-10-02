export const CHECKOUT_PACKAGES = [
  {
    id: 'social-expert',
    name: 'Social Expert',
    tagline: 'Start your journey and build a strong social foundation.',
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
    name: 'Ads Expert',
    tagline: 'Scale your reach with paid ads and lead generation.',
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
    name: 'AI Premium Expert',
    tagline: 'The complete ecosystem to earn confidently online.',
    price: 21999,
    accent: 'violet',
    badge: 'Best Value',
    features: [
      'Everything in Ads Expert',
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
  'AI Premium Expert': 3,
}

export const GST_RATE = 0.18

export const getCheckoutPackage = (nameOrId) => {
  const value = String(nameOrId || '').trim()
  if (!value) return null
  return (
    CHECKOUT_PACKAGES.find((pkg) => pkg.name === value || pkg.id === value) ||
    CHECKOUT_PACKAGES.find((pkg) => pkg.id === value.toLowerCase()) ||
    null
  )
}

export const priceBreakdown = (listedPrice) => {
  const total = Number(listedPrice)
  const net = Math.round(total * (1 - GST_RATE))
  const gst = total - net
  return { listed: total, net, gst, total }
}

export const formatRupees = (value) =>
  `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
