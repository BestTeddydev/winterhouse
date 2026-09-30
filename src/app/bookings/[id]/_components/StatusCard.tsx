import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { TONE_CLASSES, bookingStatusTone } from '@/lib/bookingStatus'

/** Customer wording */
const LABELS: Record<string, string> = {
  CONFIRMED: 'ยืนยันแล้ว',
  PENDING: 'รอการยืนยัน',
  EXPIRED: 'หมดเวลาชำระเงิน',
  CANCELLED: 'ยกเลิกแล้ว',
  COMPLETED: 'เสร็จสิ้น',
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'CONFIRMED' || status === 'COMPLETED') return <CheckCircle className="text-green-600" />
  if (status === 'PENDING') return <Clock className="text-yellow-600" />
  if (status === 'CANCELLED') return <XCircle className="text-red-600" />
  return <AlertCircle className="text-gray-600" />
}

export default function StatusCard({ status }: { status: string }) {
  const tone = TONE_CLASSES[bookingStatusTone(status)]
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <StatusIcon status={status} />
          <div>
            <h3 className="font-semibold text-gray-900">สถานะการจอง</h3>
            <p className="text-sm text-gray-600">อัปเดตล่าสุด</p>
          </div>
        </div>
        <span className={`px-4 py-2 rounded-full border-2 font-semibold ${tone.badge} ${tone.border}`}>{LABELS[status] ?? status}</span>
      </div>
    </div>
  )
}
