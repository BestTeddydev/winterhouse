'use client'

import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Dates are handled as local "YYYY-MM-DD" keys so time zones never shift a day
function toKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDays(key: string, days: number): string {
  const date = fromKey(key)
  date.setDate(date.getDate() + days)
  return toKey(date)
}

function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((fromKey(checkOut).getTime() - fromKey(checkIn).getTime()) / 86_400_000)
}

const WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

interface BookingCalendarProps {
  /** Check-in date as "YYYY-MM-DD" (empty when nothing is selected) */
  checkIn: string
  nights: number
  /** Whether the night starting on this date ("YYYY-MM-DD") is already booked */
  isNightBooked: (date: string) => boolean
  onChange: (checkIn: string, nights: number) => void
}

/**
 * Hotel-style range picker: first click picks check-in, second click picks check-out.
 * Past dates and booked nights cannot be picked, and a stay can't span a booked night
 * (checking out on the morning a booked night starts is allowed).
 */
export default function BookingCalendar({ checkIn, nights, isNightBooked, onChange }: BookingCalendarProps) {
  const todayKey = toKey(new Date())
  const checkOut = checkIn ? addDays(checkIn, nights) : ''

  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(checkIn ? fromKey(checkIn) : new Date()))
  // After picking a check-in, the next click chooses the check-out
  const [pickingCheckOut, setPickingCheckOut] = useState(false)
  const [hoverKey, setHoverKey] = useState<string | null>(null)

  // Follow check-in changes made outside the calendar (e.g. the search form)
  useEffect(() => {
    if (checkIn) setVisibleMonth(startOfMonth(fromKey(checkIn)))
  }, [checkIn])

  const cells = useMemo(() => buildMonthGrid(visibleMonth), [visibleMonth])
  const canGoBack = visibleMonth > startOfMonth(new Date())

  // First booked night on/after the check-in: the latest possible check-out
  const firstBlockedAfterCheckIn = useMemo(() => {
    if (!checkIn || !pickingCheckOut) return null
    for (let i = 1; i <= 366; i++) {
      const key = addDays(checkIn, i)
      if (isNightBooked(key)) return key
    }
    return null
  }, [checkIn, pickingCheckOut, isNightBooked])

  const rangeHasBookedNight = useMemo(() => {
    if (!checkIn) return false
    for (let i = 0; i < nights; i++) if (isNightBooked(addDays(checkIn, i))) return true
    return false
  }, [checkIn, nights, isNightBooked])

  const isSelectableCheckIn = (key: string) => key >= todayKey && !isNightBooked(key)
  const isSelectableCheckOut = (key: string) =>
    pickingCheckOut && !!checkIn && key > checkIn && (!firstBlockedAfterCheckIn || key <= firstBlockedAfterCheckIn)

  const handleSelect = (key: string) => {
    if (isSelectableCheckOut(key)) {
      onChange(checkIn, nightsBetween(checkIn, key))
      setPickingCheckOut(false)
      return
    }
    if (isSelectableCheckIn(key)) {
      onChange(key, 1)
      setPickingCheckOut(true)
    }
  }

  // While choosing a check-out, preview the range up to the hovered day
  const previewEnd = pickingCheckOut && hoverKey && isSelectableCheckOut(hoverKey) ? hoverKey : checkOut

  const monthLabel = visibleMonth.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })

  return (
    <div className="mt-4 select-none">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
          disabled={!canGoBack}
          className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
          aria-label="เดือนก่อนหน้า"
        >
          <ChevronLeft size={20} />
        </button>
        <h4 className="text-sm font-semibold text-gray-900" aria-live="polite">
          {monthLabel}
        </h4>
        <button
          type="button"
          onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
          className="rounded-lg p-2 text-gray-700 hover:bg-gray-100"
          aria-label="เดือนถัดไป"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <p className="mb-2 text-xs text-gray-600">
        {pickingCheckOut ? 'เลือกวันเช็คเอาท์' : 'เลือกวันเช็คอิน'}
      </p>

      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-lg border border-gray-200 bg-gray-200" role="grid">
        {WEEKDAYS.map((day) => (
          <div key={day} className="bg-gray-50 py-2 text-center text-xs font-semibold text-gray-600" role="columnheader">
            {day}
          </div>
        ))}

        {cells.map((date, index) => {
          if (!date) return <div key={`blank-${index}`} className="bg-white" />

          const key = toKey(date)
          const isPast = key < todayKey
          const booked = isNightBooked(key)
          const isCheckIn = key === checkIn
          const isCheckOut = !!checkIn && key === previewEnd
          const inRange = !!checkIn && key > checkIn && key < previewEnd
          const selectable = isSelectableCheckOut(key) || isSelectableCheckIn(key)
          const isToday = key === todayKey

          let tone = 'bg-white text-gray-900 hover:bg-primary-50'
          if (isPast) tone = 'bg-gray-50 text-gray-300'
          else if (isCheckIn || isCheckOut) tone = 'bg-primary-600 font-semibold text-white'
          else if (inRange) tone = 'bg-primary-100 text-primary-900'
          else if (booked && !isSelectableCheckOut(key)) tone = 'bg-red-50 text-red-300 line-through'

          const status = isPast ? 'ผ่านไปแล้ว' : booked ? 'ไม่ว่าง' : 'ว่าง'
          const role = isCheckIn ? ' (เช็คอิน)' : isCheckOut ? ' (เช็คเอาท์)' : ''

          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              disabled={!selectable}
              aria-selected={isCheckIn || isCheckOut || inRange}
              aria-label={`${date.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} ${status}${role}`}
              onClick={() => handleSelect(key)}
              onMouseEnter={() => setHoverKey(key)}
              onMouseLeave={() => setHoverKey(null)}
              className={`relative flex h-11 items-center justify-center text-sm transition-colors disabled:cursor-not-allowed ${tone}`}
            >
              {date.getDate()}
              {isToday && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-primary-500" aria-hidden />}
            </button>
          )
        })}
      </div>

      {rangeHasBookedNight && !pickingCheckOut && (
        <p className="mt-2 rounded border border-orange-200 bg-orange-50 p-2 text-xs text-orange-800">
          ช่วงวันที่เลือกมีวันที่ไม่ว่าง กรุณาเลือกวันใหม่
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded border border-gray-300 bg-white" /> ว่าง
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-red-100" /> ไม่ว่าง
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 rounded bg-primary-600" /> วันที่เลือก
        </span>
      </div>
    </div>
  )
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

// Full weeks (Sunday first) with blanks before the 1st and after the last day
function buildMonthGrid(month: Date): Array<Date | null> {
  const first = startOfMonth(month)
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const cells: Array<Date | null> = Array(first.getDay()).fill(null)
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(first.getFullYear(), first.getMonth(), day))
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}
