import { ChevronLeft, ChevronRight } from 'lucide-react'
import { bangkokDateKey } from '@/lib/dates'
import type { DayField } from './useOwnerDashboard'

export const DAY_FIELD_LABELS: Record<DayField, string> = { createdAt: 'วันที่สร้าง', checkIn: 'วันที่เช็คอิน' }

/** "YYYY-MM-DD" shifted by whole days */
export function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/** Long Thai date of a "YYYY-MM-DD" key */
export const formatDay = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('th-TH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })

interface Props {
  date: string
  by: DayField
  onDateChange: (date: string) => void
  onByChange: (by: DayField) => void
}

export default function DayPicker({ date, by, onDateChange, onByChange }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">เลือกวันที่</h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label htmlFor="dayField" className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
              กรองตาม:
            </label>
            <select
              id="dayField"
              value={by}
              onChange={(e) => onByChange(e.target.value as DayField)}
              className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs sm:text-sm flex-1 sm:flex-none"
            >
              <option value="createdAt">{DAY_FIELD_LABELS.createdAt}</option>
              <option value="checkIn">{DAY_FIELD_LABELS.checkIn}</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onDateChange(addDays(date, -1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="วันที่ก่อนหน้า">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <input
              type="date"
              aria-label="วันที่"
              value={date}
              onChange={(e) => e.target.value && onDateChange(e.target.value)}
              className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs sm:text-sm"
            />
            <button onClick={() => onDateChange(addDays(date, 1))} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" aria-label="วันที่ถัดไป">
              <ChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={() => onDateChange(bangkokDateKey())}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs sm:text-sm"
            >
              วันนี้
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p className="text-base sm:text-lg text-gray-700 font-medium">{formatDay(date)}</p>
        <p className="text-xs sm:text-sm text-gray-500">กรองตาม: {DAY_FIELD_LABELS[by]}</p>
      </div>
    </div>
  )
}
