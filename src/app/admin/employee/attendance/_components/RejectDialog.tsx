'use client'

import { useState } from 'react'
import { XCircle } from 'lucide-react'

/** "Reject" button that asks for the reason first */
export default function RejectButton({ onReject }: { onReject: (reason: string) => void }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const close = () => {
    setOpen(false)
    setReason('')
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700 transition-colors flex items-center gap-1"
      >
        <XCircle size={14} />
        ปฏิเสธ
      </button>

      {open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="reject-title">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full mx-4">
            <h3 id="reject-title" className="text-xl font-bold text-gray-900 mb-4">
              ปฏิเสธการเช็คอิน
            </h3>
            <div className="mb-4">
              <label htmlFor="reject-reason" className="block text-sm font-medium text-gray-700 mb-2">
                เหตุผลในการปฏิเสธ *
              </label>
              <textarea
                id="reject-reason"
                autoFocus
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="ระบุเหตุผล..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onReject(reason.trim())
                  close()
                }}
                disabled={!reason.trim()}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ยืนยัน
              </button>
              <button onClick={close} className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
