'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search, 
  Filter, 
  Users,
  DollarSign,
  Tent,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface CampingBlock {
  id: string
  name: string
  description: string
  imageUrl: string
  imageUrls: string[]
  pricePerPerson: number
  maxCapacity: number
  minCapacity: number
  amenities: string[]
  isActive: boolean
  buildingId?: string
  buildingName?: string
}

export default function AdminCampingBlocks() {
  const { data: session } = useSession()
  const router = useRouter()
  const [blocks, setBlocks] = useState<CampingBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    if (session === undefined) {
      return
    }

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!session.user) {
      router.push('/auth/signin')
      return
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }

    fetchBlocks()
  }, [session, router])

  const fetchBlocks = async () => {
    try {
      const response = await axios.get('/api/camping-blocks')
      setBlocks(response.data)
    } catch (error) {
      console.error('Error fetching camping blocks:', error)
      toast.error('ไม่สามารถโหลดข้อมูลบล็อคกางเต๊นท์ได้')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await axios.put(`/api/camping-blocks/${id}`, { isActive: !isActive })
      toast.success('อัพเดทสถานะบล็อคกางเต๊นท์สำเร็จ')
      fetchBlocks()
    } catch (error) {
      console.error('Error updating camping block:', error)
      toast.error('ไม่สามารถอัพเดทสถานะบล็อคกางเต๊นท์ได้')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบบล็อคกางเต๊นท์ "${name}" ใช่หรือไม่?`)) {
      return
    }

    try {
      await axios.delete(`/api/camping-blocks/${id}`)
      toast.success('ลบบล็อคกางเต๊นท์สำเร็จ')
      fetchBlocks()
    } catch (error) {
      console.error('Error deleting camping block:', error)
      toast.error('ไม่สามารถลบบล็อคกางเต๊นท์ได้')
    }
  }

  const filteredBlocks = blocks
    .filter(block => {
      const matchesSearch = block.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           block.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && block.isActive) ||
                           (statusFilter === 'inactive' && !block.isActive)
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  if (session === undefined || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold mb-4"
          >
            <ArrowLeft size={20} />
            กลับไปหน้าแอดมิน
          </Link>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Tent className="text-primary-600" size={36} />
                จัดการบล็อคกางเต๊นท์
              </h1>
              <p className="text-gray-700 text-lg font-medium">
                เพิ่ม แก้ไข หรือลบบล็อคกางเต๊นท์
              </p>
            </div>
            <Link
              href="/admin/camping-blocks/new"
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Plus size={20} />
              เพิ่มบล็อคกางเต๊นท์
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ค้นหาบล็อคกางเต๊นท์..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-600" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                <option value="active">เปิดใช้งาน</option>
                <option value="inactive">ปิดใช้งาน</option>
              </select>
            </div>
          </div>
        </div>

        {/* Blocks List */}
        {filteredBlocks.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Tent className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm || statusFilter !== 'all' ? 'ไม่พบบล็อคกางเต๊นท์' : 'ยังไม่มีบล็อคกางเต๊นท์'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter !== 'all' 
                ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง' 
                : 'เริ่มต้นโดยการเพิ่มบล็อคกางเต๊นท์ใหม่'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Link
                href="/admin/camping-blocks/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus size={20} />
                เพิ่มบล็อคกางเต๊นท์
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlocks.map((block) => (
              <div
                key={block.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {/* Image */}
                <div className="relative h-48 w-full">
                  <Image
                    src={block.imageUrl || '/placeholder-camping.jpg'}
                    alt={block.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => handleToggleActive(block.id, block.isActive)}
                      className={`p-2 rounded-full shadow-lg transition-colors ${
                        block.isActive
                          ? 'bg-green-500 hover:bg-green-600 text-white'
                          : 'bg-gray-500 hover:bg-gray-600 text-white'
                      }`}
                      title={block.isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}
                    >
                      {block.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{block.name}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{block.description}</p>

                  {/* Info */}
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

                  {/* Amenities */}
                  {block.amenities && block.amenities.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {block.amenities.slice(0, 3).map((amenity, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-primary-100 text-primary-700 rounded text-xs"
                          >
                            {amenity}
                          </span>
                        ))}
                        {block.amenities.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{block.amenities.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-gray-200">
                    <Link
                      href={`/admin/camping-blocks/${block.id}/edit`}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Edit size={16} />
                      แก้ไข
                    </Link>
                    <button
                      onClick={() => handleDelete(block.id, block.name)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

