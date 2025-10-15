import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'react-hot-toast'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Winterhouse - คาเฟ่และที่พักสุดพิเศษ',
  description: 'คาเฟ่และที่พักสุดพิเศษในบรรยากาศธรรมชาติ พร้อมบริการครบครันและสิ่งอำนวยความสะดวกทันสมัย',
  keywords: 'คาเฟ่, ที่พัก, โรงแรม, กาแฟ, พักผ่อน, ธรรมชาติ, Winterhouse',
  openGraph: {
    title: 'Winterhouse - คาเฟ่และที่พักสุดพิเศษ',
    description: 'คาเฟ่และที่พักสุดพิเศษในบรรยากาศธรรมชาติ',
    type: 'website',
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

