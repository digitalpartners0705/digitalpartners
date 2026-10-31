export const COMMUNITIES = [
  {
    id: 'whatsapp',
    platform: 'whatsapp',
    name: 'WhatsApp community',
    language: 'WhatsApp',
    members: '12.4k',
    description: 'Daily updates, live doubts, and course announcements in our official WhatsApp community.',
    href: 'https://chat.whatsapp.com/DhDC2QyE5PKEU7ULljDNoF',
  },
  {
    id: 'telegram',
    platform: 'telegram',
    name: 'Telegram community',
    language: 'Telegram',
    members: '15.6k',
    description: 'Weekly recaps, mentor notes, and files from the team in our official Telegram group.',
    href: 'https://t.me/+DdlhDYEuaTowZTU1',
  },
]

export const SOCIALS = [
  {
    id: 'facebook',
    name: 'Facebook',
    handle: 'Digital Vidhya',
    href: 'https://www.facebook.com/share/1K5YBDXPXL/',
    description: 'Announcements and learner stories.',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@digital.vidhya',
    href: 'https://www.instagram.com/digital.vidhya?dlrf=MXh5MzQ2bmQwYTVlcw==',
    description: 'Short lessons, reels, and behind-the-scenes.',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    handle: '@Digitalvidhyaofficall',
    href: 'https://www.youtube.com/@Digitalvidhyaofficall',
    description: 'Longer walkthroughs and weekly recaps.',
  },
]

export const communityLink = (id) => COMMUNITIES.find((room) => room.id === id)?.href
