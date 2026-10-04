// The public site: its address and what search engines and link previews show by default

/** Origin of the public site (no trailing slash); links in sitemaps, canonical URLs and previews use it */
export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://baanlomnow.com').replace(/\/$/, '')

export const SITE_NAME = 'บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง'

/** Shown when a page is shared on LINE / Facebook and has no picture of its own */
export const DEFAULT_SHARE_IMAGE = { url: '/background.jpg', width: 1344, height: 768, alt: `${SITE_NAME} วังน้ำเขียว` }
