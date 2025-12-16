'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Eye, 
  EyeOff,
  Package,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'

interface AddOn {
  _id: string
  name: string
  description?: string
  price: number
  unit?: string
  isActive: boolean
}

export default function AdminAddOns() {
  const { data: session } = useSession()
  const [addOns, setAddOns] = useState<AddOn[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (session && session.user && (session.user.role === 'ADMIN' || session.user.role === 'OWNER')) {
      fetchAddOns()
    }
  }, [session])

  const fetchAddOns = async () => {
    try {
      const response = await axios.get('/api/addons')
      setAddOns(response.data)
    } catch (error) {
      console.error('Error fetching add-ons:', error)
      toast.error('ไม่สามารถโหลดข้อมูลอ๊อฟชั่นเสริมได้')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await axios.put(`/api/addons/${id}`, { isActive: !isActive })
      toast.success('อัพเดทสถานะอ๊อฟชั่นเสริมสำเร็จ')
      fetchAddOns()
    } catch (error) {
      console.error('Error updating add-on:', error)
      toast.error('ไม่สามารถอัพเดทสถานะอ๊อฟชั่นเสริมได้')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบอ๊อฟชั่นเสริม "${name}" ใช่หรือไม่?`)) {
      return
    }

    try {
      await axios.delete(`/api/addons/${id}`)
      toast.success('ลบอ๊อฟชั่นเสริมสำเร็จ')
      fetchAddOns()
    } catch (error) {
      console.error('Error deleting add-on:', error)
      toast.error('ไม่สามารถลบอ๊อฟชั่นเสริมได้')
    }
  }

  const filteredAddOns = addOns
    .filter(addOn => {
      const matchesSearch = addOn.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (addOn.description && addOn.description.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && addOn.isActive) ||
                           (statusFilter === 'inactive' && !addOn.isActive)
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  if (session === undefined) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER')) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">จัดการอ๊อฟชั่นเสริม</h1>
            <p className="text-gray-700 text-lg">เพิ่ม แก้ไข หรือลบอ๊อฟชั่นเสริม</p>
          </div>
          <Link
            href="/admin/addons/new"
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            <Plus size={20} />
            เพิ่มอ๊อฟชั่นเสริม
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ค้นหาอ๊อฟชั่นเสริม..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                <option value="active">เปิดใช้งาน</option>
                <option value="inactive">ปิดใช้งาน</option>
              </select>
            </div>
          </div>
        </div>

        {/* Add-ons List */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : filteredAddOns.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 text-lg">ไม่พบอ๊อฟชั่นเสริม</p>
            <Link
              href="/admin/addons/new"
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus size={20} />
              เพิ่มอ๊อฟชั่นเสริมแรก
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ชื่อรายการ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    คำอธิบาย
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ราคา
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    หน่วย
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    สถานะ
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จัดการ
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAddOns.map((addOn) => (
                  <tr key={addOn._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Package className="text-primary-600" size={20} />
                        <span className="text-sm font-medium text-gray-900">{addOn.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600">
                        {addOn.description || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(addOn.price)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-600">
                        {addOn.unit || 'หน่วย'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(addOn._id, addOn.isActive)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                          addOn.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
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
                          className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg transition-colors"
                        >
                          <Edit size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(addOn._id, addOn.name)}
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
        )}
      </main>
    </div>
  )
}

