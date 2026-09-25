import Image from 'next/image'
import Link from 'next/link'
import { DollarSign, Edit, Eye, EyeOff, Trash2, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export interface AdminCampingBlock {
  id: string
  name: string
  description: string
  imageUrl: string
  pricePerPerson: number
  maxCapacity: number
  minCapacity: number
  amenities: string[]
  isActive: boolean
}

interface Props {
  block: AdminCampingBlock
  onToggle: () => void
  onDelete: () => void
}

export default function CampingBlockCard({ block, onToggle, onDelete }: Props) {
  const amenities = block.amenities ?? []
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
      <div className="relative h-48 w-full">
        <Image src={block.imageUrl || '/placeholder-camping.svg'} alt={block.name} fill className="object-cover" />
        <div className="absolute top-2 right-2">
          <button
            onClick={onToggle}
            className={`p-2 rounded-full shadow-lg transition-colors ${
              block.isActive ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'
            }`}
            title={block.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
            aria-label={block.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
          >
            {block.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
        </div>
      </div>

      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{block.name}</h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{block.description}</p>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign size={16} className="text-green-600" />
            <span className="text-gray-700">
              <span className="font-semibold">{formatCurrency(block.pricePerPerson)}</span>
              <span className="text-gray-500"> / คน</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users size={16} className="text-blue-600" />
            <span className="text-gray-700">
              {block.minCapacity} - {block.maxCapacity} คน
            </span>
          </div>
        </div>

        {amenities.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {amenities.slice(0, 3).map((amenity, index) => (
                <span key={index} className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs">
                  {amenity}
                </span>
              ))}
              {amenities.length > 3 && <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">+{amenities.length - 3}</span>}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <Link
            href={`/admin/camping-blocks/${block.id}/edit`}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 transition-colors"
          >
            <Edit size={16} />
            แก้ไข
          </Link>
          <button onClick={onDelete} aria-label="ลบ" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
