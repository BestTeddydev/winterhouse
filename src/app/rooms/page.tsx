'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import HotspotImage from '@/components/HotspotImage'
import axios from 'axios'
import { 
  MapPin, 
  Users, 
  Wifi, 
  Car, 
  Utensils, 
  Star, 
  Calendar,
  ArrowRight,
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface Room {
  id: string
  name: string
  description: string
  imageUrl: string
  price: number
  capacity: number
  amenities: string[]
  hotspots: any[]
  status: string
}

interface BuildingHotspot {
  id: string
  x: number
  y: number
  buildingName: string
  buildingType: string
  rooms: string[]
  description: string
  facilities: string[]
}

interface SiteMapData {
  imageUrl: string
  hotspots: BuildingHotspot[]
}

export default function RoomsPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [rooms, setRooms] = useState<Room[]>([])
  const [siteMap, setSiteMap] = useState<SiteMapData>({ imageUrl: '', hotspots: [] })
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingHotspot | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [priceFilter, setPriceFilter] = useState('all')
  const [capacityFilter, setCapacityFilter] = useState('all')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      console.log('Fetching rooms and site map data...')
      
      const [roomsResponse, siteMapResponse] = await Promise.all([
        axios.get('/api/rooms'),
        axios.get('/api/site-map')
      ])
      
      console.log('Rooms data:', roomsResponse.data)
      console.log('Site map data:', siteMapResponse.data)
      
      setRooms(roomsResponse.data)
      
      if (siteMapResponse.data && siteMapResponse.data.imageUrl) {
        console.log('Setting site map:', siteMapResponse.data)
        setSiteMap(siteMapResponse.data)
      } else {
        console.log('No site map data found, using default')
        setSiteMap({ imageUrl: '/placeholder-map.svg', hotspots: [] })
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      // Set default data on error
      setSiteMap({ imageUrl: '/placeholder-map.svg', hotspots: [] })
    } finally {
      setLoading(false)
    }
  }

  const filteredRooms = rooms.filter(room => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         room.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesPrice = priceFilter === 'all' || 
      (priceFilter === 'low' && room.price < 2000) ||
      (priceFilter === 'medium' && room.price >= 2000 && room.price < 5000) ||
      (priceFilter === 'high' && room.price >= 5000)
    
    const matchesCapacity = capacityFilter === 'all' ||
      (capacityFilter === '1-2' && room.capacity <= 2) ||
      (capacityFilter === '3-4' && room.capacity >= 3 && room.capacity <= 4) ||
      (capacityFilter === '5+' && room.capacity >= 5)
    
    return matchesSearch && matchesPrice && matchesCapacity && room.status === 'active'
  })

  const getAmenityIcon = (amenity: string) => {
    const lowerAmenity = amenity.toLowerCase()
    if (lowerAmenity.includes('wifi') || lowerAmenity.includes('อินเทอร์เน็ต')) return <Wifi size={16} />
    if (lowerAmenity.includes('parking') || lowerAmenity.includes('จอดรถ')) return <Car size={16} />
    if (lowerAmenity.includes('cafe') || lowerAmenity.includes('อาหาร')) return <Utensils size={16} />
    return <Star size={16} />
  }

  const handleBooking = (roomId: string) => {
    if (!session) {
      router.push('/auth/signin')
      return
    }
    router.push(`/bookings/new?roomId=${roomId}`)
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
  console.log(siteMap);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">ห้องพักของเรา</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            เลือกห้องพักที่เหมาะกับคุณจากแผนผังอาคารของเรา พร้อมสิ่งอำนวยความสะดวกครบครัน
          </p>
          
          {/* Debug Info */}
          <div className="mt-4 text-sm text-gray-500">
            <p>แผนผัง: {siteMap.imageUrl}</p>
            <p>Hotspots: {siteMap.hotspots.length} จุด</p>
            <p>ห้องพัก: {rooms.length} ห้อง</p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setViewMode('map')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                viewMode === 'map' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MapPin size={16} />
              แผนผังอาคาร
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                viewMode === 'list' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List size={16} />
              รายการห้องพัก
            </button>
          </div>
        </div>

        {viewMode === 'map' ? (
          /* Map View */
          <div className="space-y-8">
            {/* Site Map */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">แผนผังอาคาร</h2>
              
              {siteMap.imageUrl ? (
                <div className="relative">
                  <HotspotImage
                    imageUrl={siteMap.imageUrl}
                    hotspots={siteMap.hotspots}
                    onHotspotClick={(hotspot) => setSelectedBuilding(hotspot as BuildingHotspot)}
                  />
                  
                  {/* Building Info Overlay */}
                  {selectedBuilding && (
                    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-xl">
                          {selectedBuilding.buildingType === 'accommodation' && '🏠'}
                          {selectedBuilding.buildingType === 'cafe' && '☕'}
                          {selectedBuilding.buildingType === 'restaurant' && '🍽️'}
                          {selectedBuilding.buildingType === 'facility' && '🏢'}
                          {selectedBuilding.buildingType === 'parking' && '🚗'}
                          {selectedBuilding.buildingType === 'garden' && '🌳'}
                        </div>
                        <div>
                          <h3 className="font-bold text-gray-900">{selectedBuilding.buildingName}</h3>
                          <p className="text-sm text-gray-600">{selectedBuilding.description}</p>
                        </div>
                      </div>
                      
                      {selectedBuilding.rooms.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-gray-900">ห้องพักในอาคารนี้:</h4>
                          <div className="space-y-1">
                            {selectedBuilding.rooms.map((roomId) => {
                              const room = rooms.find(r => r.id === roomId)
                              return room ? (
                                <Link
                                  key={roomId}
                                  href={`#room-${roomId}`}
                                  className="block p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
                                  onClick={() => setViewMode('list')}
                                >
                                  <div className="flex justify-between items-center">
                                    <span className="font-medium">{room.name}</span>
                                    <span className="text-primary-600 font-bold">฿{room.price.toLocaleString()}</span>
                                  </div>
                                </Link>
                              ) : null
                            })}
                          </div>
                        </div>
                      )}
                      
                      <button
                        onClick={() => setSelectedBuilding(null)}
                        className="mt-3 w-full py-2 px-4 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        ปิด
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <MapPin className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">กำลังโหลดแผนผังอาคาร...</p>
                  <div className="animate-pulse">
                    <div className="h-64 bg-gray-200 rounded-lg"></div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Room List */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">ห้องพักทั้งหมด</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rooms.filter(room => room.status === 'active').map((room) => (
                  <div key={room.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-gray-200 rounded-lg mb-3 overflow-hidden">
                      <Image
                        src={room.imageUrl}
                        alt={room.name}
                        width={300}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="font-bold text-gray-900 mb-2">{room.name}</h4>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{room.description}</p>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Users size={14} />
                        {room.capacity} คน
                      </div>
                      <span className="font-bold text-primary-600">฿{room.price.toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => handleBooking(room.id)}
                      className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                    >
                      จองเลย
                      <ArrowRight size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="ค้นหาห้องพัก..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                </div>

                {/* Price Filter */}
                <div>
                  <select
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">ราคาทั้งหมด</option>
                    <option value="low">ต่ำกว่า ฿2,000</option>
                    <option value="medium">฿2,000 - ฿5,000</option>
                    <option value="high">มากกว่า ฿5,000</option>
                  </select>
                </div>

                {/* Capacity Filter */}
                <div>
                  <select
                    value={capacityFilter}
                    onChange={(e) => setCapacityFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">ความจุทั้งหมด</option>
                    <option value="1-2">1-2 คน</option>
                    <option value="3-4">3-4 คน</option>
                    <option value="5+">5+ คน</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-600">
                  พบ {filteredRooms.length} ห้องพัก
                </p>
              </div>

              {filteredRooms.length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <Calendar className="mx-auto h-16 w-16 text-gray-400 mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">ไม่พบห้องพัก</h3>
                  <p className="text-gray-600">ลองเปลี่ยนเงื่อนไขการค้นหาดู</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredRooms.map((room) => (
                    <div key={room.id} id={`room-${room.id}`} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
                      <div className="aspect-video bg-gray-200 relative">
                        <Image
                          src={room.imageUrl}
                          alt={room.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{room.name}</h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <Users size={16} />
                                {room.capacity} คน
                              </div>
                              <div className="flex items-center gap-1">
                                <Star size={16} />
                                {room.amenities.length} สิ่งอำนวยความสะดวก
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary-600">฿{room.price.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">ต่อคืน</p>
                          </div>
                        </div>
                        
                        <p className="text-gray-700 mb-4 line-clamp-3">{room.description}</p>
                        
                        {/* Amenities */}
                        <div className="mb-6">
                          <h4 className="font-semibold text-gray-900 mb-2">สิ่งอำนวยความสะดวก</h4>
                          <div className="flex flex-wrap gap-2">
                            {room.amenities.slice(0, 4).map((amenity, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                              >
                                {getAmenityIcon(amenity)}
                                {amenity}
                              </div>
                            ))}
                            {room.amenities.length > 4 && (
                              <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                +{room.amenities.length - 4} อื่นๆ
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleBooking(room.id)}
                          className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 font-semibold"
                        >
                          จองห้องพัก
                          <ArrowRight size={16} />
                        </button>
                      </div>
                    </div>
                  )                  )}
                  
                  {/* Admin notice for placeholder */}
                  {siteMap.imageUrl === '/placeholder-map.svg' && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-800 text-sm text-center">
                        💡 แอดมินสามารถเพิ่มแผนผังอาคารได้ที่ 
                        <Link href="/admin/site-map" className="font-semibold underline ml-1">
                          จัดการแผนผัง
                        </Link>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
