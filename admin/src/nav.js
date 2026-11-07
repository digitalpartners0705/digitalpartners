export const adminNav = [
  {
    label: 'Sales',
    items: [
      { to: '/order-requests', label: 'Order requests', icon: 'requests' },
      { to: '/orders', label: 'Orders', icon: 'orders' },
      { to: '/commissions', label: 'Commissions', icon: 'commissions' },
    ],
  },
  {
    label: 'Content',
    items: [
      { to: '/courses', label: 'Courses', icon: 'courses' },
      { to: '/trainings', label: 'Training', icon: 'trainings' },
      { to: '/announcements', label: 'Announcements', icon: 'announcements' },
      { to: '/achievements', label: 'Achievements', icon: 'achievements' },
    ],
  },
  {
    label: 'Accounts',
    items: [
      { to: '/users', label: 'Users', icon: 'users' },
      { to: '/external-earnings', label: 'External earnings', icon: 'external' },
      { to: '/change-referrer', label: 'Change referrer', icon: 'referrer' },
    ],
  },
  {
    label: 'Support',
    items: [
      { to: '/kyc', label: 'KYC', icon: 'kyc' },
      { to: '/leaderboard-visibility', label: 'Leaderboard', icon: 'leaderboard' },
      { to: '/contact', label: 'Contact queries', icon: 'contact' },
    ],
  },
]
