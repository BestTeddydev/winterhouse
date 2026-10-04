import type { Metadata } from 'next'

// The rooms page itself is a client component, so its title and description live here
export const metadata: Metadata = {
  title: 'ห้องพักและลานกางเต๊นท์ วังน้ำเขียว - เช็ควันว่างและจองออนไลน์',
  description:
    'เลือกห้องพักและลานกางเต๊นท์ของบ้านลมหนาว วังน้ำเขียว ดูรูป วิดีโอ ราคาต่อคืน และวันว่างจากแผนผังที่พัก แล้วจองออนไลน์ได้ทันที',
  alternates: { canonical: '/rooms' },
}

export default function RoomsLayout({ children }: { children: React.ReactNode }) {
  return children
}
