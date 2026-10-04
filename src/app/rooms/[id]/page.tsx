import { cache } from 'react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CalendarCheck, ChevronRight, MapPin, Users } from 'lucide-react'
import Navbar from '@/components/Navbar'
import connectDB from '@/lib/db'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import { formatCurrency } from '@/lib/utils'
import Room from '@/models/Room'
import AmenityIcon from '../_components/AmenityIcon'

// Rendered on request: rooms live in Firestore (not reachable while the Docker image is built)
export const dynamic = 'force-dynamic'

interface RoomPage {
  _id: string
  name: string
  description: string
  imageUrls: string[]
  videoUrls?: string[]
  capacity: number
  amenities: string[]
  price: number
  pricing?: { weekday?: number; weekend?: number; holiday?: number }
  buildingId?: { name?: string } | string
}

/** An open room, loaded once per request (shared by the metadata and the page) */
const loadRoom = cache(async (id: string): Promise<RoomPage | null> => {
  await connectDB()
  const room = await Room.findById(id).populate('buildingId', 'name').lean()
  return room?.isActive ? (room as RoomPage) : null
})

/** Lowest nightly price of the room (weekday, weekend or holiday) */
function priceFrom(room: RoomPage) {
  const prices = [room.price, room.pricing?.weekday, room.pricing?.weekend, room.pricing?.holiday].filter(
    (p): p is number => typeof p === 'number' && p > 0
  )
  return prices.length ? Math.min(...prices) : null
}

const summary = (text: string, max = 155) => {
  const flat = text.replace(/\s+/g, ' ').trim()
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const room = await loadRoom((await params).id)
  if (!room) return { title: 'ไม่พบห้องพัก', robots: { index: false } }
  const from = priceFrom(room)
  const title = `${room.name} - ห้องพักวังน้ำเขียว`
  const description = summary(
    `${room.name} ที่${SITE_NAME} วังน้ำเขียว พักได้ ${room.capacity} คน${from ? ` ราคาเริ่มต้น ${formatCurrency(from)}/คืน` : ''}. ${room.description}`
  )
  return {
    title,
    description,
    alternates: { canonical: `/rooms/${room._id}` },
    openGraph: { title, description, type: 'website', locale: 'th_TH', siteName: SITE_NAME, images: room.imageUrls.slice(0, 1) },
    twitter: { card: 'summary_large_image', title, description, images: room.imageUrls.slice(0, 1) },
  }
}

export default async function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const room = await loadRoom((await params).id)
  if (!room) notFound()

  const from = priceFrom(room)
  const building = typeof room.buildingId === 'object' ? room.buildingId?.name : undefined
  const [cover, ...photos] = room.imageUrls
  const videos = room.videoUrls ?? []
  const prices = [
    ['วันธรรมดา', room.pricing?.weekday],
    ['วันหยุดสุดสัปดาห์', room.pricing?.weekend],
    ['วันหยุดนักขัตฤกษ์', room.pricing?.holiday],
  ].filter((row): row is [string, number] => typeof row[1] === 'number' && row[1] > 0)

  // What search engines read about the room: a hotel room you can book, at the lodging
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': ['HotelRoom', 'Product'],
    name: room.name,
    description: room.description,
    url: `${SITE_URL}/rooms/${room._id}`,
    image: room.imageUrls,
    occupancy: { '@type': 'QuantitativeValue', maxValue: room.capacity, unitText: 'คน' },
    amenityFeature: room.amenities.map((name) => ({ '@type': 'LocationFeatureSpecification', name, value: true })),
    containedInPlace: { '@type': 'LodgingBusiness', name: SITE_NAME, url: SITE_URL },
    ...(from && {
      offers: {
        '@type': 'Offer',
        price: from,
        priceCurrency: 'THB',
        availability: 'https://schema.org/InStock',
        url: `${SITE_URL}/rooms`,
      },
    }),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <nav aria-label="breadcrumb" className="flex items-center gap-1 text-sm text-gray-600 mb-4">
          <Link href="/" className="hover:text-primary-600">
            หน้าแรก
          </Link>
          <ChevronRight size={14} />
          <Link href="/rooms" className="hover:text-primary-600">
            ห้องพัก
          </Link>
          <ChevronRight size={14} />
          <span className="text-gray-900">{room.name}</span>
        </nav>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">{room.name}</h1>
        <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
          {building && (
            <span className="flex items-center gap-1">
              <MapPin size={16} /> {building}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users size={16} /> พักได้ {room.capacity} คน
          </span>
          <span>{SITE_NAME} วังน้ำเขียว</span>
        </div>

        {cover && (
          <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden mb-3 bg-gray-200">
            <Image src={cover} alt={room.name} fill priority sizes="(max-width: 1024px) 100vw, 1024px" className="object-cover" />
          </div>
        )}
        {photos.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-8">
            {photos.map((url, i) => (
              <div key={url} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-200">
                <Image src={url} alt={`${room.name} รูปที่ ${i + 2}`} fill sizes="(max-width: 768px) 33vw, 256px" className="object-cover" />
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">รายละเอียดห้องพัก</h2>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{room.description}</p>
            </section>

            {videos.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">วิดีโอห้องพัก</h2>
                <div className="space-y-4">
                  {videos.map((url) => (
                    <video key={url} src={url} controls preload="metadata" playsInline className="w-full rounded-xl bg-black aspect-video" />
                  ))}
                </div>
              </section>
            )}

            {room.amenities.length > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-3">สิ่งอำนวยความสะดวก</h2>
                <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {room.amenities.map((amenity) => (
                    <li key={amenity} className="flex items-center gap-2 text-gray-700">
                      <AmenityIcon amenity={amenity} /> {amenity}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 lg:sticky lg:top-24">
              {from && (
                <p className="mb-4">
                  <span className="text-sm text-gray-600">ราคาเริ่มต้น</span>
                  <br />
                  <span className="text-3xl font-bold text-primary-600">{formatCurrency(from)}</span>
                  <span className="text-gray-600"> / คืน</span>
                </p>
              )}
              {prices.length > 0 && (
                <dl className="space-y-1 text-sm text-gray-700 mb-6">
                  {prices.map(([label, price]) => (
                    <div key={label} className="flex justify-between">
                      <dt>{label}</dt>
                      <dd className="font-medium">{formatCurrency(price)}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <Link
                href="/rooms"
                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                <CalendarCheck size={20} />
                เช็ควันว่างและจอง
              </Link>
              <p className="text-xs text-gray-500 mt-3 text-center">เลือกวันเข้าพักและห้องนี้ได้จากแผนผังที่พัก</p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}
