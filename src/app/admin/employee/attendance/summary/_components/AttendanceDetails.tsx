import { attendanceDate, attendanceTime } from '../../_components/attendance'
import AttendanceStatusBadge from '../../_components/AttendanceStatusBadge'
import EmployeeCell from '../../_components/EmployeeCell'

const COLUMNS = ['พนักงาน', 'วันที่', 'เวลา', 'ประเภท', 'สถานะ', 'หมายเหตุ']

export default function AttendanceDetails({ records }: { records: any[] }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">รายละเอียดการเช็คอิน ({records.length} รายการ)</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {COLUMNS.map((column) => (
                <th key={column} className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {records.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <EmployeeCell employee={item.employeeId} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{attendanceDate(item.checkInDate)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{attendanceTime(item.checkInTime)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      item.location === 'เข้างาน' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                    }`}
                  >
                    {item.location || 'ไม่ระบุ'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <AttendanceStatusBadge status={item.status} />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600 max-w-xs truncate">{item.notes || '-'}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
