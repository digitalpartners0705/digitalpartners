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
    tone: 'bg-[#1877F2]/10 text-[#1877F2]',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@digital.vidhya',
    href: 'https://www.instagram.com/digital.vidhya?dlrf=MXh5MzQ2bmQwYTVlcw==',
    description: 'Short lessons, reels, and behind-the-scenes.',
    tone: 'bg-pink-500/10 text-pink-600',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    handle: '@Digitalvidhyaofficall',
    href: 'https://www.youtube.com/@Digitalvidhyaofficall',
    description: 'Longer walkthroughs and weekly recaps.',
    tone: 'bg-red-500/10 text-red-600',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    handle: 'Digital Vidhya',
    href: 'https://www.linkedin.com/in/digital-vidhya-629375447/',
    description: 'Company updates and professional posts.',
    tone: 'bg-[#0A66C2]/10 text-[#0A66C2]',
  },
]

export const communityLink = (id) => COMMUNITIES.find((room) => room.id === id)?.href
