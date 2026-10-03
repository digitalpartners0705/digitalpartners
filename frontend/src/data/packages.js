export const PACKAGES = [
  {
    id: 'social-expert',
    name: 'Social Expert',
    shortLabel: 'SOCIAL',
    price: 6999,
    badge: null,
    theme: 'teal',
    headline: 'Build your social presence and start earning online.',
    description:
      'Our step-by-step, skill-focused growth package for creators who want high-income digital skills and a clear freelancing start. Learn content, branding, and audience growth with practical workflows you can use immediately.',
    stats: [
      { label: 'Courses', value: '4', icon: 'book' },
      { label: 'Learning hours', value: '20+', icon: 'clock' },
      { label: 'Learners', value: '8K+', icon: 'users' },
    ],
    modules: [
      { title: 'Instagram Branding', short: 'INSTAGRAM', subtitle: 'Profile, content system & growth' },
      { title: 'LinkedIn Expert', short: 'LINKEDIN', subtitle: 'Personal brand & outreach' },
      { title: 'YouTube Master', short: 'YOUTUBE', subtitle: 'Channel setup & retention' },
      { title: 'Sales Funnel Basics', short: 'FUNNEL', subtitle: 'Convert attention into clients' },
    ],
    inclusions: [
      'Social media & content creation mastery',
      '20+ practical lessons with ready templates',
      'Community access & peer support',
      'Completion certificate',
      'Affiliate earning eligibility',
    ],
    whoFor: [
      'Beginners starting a digital career',
      'Creators who want a structured content system',
      'Anyone building freelancing foundations',
    ],
    outcomes: [
      'A clear personal brand across major platforms',
      'Repeatable content & posting workflows',
      'Confidence to take first freelance clients',
    ],
  },
  {
    id: 'ads-expert',
    name: 'Ads Expert',
    shortLabel: 'ADS',
    price: 14999,
    badge: 'Most Popular',
    theme: 'silver',
    headline: 'Scale reach with paid ads and lead generation.',
    description:
      'Go beyond organic growth. Master Meta and Google campaigns, build lead funnels, and turn traffic into predictable results — with everything from Social Expert included so your foundation stays strong.',
    stats: [
      { label: 'Courses', value: '7', icon: 'book' },
      { label: 'Learning hours', value: '40+', icon: 'clock' },
      { label: 'Learners', value: '5K+', icon: 'users' },
    ],
    modules: [
      { title: 'Meta Ads Expert', short: 'META ADS', subtitle: 'Campaigns, creatives & targeting' },
      { title: 'Google Ads Expert', short: 'GOOGLE', subtitle: 'Search, display & conversion' },
      { title: 'Website Essentials', short: 'WEBSITE', subtitle: 'Landing pages that convert' },
      { title: 'Lead Generation', short: 'LEADS', subtitle: 'Funnels & nurture systems' },
    ],
    inclusions: [
      'Everything in Social Expert',
      'Meta & Google paid ad campaigns',
      'Funnel & lead-generation frameworks',
      'Live mentor Q&A sessions',
      'Higher affiliate commission tier',
    ],
    whoFor: [
      'Learners ready to run paid traffic',
      'Freelancers offering ads as a service',
      'Business owners who want consistent leads',
    ],
    outcomes: [
      'Ability to launch and optimize ad campaigns',
      'A repeatable lead-generation process',
      'Stronger freelance offers around paid growth',
    ],
  },
  {
    id: 'ai-premium-expert',
    name: 'AI Premium Expert',
    shortLabel: 'AI PREMIUM',
    price: 21999,
    badge: 'Best Value',
    theme: 'gold',
    headline: 'The complete ecosystem to earn confidently online.',
    description:
      'Combine social, ads, AI automation, e-commerce, and freelancing into one premium path. Built for people who want the full Digital Arambh toolkit — with priority mentorship and lifetime updates.',
    stats: [
      { label: 'Courses', value: '10+', icon: 'book' },
      { label: 'Learning hours', value: '60+', icon: 'clock' },
      { label: 'Learners', value: '3K+', icon: 'users' },
    ],
    modules: [
      { title: 'AI Master', short: 'AI MASTER', subtitle: 'Tools & marketing automation' },
      { title: 'E-Commerce Path', short: 'E-COMMERCE', subtitle: 'Sell products online' },
      { title: 'Freelancing Playbook', short: 'FREELANCE', subtitle: 'Offers, clients & delivery' },
      { title: 'Monetization Systems', short: 'MONETIZE', subtitle: 'Multiple income streams' },
    ],
    inclusions: [
      'Everything in Ads Expert',
      'AI tools & automation for marketing',
      'Advanced monetization & freelancing playbook',
      '1:1 priority mentorship',
      'Lifetime access & all future updates',
      'Highest affiliate commission tier',
    ],
    whoFor: [
      'Serious learners building a full digital career',
      'Creators ready to automate and scale',
      'Partners who want the highest earning tier',
    ],
    outcomes: [
      'End-to-end skills from content to conversion',
      'AI-assisted workflows that save time',
      'A clear plan to monetize and grow online income',
    ],
  },
]

export function getPackageById(id) {
  return PACKAGES.find((pkg) => pkg.id === id) || null
}

export function packagePath(id) {
  return `/packages/${id}`
}
