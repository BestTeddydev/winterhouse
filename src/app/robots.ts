import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/** /robots.txt: everything public may be crawled; accounts, admin and the API not */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/auth/', '/bookings', '/owner', '/employee'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
