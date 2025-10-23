import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง - ห้องพัก วังน้ำเขียว | คาเฟ่ วังน้ำเขียว',
  description: 'บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง ที่วังน้ำเขียว - คาเฟ่และห้องพักสุดพิเศษในบรรยากาศธรรมชาติ พร้อมลานกางเต้นท์วังน้ำเขียว บริการครบครันและสิ่งอำนวยความสะดวกทันสมัย',
  keywords: 'บ้านลมหนาว, คาเฟ่ วังน้ำเขียว, ห้องพัก วังน้ำเขียว, ลานกางเต้นท์วังน้ำเขียว, บ้านลมหนาว วังน้ำเขียว, คาเฟ่ แอนด์ แคมป์ปิ้ง, ที่พักวังน้ำเขียว, กาแฟวังน้ำเขียว, แคมป์ปิ้งวังน้ำเขียว, พักผ่อนวังน้ำเขียว',
  authors: [{ name: 'บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง' }],
  creator: 'บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง',
  publisher: 'บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง',
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
    siteName: 'บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง',
    images: [
      {
        url: '/api/placeholder/1200/630',
        width: 1200,
        height: 630,
        alt: 'บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง วังน้ำเขียว',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง - ห้องพัก วังน้ำเขียว',
    description: 'คาเฟ่และห้องพักสุดพิเศษในบรรยากาศธรรมชาติที่วังน้ำเขียว',
    images: ['/api/placeholder/1200/630'],
  },
  alternates: {
    canonical: 'https://winterhouse.com',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={inter.className}>
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  )
}

