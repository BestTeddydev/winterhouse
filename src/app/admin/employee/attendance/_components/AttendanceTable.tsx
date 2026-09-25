import { CheckCircle, FileText, MapPin } from 'lucide-react'
import { attendanceDate, attendanceTime } from './attendance'
import AttendanceStatusBadge from './AttendanceStatusBadge'
import EmployeeCell from './EmployeeCell'
import RejectButton from './RejectDialog'

const COLUMNS = ['พนักงาน', 'วันที่', 'เวลาเช็คอิน', 'สถานที่', 'สถานะ', 'จัดการ']

interface Props {
  records: any[]
  onApprove: (id: string) => void
  onReject: (id: string, reason: string) => void
}

/** Check-ins waiting for (or after) approval */
export default function AttendanceTable({ records, onApprove, onReject }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {COLUMNS.map((column) => (
                <th key={column} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <EmployeeCell employee={item.employeeId} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{attendanceDate(item.checkInDate)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{attendanceTime(item.checkInTime)}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {item.location ? (
                      <>
                        <MapPin size={14} />
                        <span>{item.location}</span>
                      </>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </div>
                  {item.notes && (
                    <div className="flex items-start gap-2 text-xs text-gray-500 mt-1">
                      <FileText size={12} className="mt-0.5" />
                      <span className="line-clamp-2">{item.notes}</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <AttendanceStatusBadge status={item.status} bordered />
                  {item.status === 'REJECTED' && item.rejectionReason && <p className="text-xs text-red-600 mt-1 max-w-xs">{item.rejectionReason}</p>}
                  {item.approvedBy && (
                    <p className="text-xs text-gray-500 mt-1">
                      {item.status === 'APPROVED' ? 'อนุมัติโดย' : 'ปฏิเสธโดย'}: {item.approvedBy?.name || 'ผู้ดูแลระบบ'}
                    </p>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.status === 'PENDING' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onApprove(item._id)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle size={14} />
                        อนุมัติ
                      </button>
                      <RejectButton onReject={(reason) => onReject(item._id, reason)} />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
