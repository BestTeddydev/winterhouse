import Image from 'next/image'
import Link from 'next/link'
import { Edit, Eye, EyeOff, Trash2, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { AdminRoom } from '../_lib/roomList'
import { roomThumbnail } from './RoomGridCard'

interface Props {
  rooms: AdminRoom[]
  onToggle: (room: AdminRoom) => void
  onDelete: (room: AdminRoom) => void
}

const TH = 'px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'

export default function RoomTable({ rooms, onToggle, onDelete }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['ห้องพัก', 'ราคา', 'ความจุ', 'สถานะ', 'จัดการ'].map((c) => (
                <th key={c} className={TH}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rooms.map((room) => (
              <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-16 w-16 relative">
                      <Image src={roomThumbnail(room)} alt={room.name} fill className="rounded-lg object-cover" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                        {room.name}
                        {(room.imageUrls?.length ?? 0) > 1 && (
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">{room.imageUrls!.length} รูป</span>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-1">{room.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{formatCurrency(room.price)}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-1 text-sm text-gray-900">
                    <Users size={16} />
                    {room.capacity} คน
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onToggle(room)}
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
                      room.isActive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {room.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                    {room.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/rooms/${room.id}/edit`} aria-label="แก้ไข" className="p-2 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors">
                      <Edit size={18} />
                    </Link>
                    <button onClick={() => onDelete(room)} aria-label="ลบ" className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
