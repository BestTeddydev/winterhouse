'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { inBuildingOrder, type Catalog } from '@/lib/bookingForm'

const isCancel = (error: any) => error?.name === 'AbortError' || error?.code === 'ERR_CANCELED'

/** Rooms, camping blocks and active add-ons to choose from; `null` until loaded */
export function useBookingCatalog(enabled: boolean): Catalog | null {
  const [catalog, setCatalog] = useState<Catalog | null>(null)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    const get = (url: string, errorMessage?: string) =>
      axios
        .get(url, { signal: controller.signal, timeout: 30000 })
        .then((res) => res.data || [])
        .catch((error) => {
          if (isCancel(error)) throw error
          console.error(`Error fetching ${url}:`, error)
          if (errorMessage) toast.error(errorMessage)
          return []
        })

    Promise.all([
      get('/api/rooms', 'ไม่สามารถโหลดข้อมูลห้องพักได้'),
      get('/api/camping-blocks', 'ไม่สามารถโหลดข้อมูลบล็อคกางเต๊นท์ได้'),
      get('/api/addons?activeOnly=true'),
    ])
      // In the order the buildings were arranged on the site map, like the rooms page
      .then(([rooms, campingBlocks, addOns]) => setCatalog({ rooms: inBuildingOrder(rooms), campingBlocks: inBuildingOrder(campingBlocks), addOns }))
      .catch(() => {}) // cancelled

    return () => controller.abort()
  }, [enabled])

  return catalog
}
