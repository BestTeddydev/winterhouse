import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'
import { DEFAULT_SHARE_IMAGE, SITE_NAME, SITE_URL } from '@/lib/site'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  // Relative URLs (share images, canonical links) resolve against the real site, not localhost
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง - ห้องพัก วังน้ำเขียว | คาเฟ่ วังน้ำเขียว',
    // Other pages: "<page> | บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง"
    template: `%s | ${SITE_NAME}`,
  },
  description: 'บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง ที่วังน้ำเขียว - คาเฟ่และห้องพักสุดพิเศษในบรรยากาศธรรมชาติ พร้อมลานกางเต้นท์วังน้ำเขียว บริการครบครันและสิ่งอำนวยความสะดวกทันสมัย',
  keywords: 'บ้านลมหนาว, คาเฟ่ วังน้ำเขียว, ห้องพัก วังน้ำเขียว, ลานกางเต้นท์วังน้ำเขียว, บ้านลมหนาว วังน้ำเขียว, คาเฟ่ แอนด์ แคมป์ปิ้ง, ที่พักวังน้ำเขียว, กาแฟวังน้ำเขียว, แคมป์ปิ้งวังน้ำเขียว, พักผ่อนวังน้ำเขียว',
  authors: [{ name: 'บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง' }],
  creator: 'บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง',
  publisher: 'บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง',
  icons: {
    icon: [
      { url: '/logo.jpeg', sizes: 'any', type: 'image/jpeg' },
      { url: '/logo.jpeg', type: 'image/jpeg' },
    ],
    shortcut: '/logo.jpeg',
    apple: '/logo.jpeg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง - ห้องพัก วังน้ำเขียว',
    description: 'คาเฟ่และห้องพักสุดพิเศษในบรรยากาศธรรมชาติที่วังน้ำเขียว พร้อมลานกางเต้นท์และบริการครบครัน',
    type: 'website',
    locale: 'th_TH',
    siteName: SITE_NAME,
    images: [DEFAULT_SHARE_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง - ห้องพัก วังน้ำเขียว',
    description: 'คาเฟ่และห้องพักสุดพิเศษในบรรยากาศธรรมชาติที่วังน้ำเขียว',
    images: [DEFAULT_SHARE_IMAGE.url],
  },
  // No canonical here: it would apply to every page and tell Google they all duplicate the home page.
  // Each page sets its own (see page.tsx, rooms/layout.tsx, rooms/[id]/page.tsx).
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <head>
        <link rel="icon" type="image/jpeg" href="/logo.jpeg" />
        <link rel="shortcut icon" type="image/jpeg" href="/logo.jpeg" />
        <link rel="apple-touch-icon" href="/logo.jpeg" />
      </head>
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  )
}

