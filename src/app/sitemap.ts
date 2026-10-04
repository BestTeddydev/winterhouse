import type { MetadataRoute } from 'next'
import connectDB from '@/lib/db'
import { SITE_URL } from '@/lib/site'
import Room from '@/models/Room'

// Built per request (cached by the CDN/crawler): the room list lives in Firestore, which isn't
// reachable while the Docker image is built
export const dynamic = 'force-dynamic'

/** /sitemap.xml: the public pages and one page per room that is open for booking */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/rooms`, changeFrequency: 'daily', priority: 0.9 },
  ]
  try {
    await connectDB()
    const rooms = await Room.find({ isActive: true }).select('_id updatedAt').lean()
    for (const room of rooms as Array<{ _id: string; updatedAt?: Date }>) {
      pages.push({ url: `${SITE_URL}/rooms/${room._id}`, lastModified: room.updatedAt, changeFrequency: 'weekly', priority: 0.8 })
    }
  } catch (error) {
    // The fixed pages are still worth listing if the database can't be read
    console.error('sitemap: could not load rooms', error)
  }
  return pages
}
