import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { TONE_CLASSES, type Tone } from '@/lib/bookingStatus'
import { ATTENDANCE_STATUS_LABELS } from '@/lib/attendance'

const STATUS: Record<string, { tone: Tone; icon: typeof Clock }> = {
  APPROVED: { tone: 'green', icon: CheckCircle },
  REJECTED: { tone: 'red', icon: XCircle },
  PENDING: { tone: 'yellow', icon: Clock },
}

/** `bordered` is the approval page's style; the summary shows unknown statuses as pending */
export default function AttendanceStatusBadge({ status, bordered = false }: { status: string; bordered?: boolean }) {
  const known = STATUS[status]
  const { tone, icon: Icon } = known ?? (bordered ? { tone: 'gray' as Tone, icon: AlertCircle } : STATUS.PENDING)
  const label = ATTENDANCE_STATUS_LABELS[status] ?? (bordered ? status : ATTENDANCE_STATUS_LABELS.PENDING)
  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${bordered ? `border ${TONE_CLASSES[tone].border} ` : ''}${TONE_CLASSES[tone].badge}`}
    >
      {(known || bordered) && <Icon size={bordered ? 16 : 14} />}
      {label}
    </span>
  )
}
