'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { calculateRoomPriceRange, getRoomPriceForDate } from '@/lib/pricing'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'
import { 
  Calendar, 
  User, 
  Phone, 
  Mail, 
  Save,
  ArrowLeft,
  Clock,
  CreditCard,
  AlertCircle,
  Settings,
  MessageSquare,
  MapPin,
  Tent,
  Plus,
  X,
  CheckCircle,
  Users
} from 'lucide-react'

export default function EditBooking() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const bookingId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [booking, setBooking] = useState<any>(null)
  
  // Rooms, Camping Blocks, and Addons
  const [rooms, setRooms] = useState<any[]>([])
  const [campingBlocks, setCampingBlocks] = useState<any[]>([])
  const [addOns, setAddOns] = useState<any[]>([])
  const [selectedRooms, setSelectedRooms] = useState<any[]>([])
  const [selectedCampingBlocks, setSelectedCampingBlocks] = useState<Array<{ block: any; guestCount: number }>>([])
  const [selectedAddOns, setSelectedAddOns] = useState<Array<{ addOnId: string; name: string; price: number; quantity: number; unit?: string }>>([])
  
  // Form data
  const [formData, setFormData] = useState({
    checkIn: '',
    checkOut: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestCount: 1,
    specialRequests: '',
    bookingStatus: 'PENDING',
    paymentStatus: 'PENDING',
    totalPrice: 0,
    manualBookingNotes: '',
    discount: 0,
    discountAmount: 0
  })

  useEffect(() => {
    if (session === undefined) return

    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'OWNER')) {
      router.push('/auth/signin')
      return
    }

    let isMounted = true
    const abortController = new AbortController()

    const fetchAllData = async () => {
      try {
        setLoading(true)

        // Fetch all data in parallel with timeout
        const [bookingResponse, roomsResponse, campingBlocksResponse, addOnsResponse] = await Promise.allSettled([
          axios.get(`/api/bookings/${bookingId}`, { 
            signal: abortController.signal,
            timeout: 30000 
          }),
          axios.get('/api/rooms', { 
            signal: abortController.signal,
            timeout: 30000 
          }),
          axios.get('/api/camping-blocks', { 
            signal: abortController.signal,
            timeout: 30000 
          }),
          axios.get('/api/addons?activeOnly=true', { 
            signal: abortController.signal,
            timeout: 30000 
          })
        ])

        if (!isMounted) return

        // Handle booking response
        if (bookingResponse.status === 'fulfilled') {
          const bookingData = bookingResponse.value.data
      
      setBooking(bookingData)
      setFormData({
        checkIn: bookingData.checkIn ? new Date(bookingData.checkIn).toISOString().split('T')[0] : '',
        checkOut: bookingData.checkOut ? new Date(bookingData.checkOut).toISOString().split('T')[0] : '',
        guestName: bookingData.guestName || '',
        guestEmail: bookingData.guestEmail || '',
        guestPhone: bookingData.guestPhone || '',
        guestCount: bookingData.guestCount || 1,
        specialRequests: bookingData.specialRequests || '',
        bookingStatus: bookingData.status || 'PENDING',
        paymentStatus: bookingData.payment?.status || 'PENDING',
        totalPrice: bookingData.totalPrice || 0,
            manualBookingNotes: bookingData.manualBookingNotes || '',
            discount: bookingData.discount || 0,
            discountAmount: bookingData.discountAmount || 0
          })

          // Load selected rooms
          if (bookingData.roomIds && bookingData.roomIds.length > 0) {
            const roomObjects = bookingData.roomIds.map((r: any) => ({
              id: r._id?.toString() || r.toString(),
              name: r.name,
              description: r.description,
              price: r.price,
              capacity: r.capacity,
              imageUrl: r.imageUrls?.[0] || r.imageUrl,
              imageUrls: r.imageUrls
            }))
            setSelectedRooms(roomObjects)
          } else if (bookingData.roomId) {
            const room = bookingData.roomId
            setSelectedRooms([{
              id: room._id?.toString() || room.toString(),
              name: room.name,
              description: room.description,
              price: room.price,
              capacity: room.capacity,
              imageUrl: room.imageUrls?.[0] || room.imageUrl,
              imageUrls: room.imageUrls
            }])
          }

          // Load selected camping blocks
          if (bookingData.campingBlockIds && bookingData.campingBlockIds.length > 0) {
            const guestCounts = bookingData.guestCounts || []
            const campingBlockObjects = bookingData.campingBlockIds.map((block: any, index: number) => ({
              block: {
                id: block._id?.toString() || block.toString(),
                name: block.name,
                description: block.description,
                pricePerPerson: block.pricePerPerson,
                minCapacity: block.minCapacity,
                maxCapacity: block.maxCapacity,
                imageUrl: block.imageUrls?.[0] || block.imageUrl
              },
              guestCount: guestCounts[index] || block.minCapacity || 1
            }))
            setSelectedCampingBlocks(campingBlockObjects)
          } else if (bookingData.campingBlockId) {
            const block = bookingData.campingBlockId
            setSelectedCampingBlocks([{
              block: {
                id: block._id?.toString() || block.toString(),
                name: block.name,
                description: block.description,
                pricePerPerson: block.pricePerPerson,
                minCapacity: block.minCapacity,
                maxCapacity: block.maxCapacity,
                imageUrl: block.imageUrls?.[0] || block.imageUrl
              },
              guestCount: bookingData.guestCount || block.minCapacity || 1
            }])
          }

          // Load selected addons
          if (bookingData.addOns && bookingData.addOns.length > 0) {
            const addOnObjects = bookingData.addOns.map((addOn: any) => ({
              addOnId: addOn.addOnId?._id?.toString() || addOn.addOnId?.toString() || addOn.addOnId,
              name: addOn.name,
              price: addOn.price,
              quantity: addOn.quantity || 1,
              unit: addOn.unit
            }))
            setSelectedAddOns(addOnObjects)
          }
        } else {
          console.error('Error fetching booking:', bookingResponse.reason)
          if (bookingResponse.reason.name !== 'AbortError' && bookingResponse.reason.code !== 'ERR_CANCELED') {
      toast.error('ไม่สามารถโหลดข้อมูลการจองได้')
            router.push('/admin/bookings')
          }
        }

        // Handle rooms response
        if (roomsResponse.status === 'fulfilled') {
          setRooms(roomsResponse.value.data || [])
        } else {
          console.error('Error fetching rooms:', roomsResponse.reason)
        }

        // Handle camping blocks response
        if (campingBlocksResponse.status === 'fulfilled') {
          setCampingBlocks(campingBlocksResponse.value.data || [])
        } else {
          console.error('Error fetching camping blocks:', campingBlocksResponse.reason)
        }

        // Handle addons response
        if (addOnsResponse.status === 'fulfilled') {
          setAddOns(addOnsResponse.value.data || [])
        } else {
          console.error('Error fetching add-ons:', addOnsResponse.reason)
        }
      } catch (error: any) {
        if (!isMounted) return
        if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
          return
        }
        console.error('Error fetching data:', error)
        toast.error('ไม่สามารถโหลดข้อมูลได้')
      router.push('/admin/bookings')
    } finally {
        if (isMounted) {
      setLoading(false)
        }
      }
    }

    fetchAllData()

    // Cleanup function
    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [session, bookingId, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedRooms.length === 0 && selectedCampingBlocks.length === 0) {
      toast.error('กรุณาเลือกห้องพักหรือบล็อคกางเต๊นท์')
      return
    }
    
    if (!formData.checkIn || !formData.checkOut) {
      toast.error('กรุณาระบุวันเช็คอินและเช็คเอาท์')
      return
    }

    if (!formData.guestName || !formData.guestEmail) {
      toast.error('กรุณาระบุข้อมูลผู้เข้าพัก')
      return
    }

    setSaving(true)

    try {
      const updateData: any = {
        ...formData,
        totalPrice: calculateTotalPrice(),
        discount: Number(formData.discount) || 0,
        discountAmount: Number(formData.discountAmount) || 0
      }

      // Add room data
      if (selectedRooms.length > 0) {
        updateData.roomIds = selectedRooms.map(r => r.id)
        // Clear single roomId if exists
        updateData.roomId = null
      }

      // Add camping block data
      if (selectedCampingBlocks.length > 0) {
        updateData.campingBlockIds = selectedCampingBlocks.map(item => item.block.id)
        updateData.guestCounts = selectedCampingBlocks.map(item => item.guestCount)
        updateData.guestCount = selectedCampingBlocks.reduce((sum, item) => sum + item.guestCount, 0)
        // Clear single campingBlockId if exists
        updateData.campingBlockId = null
      }

      // Add addons
      if (selectedAddOns.length > 0) {
        updateData.addOns = selectedAddOns.map(a => ({
          addOnId: a.addOnId,
          name: a.name,
          price: a.price,
          quantity: a.quantity,
          unit: a.unit
        }))
      } else {
        updateData.addOns = []
      }

      await axios.put(`/api/bookings/${bookingId}`, updateData)
      
      toast.success('อัพเดทการจองสำเร็จ')
      router.push('/admin/bookings')
    } catch (error: any) {
      console.error('Error updating booking:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถอัพเดทการจองได้')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Recalculate price when dates change
    if (field === 'checkIn' || field === 'checkOut') {
      const newTotalPrice = calculateTotalPrice()
      setFormData(prev => ({
        ...prev,
        [field]: value,
        totalPrice: newTotalPrice
      }))
    }
  }

  const handleRoomToggle = (room: any) => {
    setSelectedRooms(prev => {
      const isSelected = prev.some(r => r.id === room.id)
      if (isSelected) {
        return prev.filter(r => r.id !== room.id)
      } else {
        return [...prev, room]
      }
    })
    // Recalculate price
    setTimeout(() => {
      const newTotalPrice = calculateTotalPrice()
      setFormData(prev => ({ ...prev, totalPrice: newTotalPrice }))
    }, 100)
  }

  const isRoomSelected = (roomId: string): boolean => {
    return selectedRooms.some(r => r.id === roomId)
  }

  const handleCampingBlockToggle = (block: any) => {
    setSelectedCampingBlocks(prev => {
      const existingIndex = prev.findIndex(item => item.block.id === block.id)
      if (existingIndex >= 0) {
        return prev.filter((_, i) => i !== existingIndex)
      } else {
        return [...prev, { block, guestCount: block.minCapacity || 1 }]
      }
    })
    // Recalculate price
    setTimeout(() => {
      const newTotalPrice = calculateTotalPrice()
      setFormData(prev => ({ ...prev, totalPrice: newTotalPrice }))
    }, 100)
  }

  const handleCampingBlockGuestCountChange = (blockId: string, guestCount: number) => {
    setSelectedCampingBlocks(prev =>
      prev.map(item =>
        item.block.id === blockId
          ? { ...item, guestCount: Math.max(item.block.minCapacity || 1, Math.min(item.block.maxCapacity, guestCount)) }
          : item
      )
    )
    // Recalculate price
    setTimeout(() => {
      const newTotalPrice = calculateTotalPrice()
      setFormData(prev => ({ ...prev, totalPrice: newTotalPrice }))
    }, 100)
  }

  const isCampingBlockSelected = (blockId: string): boolean => {
    return selectedCampingBlocks.some(item => item.block.id === blockId)
  }

  const handleAddOnToggle = (addOn: any) => {
    setSelectedAddOns(prev => {
      const existing = prev.find(a => a.addOnId === addOn._id)
      if (existing) {
        return prev.filter(a => a.addOnId !== addOn._id)
      } else {
        return [...prev, {
          addOnId: addOn._id,
          name: addOn.name,
          price: addOn.price,
          quantity: 1,
          unit: addOn.unit || 'หน่วย'
        }]
      }
    })
    // Recalculate price
    setTimeout(() => {
      const newTotalPrice = calculateTotalPrice()
      setFormData(prev => ({ ...prev, totalPrice: newTotalPrice }))
    }, 100)
  }

  const handleAddOnQuantityChange = (addOnId: string, quantity: number) => {
    if (quantity < 1) return
    setSelectedAddOns(prev => 
      prev.map(addOn => 
        addOn.addOnId === addOnId 
          ? { ...addOn, quantity }
          : addOn
      )
    )
    // Recalculate price
    setTimeout(() => {
      const newTotalPrice = calculateTotalPrice()
      setFormData(prev => ({ ...prev, totalPrice: newTotalPrice }))
    }, 100)
  }

  const isAddOnSelected = (addOnId: string) => {
    return selectedAddOns.some(a => a.addOnId === addOnId)
  }

  const calculateBasePrice = () => {
    if (!formData.checkIn || !formData.checkOut) return 0
    
    const checkIn = new Date(formData.checkIn)
    const checkOut = new Date(formData.checkOut)
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
    
    let total = 0
    
    // Calculate camping blocks price
    if (selectedCampingBlocks.length > 0) {
      total += selectedCampingBlocks.reduce((sum, item) => {
        return sum + (item.block.pricePerPerson * item.guestCount * nights)
      }, 0)
    }
    
    // Calculate rooms price
    if (selectedRooms.length > 0) {
      total += selectedRooms.reduce((roomTotal, room) => {
        try {
          const result = calculateRoomPriceRange(room as any, checkIn, checkOut)
          return roomTotal + result.totalPrice
        } catch (error) {
          return roomTotal + room.price * nights
        }
      }, 0)
    }
    
    return total
  }

  const calculateAddOnsPrice = () => {
    return selectedAddOns.reduce((total, addOn) => {
      return total + (addOn.price * addOn.quantity)
    }, 0)
  }

  const calculateTotalPrice = () => {
    const basePrice = calculateBasePrice()
    const addOnsPrice = calculateAddOnsPrice()
    const discount = formData.discount || 0
    const discountAmount = formData.discountAmount || 0
    
    let finalPrice = basePrice + addOnsPrice
    if (discount > 0) {
      finalPrice = (basePrice - (basePrice * discount / 100)) + addOnsPrice
    }
    if (discountAmount > 0) {
      finalPrice = (basePrice - discountAmount) + addOnsPrice
    }
    
    return Math.max(0, Math.round(finalPrice))
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

  if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'OWNER')) {
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

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">ไม่พบการจอง</h1>
            <button
              onClick={() => router.push('/admin/bookings')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              กลับไปยังรายการการจอง
            </button>
          </div>
        </div>
      </div>
    )
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
            <h1 className="text-4xl font-bold text-gray-900 mb-2">แก้ไขการจอง</h1>
            <p className="text-gray-700 text-lg">รหัสการจอง: {booking.id?.slice(0, 8) || 'N/A'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar size={20} />
                สรุปการจอง
              </h2>
              
              <div className="space-y-4">
                {/* Selected Rooms */}
                {selectedRooms.length > 0 && (
                <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <MapPin size={16} />
                      ห้องพัก ({selectedRooms.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedRooms.map(room => (
                        <div key={room.id} className="p-2 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-900">{room.name}</p>
                          {formData.checkIn && formData.checkOut && (
                            <p className="text-xs text-gray-600">
                              {formatCurrency(getRoomPriceForDate(room as any, new Date(formData.checkIn)))}/คืน
                            </p>
                          )}
                </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Camping Blocks */}
                {selectedCampingBlocks.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Tent size={16} />
                      บล็อคกางเต๊นท์ ({selectedCampingBlocks.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedCampingBlocks.map(item => (
                        <div key={item.block.id} className="p-2 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-900">{item.block.name}</p>
                          <p className="text-xs text-gray-600">{item.guestCount} คน</p>
                  </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Addons */}
                {selectedAddOns.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Plus size={16} />
                      อ๊อฟชั่นเสริม ({selectedAddOns.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedAddOns.map(addOn => (
                        <div key={addOn.addOnId} className="p-2 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-900">{addOn.name}</p>
                          <p className="text-xs text-gray-600">
                            {addOn.quantity} {addOn.unit} × {formatCurrency(addOn.price)} = {formatCurrency(addOn.price * addOn.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="space-y-2 text-sm border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">จำนวนคืน:</span>
                    <span className="text-gray-900">
                      {formData.checkIn && formData.checkOut
                        ? Math.ceil((new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) / (1000 * 60 * 60 * 24))
                        : Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 60 * 60 * 24))} คืน
                    </span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-900">ราคารวม:</span>
                      <span className="text-primary-600">{formatCurrency(calculateTotalPrice())}</span>
                    </div>
                  </div>
                </div>

                {booking.isManualBooking && (
                  <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-2 text-purple-800 font-medium text-sm">
                      <Settings size={16} />
                      การจองด้วยตนเอง
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Edit Form */}
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      อีเมล *
                    </label>
                    <input
                      type="email"
                      value={formData.guestEmail}
                      onChange={(e) => handleInputChange('guestEmail', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เบอร์โทรศัพท์ *
                    </label>
                    <input
                      type="tel"
                      value={formData.guestPhone}
                      onChange={(e) => handleInputChange('guestPhone', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      จำนวนคน
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={booking.room?.capacity || 10}
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

              {/* Room Selection */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MapPin size={20} />
                  เลือกห้องพัก
                </h2>
                
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">💡 คลิก checkbox เพื่อเลือก/ยกเลิกห้องพัก</p>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className={`p-4 border-2 rounded-lg transition-all relative ${
                        isRoomSelected(room.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="absolute top-2 right-2 z-10">
                        <button
                          type="button"
                          onClick={() => handleRoomToggle(room)}
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
                                {formatCurrency(getRoomPriceForDate(room as any, new Date(formData.checkIn)))}/คืน
                              </div>
                            </div>
                          ) : (
                            <span className="font-bold text-primary-600">
                              {formatCurrency(room.price)}/คืน
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Camping Block Selection */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Tent size={20} />
                  เลือกบล็อคกางเต๊นท์
                </h2>
                
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">💡 คลิก checkbox เพื่อเลือก/ยกเลิกบล็อค และปรับจำนวนคนได้</p>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {campingBlocks.map((block) => {
                    const isSelected = isCampingBlockSelected(block.id)
                    const selectedItem = selectedCampingBlocks.find(item => item.block.id === block.id)
                    const guestCount = selectedItem?.guestCount || block.minCapacity || 1
                    const nights = formData.checkIn && formData.checkOut
                      ? Math.ceil((new Date(formData.checkOut).getTime() - new Date(formData.checkIn).getTime()) / (1000 * 60 * 60 * 24))
                      : 1
                    const totalPrice = block.pricePerPerson * guestCount * nights

                    return (
                      <div
                        key={block.id}
                        className={`p-4 border-2 rounded-lg transition-all relative ${
                          isSelected
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="absolute top-2 right-2 z-10">
                          <button
                            type="button"
                            onClick={() => handleCampingBlockToggle(block)}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-green-600 border-green-600'
                                : 'border-gray-300 hover:border-primary-500 bg-white'
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle size={18} className="text-white" />
                            )}
                          </button>
                        </div>
                        <div className="relative h-32 mb-3 rounded-lg overflow-hidden">
                          <Image
                            src={block.imageUrl || '/placeholder-camping.jpg'}
                            alt={block.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1 pr-8">{block.name}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{block.description}</p>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm text-gray-500">
                            <Users size={14} className="inline mr-1" />
                            {block.minCapacity} - {block.maxCapacity} คน
                          </span>
                          <div className="text-right">
                            <div className="font-bold text-primary-600">
                              {formatCurrency(block.pricePerPerson)} / คน
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              จำนวนคน
                            </label>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const newCount = Math.max(block.minCapacity || 1, guestCount - 1)
                                if (isSelected) {
                                  handleCampingBlockGuestCountChange(block.id, newCount)
                                } else {
                                  handleCampingBlockToggle(block)
                                  setTimeout(() => {
                                    handleCampingBlockGuestCountChange(block.id, newCount)
                                  }, 100)
                                }
                              }}
                              disabled={guestCount <= (block.minCapacity || 1)}
                              className="w-10 h-10 rounded-lg bg-white text-gray-900 border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <X size={18} />
                            </button>
                            <div className="flex-1 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <input
                                  type="number"
                                  min={block.minCapacity || 1}
                                  max={block.maxCapacity}
                                  value={guestCount}
                                  onChange={(e) => {
                                    const newCount = Math.max(
                                      block.minCapacity || 1,
                                      Math.min(block.maxCapacity, parseInt(e.target.value) || block.minCapacity || 1)
                                    )
                                    if (isSelected) {
                                      handleCampingBlockGuestCountChange(block.id, newCount)
                                    } else {
                                      handleCampingBlockToggle(block)
                                      setTimeout(() => {
                                        handleCampingBlockGuestCountChange(block.id, newCount)
                                      }, 100)
                                    }
                                  }}
                                  className="w-16 text-center text-2xl font-bold text-gray-900 bg-gray-50 border-2 border-gray-300 rounded-lg px-2 py-1 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 focus:bg-white transition-all"
                                />
                                <span className="text-base font-semibold text-gray-900">คน</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                const newCount = Math.min(block.maxCapacity, guestCount + 1)
                                if (isSelected) {
                                  handleCampingBlockGuestCountChange(block.id, newCount)
                                } else {
                                  handleCampingBlockToggle(block)
                                  setTimeout(() => {
                                    handleCampingBlockGuestCountChange(block.id, newCount)
                                  }, 100)
                                }
                              }}
                              disabled={guestCount >= block.maxCapacity}
                              className="w-10 h-10 rounded-lg bg-white text-gray-900 border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              <Plus size={18} />
                            </button>
                          </div>
                          {formData.checkIn && formData.checkOut && (
                            <div className="mt-2 text-sm text-gray-600 text-center">
                              ราคารวม: <span className="font-bold text-primary-600">{formatCurrency(totalPrice)}</span>
                              {nights > 1 && <span className="text-gray-500"> ({nights} คืน)</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Add-ons Section */}
              {addOns.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Plus size={20} />
                    อ๊อฟชั่นเสริม
                  </h2>
                  
                  <div className="space-y-3 mb-4">
                    {addOns.map((addOn) => {
                      const isSelected = isAddOnSelected(addOn._id)
                      const selectedAddOn = selectedAddOns.find(a => a.addOnId === addOn._id)
                      
                      return (
                        <div
                          key={addOn._id}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            isSelected
                              ? 'border-primary-500 bg-primary-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleAddOnToggle(addOn)}
                                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                                />
                                <h3 className="font-semibold text-gray-900">{addOn.name}</h3>
                                <span className="text-sm font-bold text-primary-600">
                                  {formatCurrency(addOn.price)}/{addOn.unit || 'หน่วย'}
                                </span>
                              </div>
                              {addOn.description && (
                                <p className="text-sm text-gray-600 ml-8">{addOn.description}</p>
                              )}
                              {isSelected && (
                                <div className="mt-3 ml-8 flex items-center gap-2">
                                  <label className="text-sm text-gray-700">จำนวน:</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={selectedAddOn?.quantity || 1}
                                    onChange={(e) => handleAddOnQuantityChange(addOn._id, parseInt(e.target.value) || 1)}
                                    className="w-20 px-3 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                                  />
                                  <span className="text-sm text-gray-600">{addOn.unit || 'หน่วย'}</span>
                                  <span className="text-sm font-semibold text-primary-600 ml-auto">
                                    รวม: {formatCurrency((selectedAddOn?.price || 0) * (selectedAddOn?.quantity || 1))}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {selectedAddOns.length > 0 && (
                    <div className="mt-4 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-900">รวมอ๊อฟชั่นเสริม:</span>
                        <span className="text-lg font-bold text-primary-600">
                          {formatCurrency(calculateAddOnsPrice())}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status & Payment */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard size={20} />
                  สถานะการจองและการชำระเงิน
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      สถานะการชำระเงิน
                    </label>
                    <select
                      value={formData.paymentStatus}
                      onChange={(e) => handleInputChange('paymentStatus', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                    >
                      <option value="PENDING">รอชำระ</option>
                      <option value="PROCESSING">กำลังดำเนินการ</option>
                      <option value="COMPLETED">ชำระแล้ว</option>
                      <option value="FAILED">ชำระไม่สำเร็จ</option>
                      <option value="REFUNDED">คืนเงินแล้ว</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard size={20} />
                  ราคาและส่วนลด
                </h2>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ราคาห้อง/บล็อค:</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(calculateBasePrice())}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">อ๊อฟชั่นเสริม:</span>
                        <span className="text-gray-900 font-medium">{formatCurrency(calculateAddOnsPrice())}</span>
                      </div>
                      {(formData.discount > 0 || formData.discountAmount > 0) && (
                        <div className="flex justify-between text-red-600">
                          <span>ส่วนลด:</span>
                          <span className="font-medium">
                            {formData.discount > 0 
                              ? `${formData.discount}% (${formatCurrency(calculateBasePrice() * formData.discount / 100)})`
                              : formatCurrency(formData.discountAmount)}
                          </span>
                        </div>
                      )}
                      <div className="border-t pt-2 mt-2">
                        <div className="flex justify-between font-bold text-lg">
                          <span className="text-gray-900">ราคารวม:</span>
                          <span className="text-primary-600">{formatCurrency(calculateTotalPrice())}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                        ส่วนลด (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                        max="100"
                    step="0.01"
                        value={formData.discount}
                        onChange={(e) => {
                          const discount = parseFloat(e.target.value) || 0
                          handleInputChange('discount', discount)
                          if (discount > 0) {
                            handleInputChange('discountAmount', 0)
                          }
                          setTimeout(() => {
                            const newTotalPrice = calculateTotalPrice()
                            setFormData(prev => ({ ...prev, totalPrice: newTotalPrice }))
                          }, 100)
                        }}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ส่วนลด (บาท)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.discountAmount}
                        onChange={(e) => {
                          const discountAmount = parseFloat(e.target.value) || 0
                          handleInputChange('discountAmount', discountAmount)
                          if (discountAmount > 0) {
                            handleInputChange('discount', 0)
                          }
                          setTimeout(() => {
                            const newTotalPrice = calculateTotalPrice()
                            setFormData(prev => ({ ...prev, totalPrice: newTotalPrice }))
                          }, 100)
                        }}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ราคารวมสุดท้าย (บาท) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.totalPrice}
                      onChange={(e) => handleInputChange('totalPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500 font-semibold"
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      💡 ราคาจะคำนวณอัตโนมัติเมื่อเลือกห้อง/บล็อค หรือเปลี่ยนวันที่
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <MessageSquare size={20} />
                  หมายเหตุ
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
                      value={formData.manualBookingNotes}
                      onChange={(e) => handleInputChange('manualBookingNotes', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="เช่น จองผ่านโทรศัพท์, ลูกค้าสำคัญ, ฯลฯ"
                    />
                  </div>
                </div>
              </div>

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
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <Save size={20} />
                      บันทึกการเปลี่ยนแปลง
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
