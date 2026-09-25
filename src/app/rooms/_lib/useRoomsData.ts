'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import type { CampingBlock, MapType, Room, SiteMapData } from './types'

const PLACEHOLDER_MAP: SiteMapData = { imageUrl: '/placeholder-map.svg', hotspots: [] }

/** Tolerates optional data failing (the page still works without locks or bookings) */
const optional = <T,>(request: Promise<{ data: T }>, fallback: T) => request.then((r) => r.data ?? fallback).catch(() => fallback)

/**
 * Data for the rooms page: rooms and confirmed bookings (loaded once), plus the site map
 * and the locks/camping blocks of the current map type (reloaded when it changes).
 */
export function useRoomsData(mapType: MapType) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [allBookings, setAllBookings] = useState<any[]>([])
  const [siteMap, setSiteMap] = useState<SiteMapData>({ imageUrl: '', hotspots: [] })
  const [campingBlocks, setCampingBlocks] = useState<CampingBlock[]>([])
  const [roomBlocks, setRoomBlocks] = useState<any[]>([])
  const [campingBlockBlocks, setCampingBlockBlocks] = useState<any[]>([])
  const [roomsLoaded, setRoomsLoaded] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    Promise.all([optional(axios.get('/api/rooms'), []), optional(axios.get('/api/bookings/public'), [])]).then(([r, b]) => {
      setRooms(r)
      setAllBookings(b)
      setRoomsLoaded(true)
    })
  }, [])

  useEffect(() => {
    let cancelled = false
    const camping = mapType === 'camping'
    Promise.all([
      axios
        .get(`/api/site-map?type=${mapType}`)
        .then((r) => (r.data?.imageUrl ? { imageUrl: r.data.imageUrl, hotspots: r.data.hotspots || [] } : PLACEHOLDER_MAP))
        .catch((error) => {
          console.error('Error fetching site map:', error)
          return PLACEHOLDER_MAP
        }),
      camping ? optional(axios.get('/api/camping-blocks'), []) : Promise.resolve([]),
      camping ? optional(axios.get('/api/camping-block-blocks?activeOnly=true'), []) : Promise.resolve([]),
      camping ? Promise.resolve([]) : optional(axios.get('/api/room-blocks?activeOnly=true'), []),
    ]).then(([map, blocks, blockLocks, roomLocks]) => {
      if (cancelled) return
      setSiteMap(map)
      setCampingBlocks(blocks)
      setCampingBlockBlocks(blockLocks)
      setRoomBlocks(roomLocks)
      setMapLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [mapType])

  return { rooms, allBookings, siteMap, campingBlocks, roomBlocks, campingBlockBlocks, loading: !roomsLoaded || !mapLoaded }
}
