'use client'

import Link from 'next/link'
import { Edit, Eye, EyeOff, Package, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export interface AdminAddOn {
  _id: string
  name: string
  description?: string
  price: number
  unit?: string
  isActive: boolean
}

const TH = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'

interface Props {
  addOns: AdminAddOn[]
  onToggle: (addOn: AdminAddOn) => void
  onDelete: (addOn: AdminAddOn) => void
}

export default function AddOnsTable({ addOns, onToggle, onDelete }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className={TH}>ชื่อรายการ</th>
            <th className={TH}>คำอธิบาย</th>
            <th className={TH}>ราคา</th>
            <th className={TH}>หน่วย</th>
            <th className={TH}>สถานะ</th>
            <th className={`${TH} text-right`}>จัดการ</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {addOns.map((addOn) => (
            <tr key={addOn._id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <Package className="text-primary-600" size={20} />
                  <span className="text-sm font-medium text-gray-900">{addOn.name}</span>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-600">{addOn.description || '-'}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(addOn.price)}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm text-gray-600">{addOn.unit || 'หน่วย'}</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button
                  onClick={() => onToggle(addOn)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                    addOn.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {addOn.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                  {addOn.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </button>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-2">
                  <Link
                    href={`/admin/addons/${addOn._id}/edit`}
                    aria-label={`แก้ไข ${addOn.name}`}
                    className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg transition-colors"
                  >
                    <Edit size={18} />
                  </Link>
                  <button
                    onClick={() => onDelete(addOn)}
                    aria-label={`ลบ ${addOn.name}`}
                    className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
