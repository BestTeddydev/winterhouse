import { User } from 'lucide-react'

export default function EmployeeCell({ employee }: { employee?: { name?: string; email?: string } }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
        <User className="text-primary-600" size={20} />
      </div>
      <div>
        <p className="font-medium text-gray-900">{employee?.name || 'ไม่ระบุชื่อ'}</p>
        <p className="text-sm text-gray-500">{employee?.email || ''}</p>
      </div>
    </div>
  )
}
