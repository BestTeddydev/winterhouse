import { AlertCircle, CheckCircle, Clock, FileText, LogOut, MapPin, User, XCircle } from 'lucide-react'
import { ATTENDANCE_STATUS_LABELS } from '@/lib/attendance'
import { TONE_CLASSES, type Tone } from '@/lib/bookingStatus'
import { formatDateTime } from '@/lib/utils'
import CheckOutForm from './CheckOutForm'

const STATUS: Record<string, { tone: Tone; icon: typeof Clock }> = {
  APPROVED: { tone: 'green', icon: CheckCircle },
  REJECTED: { tone: 'red', icon: XCircle },
  PENDING: { tone: 'yellow', icon: Clock },
}

function Detail({ icon: Icon, label, children, top = false }: { icon: typeof Clock; label: string; children: React.ReactNode; top?: boolean }) {
  return (
    <div className={`flex ${top ? 'items-start' : 'items-center'} gap-3`}>
      <Icon className="text-gray-400" size={20} />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        {children}
      </div>
    </div>
  )
}

interface Props {
  attendance: any
  checkingOut: boolean
  onCheckOut: (notes: string) => void
}

/** Today's check-in with its approval, and check-out once work was approved */
export default function TodayStatusCard({ attendance, checkingOut, onCheckOut }: Props) {
  const { tone, icon: StatusIcon } = STATUS[attendance.status] ?? { tone: 'gray' as Tone, icon: AlertCircle }
  const canCheckOut = attendance.location === 'เข้างาน' && attendance.status === 'APPROVED' && !attendance.checkoutTime

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">สถานะการเช็คอินวันนี้</h2>
        <span className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 border ${TONE_CLASSES[tone].badge} ${TONE_CLASSES[tone].border}`}>
          <StatusIcon size={16} />
          {ATTENDANCE_STATUS_LABELS[attendance.status] ?? attendance.status}
        </span>
      </div>

      <div className="space-y-3">
        <Detail icon={Clock} label="เวลาเช็คอิน">
          <p className="font-medium text-gray-900">{formatDateTime(attendance.checkInTime)}</p>
        </Detail>
        {attendance.location && (
          <Detail icon={MapPin} label="ประเภท">
            <p className="font-medium text-gray-900">{attendance.location}</p>
          </Detail>
        )}
        {attendance.checkoutTime && (
          <Detail icon={LogOut} label="เวลาออกงาน">
            <p className="font-medium text-gray-900">{formatDateTime(attendance.checkoutTime)}</p>
          </Detail>
        )}
        {attendance.notes && (
          <Detail icon={FileText} label="หมายเหตุ" top>
            <p className="font-medium text-gray-900">{attendance.notes}</p>
          </Detail>
        )}
        {attendance.status === 'REJECTED' && attendance.rejectionReason && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600 font-medium mb-1">เหตุผลที่ปฏิเสธ:</p>
            <p className="text-sm text-red-700">{attendance.rejectionReason}</p>
          </div>
        )}
        {attendance.approvedBy && (
          <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
            <User className="text-gray-400" size={20} />
            <div>
              <p className="text-sm text-gray-500">{attendance.status === 'APPROVED' ? 'อนุมัติโดย' : 'ปฏิเสธโดย'}</p>
              <p className="font-medium text-gray-900">{attendance.approvedBy?.name || 'ผู้ดูแลระบบ'}</p>
              {attendance.approvedAt && <p className="text-xs text-gray-500">{formatDateTime(attendance.approvedAt)}</p>}
            </div>
          </div>
        )}
        {canCheckOut && <CheckOutForm busy={checkingOut} onSubmit={onCheckOut} />}
      </div>
    </div>
  )
}
