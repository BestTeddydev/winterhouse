'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'

type Point = { x: number; y: number }

// Pointer travel (px) before a press counts as a drag rather than a click
const DRAG_THRESHOLD = 3

const clamp = (value: number) => Math.max(0, Math.min(100, value))

/**
 * Dragging hotspots around the map. Positions are percentages of the map box. `onMove` runs on
 * every mouse move; `onDrop` runs once on release, and only when the hotspot actually moved,
 * so a plain click just selects it.
 */
export function useHotspotDrag(
  mapRef: RefObject<HTMLDivElement | null>,
  onMove: (id: string, position: Point) => void,
  onDrop: (id: string, position: Point) => void
) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const drag = useRef<{ start: Point; offset: Point; last: Point | null } | null>(null)
  const callbacks = useRef({ onMove, onDrop })
  useEffect(() => {
    callbacks.current = { onMove, onDrop }
  })

  const start = (e: React.MouseEvent, hotspot: Point & { id: string }) => {
    const rect = mapRef.current?.getBoundingClientRect()
    if (!rect) return
    drag.current = {
      start: { x: e.clientX, y: e.clientY },
      // Where inside the marker it was grabbed, so it doesn't jump to the pointer
      offset: {
        x: e.clientX - rect.left - (hotspot.x / 100) * rect.width,
        y: e.clientY - rect.top - (hotspot.y / 100) * rect.height,
      },
      last: null,
    }
    setDraggingId(hotspot.id)
  }

  useEffect(() => {
    if (!draggingId) return

    const move = (e: MouseEvent) => {
      const rect = mapRef.current?.getBoundingClientRect()
      const current = drag.current
      if (!rect || !current) return
      if (!current.last && Math.hypot(e.clientX - current.start.x, e.clientY - current.start.y) < DRAG_THRESHOLD) return
      current.last = {
        x: clamp(((e.clientX - rect.left - current.offset.x) / rect.width) * 100),
        y: clamp(((e.clientY - rect.top - current.offset.y) / rect.height) * 100),
      }
      callbacks.current.onMove(draggingId, current.last)
    }

    const up = () => {
      const last = drag.current?.last
      drag.current = null
      setDraggingId(null)
      if (last) callbacks.current.onDrop(draggingId, last)
    }

    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
    return () => {
      document.removeEventListener('mousemove', move)
      document.removeEventListener('mouseup', up)
    }
  }, [draggingId, mapRef])

  return { draggingId, start }
}
