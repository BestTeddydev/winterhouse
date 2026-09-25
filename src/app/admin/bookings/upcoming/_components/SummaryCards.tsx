import { Calendar, DollarSign, Home, LogOut } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Props {
  total: number
  checkIns: number
  checkOuts: number
  revenue: number
}

export default function SummaryCards({ total, checkIns, checkOuts, revenue }: Props) {
  const cards = [
    { label: 'การจองทั้งหมด', value: total, valueColor: 'text-gray-900', icon: Calendar, box: 'bg-blue-100', iconColor: 'text-blue-600' },
    { label: 'เช็คอินวันนี้', value: checkIns, valueColor: 'text-green-600', icon: Home, box: 'bg-green-100', iconColor: 'text-green-600' },
    { label: 'เช็คเอาท์วันนี้', value: checkOuts, valueColor: 'text-orange-600', icon: LogOut, box: 'bg-orange-100', iconColor: 'text-orange-600' },
    { label: 'รายได้คาดการณ์', value: formatCurrency(revenue), valueColor: 'text-primary-600', icon: DollarSign, box: 'bg-primary-100', iconColor: 'text-primary-600' },
  ]
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {cards.map(({ label, value, valueColor, icon: Icon, box, iconColor }) => (
        <div key={label} className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{label}</p>
              <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
            </div>
            <div className={`w-12 h-12 ${box} rounded-lg flex items-center justify-center`}>
              <Icon className={iconColor} size={24} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
