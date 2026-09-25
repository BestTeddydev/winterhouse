import { Calendar, CheckCircle, TrendingDown, TrendingUp } from 'lucide-react'

interface Props {
  total: number
  workIn: number
  workOut: number
  approved: number
  pending: number
}

export default function SummaryCards({ total, workIn, workOut, approved, pending }: Props) {
  const cards = [
    { label: 'ทั้งหมด', value: total, color: 'text-gray-900', icon: Calendar, box: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'เข้างาน', value: workIn, color: 'text-green-600', icon: TrendingUp, box: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'ลางาน', value: workOut, color: 'text-orange-600', icon: TrendingDown, box: 'bg-orange-100', iconColor: 'text-orange-600' },
    { label: 'อนุมัติแล้ว', value: approved, color: 'text-blue-600', icon: CheckCircle, box: 'bg-blue-100', iconColor: 'text-blue-600', note: pending > 0 ? `${pending} รออนุมัติ` : '' },
  ]
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map(({ label, value, color, icon: Icon, box, iconColor, note }) => (
        <div key={label} className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              {note !== undefined && <p className="text-xs text-gray-500 mt-1">{note}</p>}
            </div>
            <div className={`p-3 ${box} rounded-lg`}>
              <Icon className={iconColor} size={24} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
