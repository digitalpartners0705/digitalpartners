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
    label: 'Support',
    items: [
      { to: '/kyc', label: 'KYC', icon: 'kyc' },
      { to: '/contact', label: 'Contact queries', icon: 'contact' },
    ],
  },
]
