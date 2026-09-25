'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { clampGuests, type BookableCampingBlock, type BookableRoom, type SelectedCampingBlock } from '@/lib/bookingForm'
import type { BookingRequest } from './bookingRequest'

const withId = <T,>(data: any): T => ({ ...data, id: data.id || data._id })

/** Loads the requested rooms and camping blocks; `null` while loading, `false` when they can't be loaded */
export function useBookingItems(request: BookingRequest | null) {
  const [items, setItems] = useState<{ rooms: BookableRoom[]; campingBlocks: SelectedCampingBlock[] } | null | false>(null)
  const key = JSON.stringify(request)

  useEffect(() => {
    if (!request) return
    const controller = new AbortController()
    const get = (url: string) => axios.get(url, { signal: controller.signal }).then((res) => res.data)

    Promise.all([
      Promise.all(request.roomIds.map((id) => get(`/api/rooms/${id}`))),
      Promise.all(request.campingBlocks.map(({ id }) => get(`/api/camping-blocks/${id}`))),
    ])
      .then(([rooms, blocks]) =>
        setItems({
          rooms: rooms.map((r) => withId<BookableRoom>(r)),
          campingBlocks: blocks.map((b, i) => {
            const block = withId<BookableCampingBlock>(b)
            return { block, guestCount: clampGuests(block, request.campingBlocks[i].guests ?? 0) }
          }),
        })
      )
      .catch((error) => {
        if (error?.code === 'ERR_CANCELED') return
        console.error('Error fetching booking items:', error)
        setItems(false)
      })
    return () => controller.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` identifies the request
  }, [key])

  return items
}
