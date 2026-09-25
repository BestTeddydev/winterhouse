'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import { Clock, FileText, MapPin } from 'lucide-react'
import { WORK_TYPES } from '@/lib/attendance'

interface Props {
  busy: boolean
  /** After a rejection the form is shown again */
  again?: boolean
  onSubmit: (values: { location: string; notes: string }) => Promise<boolean>
}

export default function CheckInForm({ busy, again = false, onSubmit }: Props) {
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')

  const submit = async () => {
    if (!location) return void toast.error('กรุณาเลือกประเภทรายงานตัว')
    if (await onSubmit({ location, notes })) {
      setLocation('')
      setNotes('')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">{again ? 'เช็คอินใหม่อีกครั้ง' : 'เช็คอินเข้างาน'}</h2>

      <div className="space-y-4">
        <div>
          <label htmlFor="work-type" className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin size={16} className="inline mr-1" />
            ประเภทรายงานตัว *
          </label>
          <select
            id="work-type"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="">-- รายงานตัว --</option>
            {WORK_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="checkin-notes" className="block text-sm font-medium text-gray-700 mb-2">
            <FileText size={16} className="inline mr-1" />
            หมายเหตุ (ไม่บังคับ)
          </label>
          <textarea
            id="checkin-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="หมายเหตุเพิ่มเติม..."
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <button
          onClick={submit}
          disabled={busy}
          className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              กำลังเช็คอิน...
            </>
          ) : (
            <>
              <Clock size={20} />
              เช็คอินเข้างาน
            </>
          )}
        </button>
      </div>
    </div>
  )
}
