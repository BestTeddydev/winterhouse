'use client'

import { useState } from 'react'
import { FileText, LogOut } from 'lucide-react'

export default function CheckOutForm({ busy, onSubmit }: { busy: boolean; onSubmit: (notes: string) => void }) {
  const [notes, setNotes] = useState('')
  return (
    <div className="pt-4 border-t border-gray-200">
      <div className="mb-4">
        <label htmlFor="checkout-notes" className="block text-sm font-medium text-gray-700 mb-2">
          <FileText size={16} className="inline mr-1" />
          หมายเหตุออกงาน (ไม่บังคับ)
        </label>
        <textarea
          id="checkout-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="หมายเหตุเพิ่มเติม..."
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>
      <button
        onClick={() => onSubmit(notes)}
        disabled={busy}
        className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            กำลังเช็คเอาท์...
          </>
        ) : (
          <>
            <LogOut size={20} />
            เช็คเอาท์ออกงาน
          </>
        )}
      </button>
    </div>
  )
}
