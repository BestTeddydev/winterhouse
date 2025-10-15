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
  Grid, 
  List,
  Users,
  DollarSign,
  MoreVertical,
  Star,
  Wifi,
  Car,
  Utensils
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function AdminRooms() {
  const { data: session } = useSession()
  const router = useRouter()
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'capacity'>('name')

  useEffect(() => {
    if (session === undefined) {
      // Session is loading, wait for it
      return
    }

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!session.user) {
      console.error('Session exists but user is undefined')
      router.push('/auth/signin')
      return
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }

    fetchRooms()
  }, [session])

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/api/rooms')
      setRooms(response.data)
    } catch (error) {
      console.error('Error fetching rooms:', error)
      toast.error('ไม่สามารถโหลดข้อมูลห้องพักได้')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await axios.put(`/api/rooms/${id}`, { isActive: !isActive })
      toast.success('อัพเดทสถานะห้องพักสำเร็จ')
      fetchRooms()
    } catch (error) {
      console.error('Error updating room:', error)
      toast.error('ไม่สามารถอัพเดทสถานะห้องพักได้')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบห้อง "${name}" ใช่หรือไม่?`)) {
      return
    }

    try {
      await axios.delete(`/api/rooms/${id}`)
      toast.success('ลบห้องพักสำเร็จ')
      fetchRooms()
    } catch (error) {
      console.error('Error deleting room:', error)
      toast.error('ไม่สามารถลบห้องพักได้')
    }
  }

  // Filter and sort rooms
  const filteredRooms = rooms
    .filter(room => {
      const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           room.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && room.isActive) ||
                           (statusFilter === 'inactive' && !room.isActive)
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'price':
          return a.price - b.price
        case 'capacity':
          return a.capacity - b.capacity
        default:
          return 0
      }
    })

  const getAmenityIcon = (amenity: string) => {
    const lowerAmenity = amenity.toLowerCase()
    if (lowerAmenity.includes('wifi') || lowerAmenity.includes('internet')) return <Wifi size={16} />
    if (lowerAmenity.includes('parking') || lowerAmenity.includes('จอดรถ')) return <Car size={16} />
    if (lowerAmenity.includes('cafe') || lowerAmenity.includes('อาหาร')) return <Utensils size={16} />
    return <Star size={16} />
  }

  if (session === undefined) {
    // Session is still loading
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">จัดการห้องพัก</h1>
            <p className="text-gray-700 text-lg font-medium">จัดการข้อมูลห้องพักและสิ่งอำนวยความสะดวก</p>
          </div>
          <Link
            href="/admin/rooms/new"
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Plus size={20} />
            เพิ่มห้องพักใหม่
          </Link>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="ค้นหาห้องพัก..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="active">เปิดใช้งาน</option>
              <option value="inactive">ปิดใช้งาน</option>
            </select>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="name">เรียงตามชื่อ</option>
              <option value="price">เรียงตามราคา</option>
              <option value="capacity">เรียงตามความจุ</option>
            </select>

            {/* View Mode */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
                }`}
              >
                <Grid size={20} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'
                }`}
              >
                <List size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-700 font-semibold">
            แสดงผล {filteredRooms.length} จาก {rooms.length} ห้องพัก
          </p>
        </div>

        {rooms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">ยังไม่มีห้องพัก</h3>
            <p className="text-gray-500 mb-6">เริ่มต้นด้วยการเพิ่มห้องพักแรกของคุณ</p>
            <Link
              href="/admin/rooms/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold transition-colors"
            >
              <Plus size={20} />
              เพิ่มห้องพักแรก
            </Link>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบห้องพัก</h3>
            <p className="text-gray-500">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <div key={room.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                <div className="relative h-48">
                  <Image
                    src={room.imageUrl}
                    alt={room.name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => handleToggleActive(room.id, room.isActive)}
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 backdrop-blur-sm ${
                        room.isActive
                          ? 'bg-green-500/90 text-white'
                          : 'bg-gray-500/90 text-white'
                      }`}
                    >
                      {room.isActive ? <Eye size={14} /> : <EyeOff size={14} />}
                      {room.isActive ? 'เปิด' : 'ปิด'}
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{room.name}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{room.description}</p>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Users size={18} />
                      <span className="text-sm">{room.capacity} คน</span>
                    </div>
                    <div className="flex items-center gap-2 text-primary-600 font-bold">
                      <DollarSign size={18} />
                      <span>{formatCurrency(room.price)}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {room.amenities.slice(0, 3).map((amenity: string, index: number) => (
                      <div key={index} className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        {getAmenityIcon(amenity)}
                        <span>{amenity}</span>
                      </div>
                    ))}
                    {room.amenities.length > 3 && (
                      <div className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        +{room.amenities.length - 3}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/rooms/${room.id}/edit`}
                      className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center text-sm font-medium transition-colors"
                    >
                      <Edit size={16} className="inline mr-2" />
                      แก้ไข
                    </Link>
                    <button
                      onClick={() => handleDelete(room.id, room.name)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ห้องพัก
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ราคา
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ความจุ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      สถานะ
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      จัดการ
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRooms.map((room) => (
                    <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-16 w-16 relative">
                            <Image
                              src={room.imageUrl}
                              alt={room.name}
                              fill
                              className="rounded-lg object-cover"
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {room.name}
                            </div>
                            <div className="text-sm text-gray-500 line-clamp-1">
                              {room.description}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(room.price)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Users size={16} />
                          {room.capacity} คน
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleActive(room.id, room.isActive)}
                          className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-colors ${
                            room.isActive
                              ? 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {room.isActive ? (
                            <>
                              <Eye size={14} />
                              เปิดใช้งาน
                            </>
                          ) : (
                            <>
                              <EyeOff size={14} />
                              ปิดใช้งาน
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/rooms/${room.id}/edit`}
                            className="p-2 text-primary-600 hover:text-primary-900 hover:bg-primary-50 rounded-lg transition-colors"
                          >
                            <Edit size={18} />
                          </Link>
                          <button
                            onClick={() => handleDelete(room.id, room.name)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
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
          </div>
        )}
      </main>
    </div>
  )
}

