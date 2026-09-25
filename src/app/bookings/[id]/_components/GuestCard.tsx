import { Mail, Phone, Users } from 'lucide-react'
import Card from './Card'

export default function GuestCard({ email, phone, specialRequests }: { email?: string; phone?: string; specialRequests?: string }) {
  return (
    <Card icon={Users} title="ข้อมูลผู้เข้าพัก">
      <div className="space-y-3">
        {[
          [Mail, 'อีเมล', email],
          [Phone, 'เบอร์โทรศัพท์', phone],
        ].map(([Icon, label, value]: any) => (
          <div key={label} className="flex items-center gap-3">
            <Icon size={20} className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">{label}</p>
              <p className="font-medium text-gray-900">{value}</p>
            </div>
          </div>
        ))}
        {specialRequests && (
          <div className="pt-3 border-t">
            <p className="text-sm text-gray-600 mb-1">ความต้องการพิเศษ</p>
            <p className="text-gray-900">{specialRequests}</p>
          </div>
        )}
      </div>
    </Card>
  )
}
