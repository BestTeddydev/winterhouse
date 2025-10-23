'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Search, 
  Filter, 
  Building2,
  MapPin,
  MoreVertical
} from 'lucide-react'
import Link from 'next/link'

const buildingTypes = {
  accommodation: '🏠',
  cafe: '☕',
  restaurant: '🍽️',
  facility: '🏢',
  parking: '🚗',
  garden: '🌳'
}

export default function AdminBuildings() {
  const { data: session } = useSession()
  const router = useRouter()
  const [buildings, setBuildings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    if (session === undefined) {
      return
    }

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }

    fetchBuildings()
  }, [session, router])

  const fetchBuildings = async () => {
    try {
      const response = await axios.get('/api/buildings')
      setBuildings(response.data)
    } catch (error) {
      console.error('Error fetching buildings:', error)
      toast.error('ไม่สามารถโหลดข้อมูลอาคารได้')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('ต้องการลบอาคารนี้ใช่หรือไม่?')) return

    try {
      await axios.delete(`/api/buildings/${id}`)
      toast.success('ลบอาคารสำเร็จ')
      fetchBuildings()
    } catch (error) {
      console.error('Error deleting building:', error)
      toast.error('ไม่สามารถลบอาคารได้')
    }
  }

  const filteredBuildings = buildings.filter(building => {
    const matchesSearch = building.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         building.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || building.buildingType === typeFilter
    
    return matchesSearch && matchesType && building.isActive
  })

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

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <Building2 className="text-primary-600" size={32} />
              จัดการอาคาร
            </h1>
            <p className="text-gray-600">จัดการข้อมูลอาคารและตำแหน่งบนแผนผัง</p>
          </div>
          
          <Link
            href="/admin/buildings/new"
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2 font-semibold"
          >
            <Plus size={20} />
            เพิ่มอาคารใหม่
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="ค้นหาอาคาร..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">ประเภทอาคาร</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">ทุกประเภท</option>
                <option value="accommodation">🏠 ที่พัก</option>
                <option value="cafe">☕ คาเฟ่</option>
                <option value="restaurant">🍽️ ร้านอาหาร</option>
                <option value="facility">🏢 สิ่งอำนวยความสะดวก</option>
                <option value="parking">🚗 ที่จอดรถ</option>
                <option value="garden">🌳 สวน</option>
              </select>
            </div>

            <div className="flex items-end">
              <p className="text-gray-600">
                พบ {filteredBuildings.length} อาคาร
              </p>
            </div>
          </div>
        </div>

        {/* Buildings Grid */}
        {filteredBuildings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Building2 className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">ไม่มีอาคาร</h3>
            <p className="text-gray-600 mb-6">เริ่มต้นด้วยการเพิ่มอาคารใหม่</p>
            <Link
              href="/admin/buildings/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
            >
              <Plus size={20} />
              เพิ่มอาคารใหม่
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBuildings.map((building) => (
              <div key={building._id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                <div className="p-6">
                  {/* Building Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center text-2xl">
                        {buildingTypes[building.buildingType as keyof typeof buildingTypes]}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{building.name}</h3>
                        <p className="text-sm text-gray-600 capitalize">{building.buildingType}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <MapPin size={12} />
                        <span>{building.x}%, {building.y}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-700 mb-4 line-clamp-2">{building.description}</p>

                  {/* Facilities */}
                  {building.facilities && building.facilities.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">สิ่งอำนวยความสะดวก:</p>
                      <div className="flex flex-wrap gap-1">
                        {(building.facilities || []).slice(0, 3).map((facility: string, index: number) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                          >
                            {facility}
                          </span>
                        ))}
                        {(building.facilities || []).length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs">
                            +{(building.facilities || []).length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link
                      href={`/admin/buildings/${building._id}/edit`}
                      className="flex-1 py-2 px-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-center text-sm font-medium"
                    >
                      แก้ไข
                    </Link>
                    <button
                      onClick={() => handleDelete(building._id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
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
