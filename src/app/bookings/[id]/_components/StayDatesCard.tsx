import { Calendar } from 'lucide-react'
import Card from './Card'

const longDate = (date: string) =>
  new Date(date).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long', timeZone: 'Asia/Bangkok' })

export default function StayDatesCard({ checkIn, checkOut }: { checkIn: string; checkOut: string }) {
  return (
    <Card icon={Calendar} title="วันที่เข้าพัก">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          ['วันเช็คอิน', checkIn],
          ['วันเช็คเอาท์', checkOut],
        ].map(([label, date]) => (
          <div key={label} className="border-l-4 border-primary-500 pl-4">
            <p className="text-sm text-gray-600">{label}</p>
            <p className="text-lg font-bold text-gray-900">{longDate(date)}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
