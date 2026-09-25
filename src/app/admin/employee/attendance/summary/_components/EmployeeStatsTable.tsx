import { Users } from 'lucide-react'
import type { EmployeeCounts } from '@/lib/attendance'

const COLUMNS: Array<{ label: string; value: (e: EmployeeCounts) => string | number; className: string }> = [
  { label: 'พนักงาน', value: (e) => e.name, className: 'font-medium text-gray-900' },
  { label: 'เข้างาน', value: (e) => e.workIn, className: 'text-green-600 font-semibold' },
  { label: 'ลางาน', value: (e) => e.workOut, className: 'text-orange-600 font-semibold' },
  { label: 'ทั้งหมด', value: (e) => e.total, className: 'text-gray-900' },
  { label: 'อนุมัติแล้ว', value: (e) => e.approved, className: 'text-blue-600' },
  { label: 'รออนุมัติ', value: (e) => e.pending, className: 'text-yellow-600' },
]

export default function EmployeeStatsTable({ employees }: { employees: EmployeeCounts[] }) {
  if (employees.length === 0) return null
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Users size={24} />
        สถิติตามพนักงาน
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.label} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50">
                {COLUMNS.map((c) => (
                  <td key={c.label} className={`px-6 py-4 whitespace-nowrap ${c.className}`}>
                    {c.value(employee)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
