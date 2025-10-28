'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { calculateRoomPriceRange, getRoomPriceForDate } from '@/lib/pricing'
import { 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  DollarSign,
  MessageSquare,
  Save,
  ArrowLeft,
  Clock,
  CreditCard,
  AlertCircle,
  CheckCircle,
  X
} from 'lucide-react'
import Image from 'next/image'

interface Room {
  id: string
  name: string
  description: string
  imageUrl: string
  imageUrls?: string[]
  price: number
  capacity: number
  amenities: string[]
  hotspots: any[]
  isActive: boolean
  buildingId?: string
  buildingName?: string
  buildingType?: string
  buildingX?: number
  buildingY?: number
}

export default function NewBooking() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([]) // For multi-room booking
  
  // Form data
  const [formData, setFormData] = useState({
    roomId: '',
    checkIn: '',
    checkOut: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestCount: 1,
    specialRequests: '',
    paymentType: 'FULL',
    paymentStatus: 'COMPLETED',
    bookingStatus: 'CONFIRMED',
    totalPrice: 0,
    notes: ''
  })

  useEffect(() => {
    if (session === undefined) return

    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/auth/signin')
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
    }
  }

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room)
    setFormData(prev => ({
      ...prev,
      roomId: room.id,
      totalPrice: room.price
    }))
  }

  const handleRoomToggle = (room: Room) => {
    setSelectedRooms(prev => {
      const isSelected = prev.some(r => r.id === room.id)
      if (isSelected) {
        return prev.filter(r => r.id !== room.id)
      } else {
        return [...prev, room]
      }
    })
  }

  const isRoomSelected = (roomId: string): boolean => {
    return selectedRooms.some(r => r.id === roomId)
  }

  const calculateTotalPrice = () => {
    if (!formData.checkIn || !formData.checkOut) return 0
    
    const checkIn = new Date(formData.checkIn)
    const checkOut = new Date(formData.checkOut)
    
    try {
      // If multiple rooms selected, calculate price for each room based on dates
      if (selectedRooms.length > 0) {
        return selectedRooms.reduce((total, room) => {
          try {
            const result = calculateRoomPriceRange(room as any, checkIn, checkOut)
            return total + result.totalPrice
          } catch (error) {
            // Fallback to old calculation if pricing fails
            const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
            return total + room.price * nights
          }
        }, 0)
      }
      
      // Single room
      if (!selectedRoom) return 0
      
      try {
        const result = calculateRoomPriceRange(selectedRoom as any, checkIn, checkOut)
        return result.totalPrice
      } catch (error) {
        // Fallback to old calculation
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
        return selectedRoom.price * nights
      }
    } catch (error) {
      // Ultimate fallback
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      if (selectedRooms.length > 0) {
        return selectedRooms.reduce((total, room) => total + room.price, 0) * nights
      }
      if (!selectedRoom) return 0
      return selectedRoom.price * nights
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedRooms.length === 0 && !selectedRoom) {
      toast.error('กรุณาเลือกห้องพัก')
      return
    }

    if (!formData.checkIn || !formData.checkOut) {
      toast.error('กรุณาระบุวันเช็คอินและเช็คเอาท์')
      return
    }

    if (!formData.guestName) {
      toast.error('กรุณาระบุชื่อ-นามสกุลของผู้เข้าพัก')
      return
    }

    setLoading(true)

    try {
      // For multi-room booking
      if (selectedRooms.length > 0) {
        const bookingData = {
          ...formData,
          roomIds: selectedRooms.map(r => r.id),
          totalPrice: calculateTotalPrice(),
          isManualBooking: true,
          createdBy: session?.user?.id
        }
        const response = await axios.post('/api/bookings', bookingData)
        toast.success('สร้างการจองสำเร็จ')
        router.push('/admin/bookings')
      } else if (selectedRoom) {
        // Single room booking
        const bookingData = {
          ...formData,
          roomId: selectedRoom.id,
          totalPrice: calculateTotalPrice(),
          isManualBooking: true,
          createdBy: session?.user?.id
        }
        const response = await axios.post('/api/bookings', bookingData)
        toast.success('สร้างการจองสำเร็จ')
        router.push('/admin/bookings')
      }
    } catch (error: any) {
      console.error('Error creating booking:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถสร้างการจองได้')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

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

  if (!session || session.user?.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </button>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">เพิ่มการจองใหม่</h1>
            <p className="text-gray-700 text-lg">สร้างการจองจากช่องทางอื่น</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Room Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <MapPin size={20} />
                เลือกห้องพัก
              </h2>
              
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">💡 สามารถเลือกหลายห้องโดยคลิก checkbox</p>
              </div>

              <div className="space-y-4">
                {rooms.map((room) => (
                  <div
                    key={room.id}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all relative ${
                      isRoomSelected(room.id)
                        ? 'border-green-500 bg-green-50'
                        : selectedRoom?.id === room.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {/* Multi-select Checkbox */}
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRoomToggle(room)
                        }}
                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                          isRoomSelected(room.id)
                            ? 'bg-green-600 border-green-600'
                            : 'border-gray-300 hover:border-primary-500 bg-white'
                        }`}
                      >
                        {isRoomSelected(room.id) && (
                          <CheckCircle size={18} className="text-white" />
                        )}
                      </button>
                    </div>
                    <div className="relative h-32 mb-3 rounded-lg overflow-hidden">
                      <Image
                        src={room.imageUrl || room.imageUrls?.[0] || '/placeholder-room.jpg'}
                        alt={room.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 pr-8">{room.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{room.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">
                        <User size={14} className="inline mr-1" />
                        {room.capacity} คน
                      </span>
                      <div className="text-right">
                        {formData.checkIn ? (
                          <div>
                            <div className="font-bold text-primary-600">
                              ฿{getRoomPriceForDate(room as any, new Date(formData.checkIn)).toLocaleString()}/คืน
                            </div>
                            <div className="text-xs text-gray-500">
                              เริ่มวันที่เลือก
                            </div>
                          </div>
                        ) : (
                          <span className="font-bold text-primary-600">
                            ฿{room.price.toLocaleString()}/คืน
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Selected Rooms Summary */}
              {selectedRooms.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">ห้องที่เลือกแล้ว ({selectedRooms.length})</h3>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedRooms.map(room => (
                      <div key={room.id} className="flex items-center justify-between bg-white rounded px-2 py-1">
                        <span className="text-sm text-gray-900">{room.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRoomToggle(room)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {formData.checkIn && formData.checkOut && (
                    <div className="mt-3 pt-3 border-t border-green-300">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">ราคารวม:</span>
                        <span className="text-lg font-bold text-green-700">
                          ฿{calculateTotalPrice().toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Booking Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Guest Information */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <User size={20} />
                  ข้อมูลผู้เข้าพัก
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ชื่อ-นามสกุล *
                    </label>
                    <input
                      type="text"
                      value={formData.guestName}
                      onChange={(e) => handleInputChange('guestName', e.target.value)}
                      placeholder="กรุณากรอกชื่อ-นามสกุล"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      อีเมล
                    </label>
                    <input
                      type="email"
                      value={formData.guestEmail}
                      onChange={(e) => handleInputChange('guestEmail', e.target.value)}
                      placeholder="(ไม่บังคับ)"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เบอร์โทรศัพท์
                    </label>
                    <input
                      type="tel"
                      value={formData.guestPhone}
                      onChange={(e) => handleInputChange('guestPhone', e.target.value)}
                      placeholder="(ไม่บังคับ)"
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      จำนวนคน
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={selectedRoom?.capacity || 10}
                      value={formData.guestCount}
                      onChange={(e) => handleInputChange('guestCount', parseInt(e.target.value))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                    />
                  </div>
                </div>
              </div>

              {/* Booking Dates */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Calendar size={20} />
                  วันที่เข้าพัก
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      วันเช็คอิน *
                    </label>
                    <input
                      type="date"
                      value={formData.checkIn}
                      onChange={(e) => handleInputChange('checkIn', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      วันเช็คเอาท์ *
                    </label>
                    <input
                      type="date"
                      value={formData.checkOut}
                      onChange={(e) => handleInputChange('checkOut', e.target.value)}
                      min={formData.checkIn || new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Payment & Status */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard size={20} />
                  การชำระเงินและสถานะ
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ประเภทการชำระ
                    </label>
                    <select
                      value={formData.paymentType}
                      onChange={(e) => handleInputChange('paymentType', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                    >
                      <option value="FULL">ชำระเต็มจำนวน</option>
                      <option value="PARTIAL">ชำระบางส่วน</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      สถานะการชำระ
                    </label>
                    <select
                      value={formData.paymentStatus}
                      onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                    >
                      <option value="COMPLETED">ชำระแล้ว</option>
                      <option value="PENDING">รอชำระ</option>
                      <option value="PROCESSING">กำลังดำเนินการ</option>
                      <option value="FAILED">ชำระไม่สำเร็จ</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      สถานะการจอง
                    </label>
                    <select
                      value={formData.bookingStatus}
                      onChange={(e) => handleInputChange('bookingStatus', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                    >
                      <option value="PENDING">รอดำเนินการ</option>
                      <option value="CONFIRMED">ยืนยันแล้ว</option>
                      <option value="COMPLETED">เสร็จสิ้น</option>
                      <option value="CANCELLED">ยกเลิก</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Special Requests & Notes */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MessageSquare size={20} />
                  หมายเหตุและความต้องการพิเศษ
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ความต้องการพิเศษ
                    </label>
                    <textarea
                      value={formData.specialRequests}
                      onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="เช่น ต้องการเตียงเสริม, อาหารพิเศษ, ฯลฯ"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      หมายเหตุสำหรับแอดมิน
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="เช่น จองผ่านโทรศัพท์, ลูกค้าสำคัญ, ฯลฯ"
                    />
                  </div>
                </div>
              </div>

              {/* Price Summary */}
              {(selectedRoom || selectedRooms.length > 0) && formData.checkIn && formData.checkOut && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <DollarSign size={20} />
                    สรุปราคา
                  </h2>
                  
                  {(() => {
                    const checkInDate = new Date(formData.checkIn)
                    const nights = Math.ceil((new Date(formData.checkOut).getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
                    const totalPrice = calculateTotalPrice()
                    
                    // Calculate average price per night
                    const avgPricePerNight = nights > 0 ? Math.round(totalPrice / nights / (selectedRooms.length || selectedRoom ? 1 : 1)) : 0
                    
                    return (
                      <div className="space-y-3">
                        {selectedRooms.length > 0 ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">จำนวนห้อง:</span>
                              <span className="text-gray-900">{selectedRooms.length} ห้อง</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">ราคาเฉลี่ยต่อห้อง/คืน:</span>
                              <span className="text-gray-900">฿{avgPricePerNight.toLocaleString()}</span>
                            </div>
                          </>
                        ) : selectedRoom && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">ห้อง:</span>
                              <span className="text-gray-900">{selectedRoom.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">ราคาต่อคืน (เฉลี่ย):</span>
                              <span className="text-gray-900">฿{avgPricePerNight.toLocaleString()}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">จำนวนคืน:</span>
                          <span className="text-gray-900">{nights} คืน</span>
                        </div>
                        <div className="border-t pt-3">
                          <div className="flex justify-between text-lg font-bold">
                            <span className="text-gray-900">ราคารวม:</span>
                            <span className="text-primary-600">฿{totalPrice.toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500 italic">
                          💡 ราคาคำนวณตามวันประเภท (วันธรรมดา/สุดสัปดาห์/วันหยุด)
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading || (selectedRooms.length === 0 && !selectedRoom)}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save size={20} />
                      สร้างการจอง
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
