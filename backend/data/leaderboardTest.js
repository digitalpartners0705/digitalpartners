// Temporary sample ranks. daysAgo is counted back from today so the
// weekly and monthly windows keep moving. Remove this when live sales exist.

const people = [
  { id: 'aarav', name: 'Aarav Shah', avatar: '/leaderboard/aarav.jpg' },
  { id: 'diya', name: 'Diya Menon', avatar: '/leaderboard/diya.jpg' },
  { id: 'kabir', name: 'Kabir Sethi', avatar: '/leaderboard/kabir.jpg' },
  { id: 'ananya', name: 'Ananya Rao', avatar: '/leaderboard/ananya.jpg' },
  { id: 'rohan', name: 'Rohan Desai', avatar: '/leaderboard/rohan.jpg' },
  { id: 'ishita', name: 'Ishita Kapoor', avatar: '/leaderboard/ishita.jpg' },
  { id: 'vikram', name: 'Vikram Joshi', avatar: '/leaderboard/vikram.jpg' },
  { id: 'sana', name: 'Sana Farooq', avatar: '/leaderboard/sana.jpg' },
  { id: 'dev', name: 'Dev Malhotra', avatar: '/leaderboard/dev.jpg' },
  { id: 'pooja', name: 'Pooja Reddy', avatar: '/leaderboard/pooja.jpg' },
  { id: 'arjun', name: 'Arjun Kulkarni', avatar: '/leaderboard/arjun.jpg' },
  { id: 'neelam', name: 'Neelam Bhatt', avatar: '/leaderboard/neelam.jpg' },
]

const earnings = [
  { personId: 'aarav', amount: 8200, daysAgo: 0 },
  { personId: 'aarav', amount: 6400, daysAgo: 6 },
  { personId: 'aarav', amount: 28000, daysAgo: 16 },
  { personId: 'aarav', amount: 5000, daysAgo: 60 },
  { personId: 'diya', amount: 19800, daysAgo: 1 },
  { personId: 'diya', amount: 9000, daysAgo: 22 },
  { personId: 'diya', amount: 4000, daysAgo: 90 },
  { personId: 'kabir', amount: 52000, daysAgo: 12 },
  { personId: 'kabir', amount: 10000, daysAgo: 80 },
  { personId: 'ananya', amount: 41000, daysAgo: 20 },
  { personId: 'ananya', amount: 30000, daysAgo: 45 },
  { personId: 'rohan', amount: 17100, daysAgo: 2 },
  { personId: 'rohan', amount: 6000, daysAgo: 11 },
  { personId: 'ishita', amount: 11200, daysAgo: 3 },
  { personId: 'ishita', amount: 2000, daysAgo: 14 },
  { personId: 'vikram', amount: 8600, daysAgo: 4 },
  { personId: 'vikram', amount: 15000, daysAgo: 25 },
  { personId: 'vikram', amount: 88000, daysAgo: 50 },
  { personId: 'sana', amount: 7300, daysAgo: 5 },
  { personId: 'sana', amount: 1000, daysAgo: 18 },
  { personId: 'dev', amount: 5100, daysAgo: 7 },
  { personId: 'pooja', amount: 3900, daysAgo: 2 },
  { personId: 'pooja', amount: 20000, daysAgo: 100 },
  { personId: 'arjun', amount: 2400, daysAgo: 6 },
  { personId: 'arjun', amount: 54000, daysAgo: 40 },
  { personId: 'neelam', amount: 1600, daysAgo: 1 },
  { personId: 'neelam', amount: 76000, daysAgo: 70 },
]

module.exports = { people, earnings }
