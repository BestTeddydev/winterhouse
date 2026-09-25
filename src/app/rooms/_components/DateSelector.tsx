import { Calendar } from 'lucide-react'
import { checkOutDate } from '../_lib/stay'
import type { Stay } from '../_lib/types'

interface Props extends Stay {
  onCheckInChange: (checkInDate: string) => void
  onNightsChange: (nights: number) => void
}

/** Check-in date and number of nights for the rooms page */
export default function DateSelector({ checkInDate, nights, onCheckInChange, onNightsChange }: Props) {
  const checkOut = checkOutDate({ checkInDate, nights })
  return (
    <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <Calendar className="text-primary-600" size={20} />
        เลือกวันที่เช็คอิน
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">วันเช็คอิน</label>
          <input
            type="date"
            value={checkInDate}
            onChange={(e) => onCheckInChange(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนคืน</label>
          <select
            value={nights}
            onChange={(e) => onNightsChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {Array.from(new Set([1, 2, 3, 4, 5, 6, 7, 14, 30, nights])).sort((a, b) => a - b).map(n => (
              <option key={n} value={n}>{n} คืน</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">วันเช็คเอาท์</label>
          <div className="w-full px-3 py-2 bg-gray-700 border border-gray-300 rounded-lg text-white">
            {checkInDate ? new Date(checkOut).toLocaleDateString('th-TH') : 'เลือกวันเช็คอินก่อน'}
          </div>
        </div>
      </div>
      {checkInDate && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="text-sm text-blue-800">
            <strong>ข้อมูลการจอง:</strong> เช็คอิน {new Date(checkInDate).toLocaleDateString('th-TH')} - เช็คเอาท์ {new Date(checkOut).toLocaleDateString('th-TH')} ({nights} คืน)
          </div>
          <div className="text-xs text-blue-600 mt-1">
            💡 แสดงเฉพาะห้องพักที่ว่างในวันที่เลือก
          </div>
        </div>
      )}
    </div>
  )
}
