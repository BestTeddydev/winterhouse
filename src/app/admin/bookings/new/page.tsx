'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { calculateRoomPriceRange, getRoomPriceForDate } from '@/lib/pricing'
import { formatCurrency } from '@/lib/utils'
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
  X,
  Upload,
  Image as ImageIcon,
  Plus,
  Users,
  Tent
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
  const [campingBlocks, setCampingBlocks] = useState<any[]>([])
  const [selectedCampingBlocks, setSelectedCampingBlocks] = useState<Array<{ block: any; guestCount: number }>>([])
  const [paymentSlipFile, setPaymentSlipFile] = useState<File | null>(null)
  const [paymentSlipPreview, setPaymentSlipPreview] = useState<string | null>(null)
  const [uploadingSlip, setUploadingSlip] = useState(false)
  const [addOns, setAddOns] = useState<any[]>([])
  const [selectedAddOns, setSelectedAddOns] = useState<Array<{ addOnId: string; name: string; price: number; quantity: number; unit?: string }>>([])
  const [bookingType, setBookingType] = useState<'room' | 'camping' | 'both'>('room')
  
  // Form data
  const [formData, setFormData] = useState({
    roomId: '',
    checkIn: '',
    checkOut: '',
    guestName: '',
    guestEmail: 'unknow@gmail.com',
    guestPhone: '',
    guestCount: 1,
    specialRequests: '',
    paymentType: 'FULL',
    paymentStatus: 'COMPLETED',
    bookingStatus: 'CONFIRMED',
    totalPrice: 0,
    discount: 0,
    discountAmount: 0,
    notes: ''
  })

  useEffect(() => {
    if (session === undefined) return

    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'OWNER')) {
      router.push('/auth/signin')
      return
    }

    let isMounted = true
    const abortController = new AbortController()

    const fetchData = async () => {
      try {
        // Fetch all data in parallel with timeout
        const [roomsResponse, campingBlocksResponse, addOnsResponse] = await Promise.allSettled([
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

        // Handle rooms response
        if (roomsResponse.status === 'fulfilled') {
          setRooms(roomsResponse.value.data || [])
        } else {
          console.error('Error fetching rooms:', roomsResponse.reason)
          if (roomsResponse.reason.name !== 'AbortError' && roomsResponse.reason.code !== 'ERR_CANCELED') {
            toast.error('ไม่สามารถโหลดข้อมูลห้องพักได้')
          }
        }

        // Handle camping blocks response
        if (campingBlocksResponse.status === 'fulfilled') {
          setCampingBlocks(campingBlocksResponse.value.data || [])
        } else {
          console.error('Error fetching camping blocks:', campingBlocksResponse.reason)
          if (campingBlocksResponse.reason.name !== 'AbortError' && campingBlocksResponse.reason.code !== 'ERR_CANCELED') {
            toast.error('ไม่สามารถโหลดข้อมูลบล็อคกางเต๊นท์ได้')
          }
        }

        // Handle addons response
        if (addOnsResponse.status === 'fulfilled') {
          setAddOns(addOnsResponse.value.data || [])
        } else {
          console.error('Error fetching add-ons:', addOnsResponse.reason)
          // Don't show error toast for addons, just log it
        }
      } catch (error: any) {
        if (!isMounted) return
        if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
          return
        }
        console.error('Error fetching data:', error)
      }
    }

    fetchData()

    // Cleanup function
    return () => {
      isMounted = false
      abortController.abort()
    }
  }, [session, router])

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
    
    try {
      // If multiple rooms selected, calculate price for each room based on dates
      if (selectedRooms.length > 0) {
        total += selectedRooms.reduce((roomTotal, room) => {
          try {
            const result = calculateRoomPriceRange(room as any, checkIn, checkOut)
            return roomTotal + result.totalPrice
          } catch (error) {
            // Fallback to old calculation if pricing fails
            return roomTotal + room.price * nights
          }
        }, 0)
      }
      
      // Single room
      if (selectedRoom) {
        try {
          const result = calculateRoomPriceRange(selectedRoom as any, checkIn, checkOut)
          total += result.totalPrice
        } catch (error) {
          // Fallback to old calculation
          total += selectedRoom.price * nights
        }
      }
    } catch (error) {
      // Ultimate fallback
      if (selectedRooms.length > 0) {
        total += selectedRooms.reduce((roomTotal, room) => roomTotal + room.price, 0) * nights
      }
      if (selectedRoom) {
        total += selectedRoom.price * nights
      }
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
    
    // Apply discount to base price only (not add-ons)
    let finalPrice = basePrice + addOnsPrice
    if (discount > 0) {
      finalPrice = (basePrice - (basePrice * discount / 100)) + addOnsPrice
    }
    if (discountAmount > 0) {
      finalPrice = (basePrice - discountAmount) + addOnsPrice
    }
    
    return Math.max(0, Math.round(finalPrice)) // Ensure price is not negative
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
  }

  const isAddOnSelected = (addOnId: string) => {
    return selectedAddOns.some(a => a.addOnId === addOnId)
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
  }

  const handleCampingBlockGuestCountChange = (blockId: string, guestCount: number) => {
    setSelectedCampingBlocks(prev =>
      prev.map(item =>
        item.block.id === blockId
          ? { ...item, guestCount: Math.max(item.block.minCapacity || 1, Math.min(item.block.maxCapacity, guestCount)) }
          : item
      )
    )
  }

  const isCampingBlockSelected = (blockId: string): boolean => {
    return selectedCampingBlocks.some(item => item.block.id === blockId)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedRooms.length === 0 && !selectedRoom && selectedCampingBlocks.length === 0) {
      toast.error('กรุณาเลือกห้องพักหรือบล็อคกางเต๊นท์')
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
      // Upload payment slip if provided
      let paymentSlipUrl: string | null = null
      if (paymentSlipFile) {
        paymentSlipUrl = await uploadPaymentSlip()
        if (!paymentSlipUrl) {
          setLoading(false)
          return // Stop if upload failed
        }
      }

      const bookingData: any = {
        ...formData,
        totalPrice: calculateTotalPrice(),
        discount: Number(formData.discount) || 0,
        discountAmount: Number(formData.discountAmount) || 0,
        isManualBooking: true,
        isManualPayment: true,
        createdBy: session?.user?.id,
        bookingStatus: 'CONFIRMED',
        paymentSlipUrl: paymentSlipUrl,
        addOns: selectedAddOns.length > 0 ? selectedAddOns.map(a => ({
          addOnId: a.addOnId,
          name: a.name,
          price: a.price,
          quantity: a.quantity,
          unit: a.unit
        })) : undefined
      }

      // Add room data
      if (selectedRooms.length > 0) {
        bookingData.roomIds = selectedRooms.map(r => r.id)
      } else if (selectedRoom) {
        bookingData.roomId = selectedRoom.id
      }

      // Add camping block data
      if (selectedCampingBlocks.length > 0) {
        bookingData.campingBlockIds = selectedCampingBlocks.map(item => item.block.id)
        bookingData.guestCounts = selectedCampingBlocks.map(item => item.guestCount)
        // For backward compatibility, set guestCount to sum of all camping block guest counts
        bookingData.guestCount = selectedCampingBlocks.reduce((sum, item) => sum + item.guestCount, 0)
      }

      console.log('Sending booking data:', bookingData)
      const response = await axios.post('/api/bookings', bookingData)
      toast.success('สร้างการจองสำเร็จ')
      router.push('/admin/bookings')
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

  const handleSlipFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error('กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (JPEG, PNG, GIF, WebP)')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      toast.error('ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)')
      return
    }

    setPaymentSlipFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPaymentSlipPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveSlip = () => {
    if (paymentSlipPreview && paymentSlipPreview.startsWith('blob:')) {
      URL.revokeObjectURL(paymentSlipPreview)
    }
    setPaymentSlipFile(null)
    setPaymentSlipPreview(null)
  }

  const uploadPaymentSlip = async (): Promise<string | null> => {
    if (!paymentSlipFile) return null

    setUploadingSlip(true)
    try {
      const formData = new FormData()
      formData.append('file', paymentSlipFile)

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Clean up preview URL
      if (paymentSlipPreview && paymentSlipPreview.startsWith('blob:')) {
        URL.revokeObjectURL(paymentSlipPreview)
      }

      return response.data.url
    } catch (error) {
      console.error('Error uploading payment slip:', error)
      toast.error('ไม่สามารถอัปโหลดรูปภาพสลิปโอนเงินได้')
      return null
    } finally {
      setUploadingSlip(false)
    }
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
          {/* Room/Camping Selection */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              {/* Booking Type Tabs */}
              <div className="mb-6 flex gap-2 border-b border-gray-200">
                <button
                  type="button"
                  onClick={() => setBookingType('room')}
                  className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
                    bookingType === 'room'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MapPin size={16} className="inline mr-1" />
                  ห้องพัก
                </button>
                <button
                  type="button"
                  onClick={() => setBookingType('camping')}
                  className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
                    bookingType === 'camping'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Tent size={16} className="inline mr-1" />
                  กางเต๊นท์
                </button>
              </div>

              {bookingType === 'room' ? (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <MapPin size={20} />
                    เลือกห้องพัก
                  </h2>
                  
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">💡 สามารถเลือกหลายห้องโดยคลิก checkbox</p>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Tent size={20} />
                    เลือกบล็อคกางเต๊นท์
                  </h2>
                  
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">💡 สามารถเลือกหลายบล็อคและกำหนดจำนวนคนได้</p>
                  </div>
                </>
              )}

              {bookingType === 'room' ? (
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
              ) : (
                <div className="space-y-4">
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
                        {/* Selection Checkbox */}
                        <div className="absolute top-2 right-2 z-10">
                          <button
                            type="button"
                            onClick={() => {
                              // If not selected, add with default guest count
                              if (!isSelected) {
                                handleCampingBlockToggle(block)
                              } else {
                                handleCampingBlockToggle(block)
                              }
                            }}
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
                              ฿{block.pricePerPerson.toLocaleString()} / คน
                            </div>
                          </div>
                        </div>
                        
                        {/* Guest Count Selector - Always visible */}
                        <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700">
                              จำนวนคน
                            </label>
                            {!isSelected && (
                              <span className="text-xs text-gray-500">เลือกบล็อคเพื่อบันทึก</span>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const newCount = Math.max(block.minCapacity || 1, guestCount - 1)
                                if (isSelected) {
                                  handleCampingBlockGuestCountChange(block.id, newCount)
                                } else {
                                  // Auto-select when adjusting guest count
                                  if (!isSelected) {
                                    handleCampingBlockToggle(block)
                                  }
                                  // Then update count
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
                                      // Auto-select when typing
                                      if (!isSelected) {
                                        handleCampingBlockToggle(block)
                                      }
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
                                  // Auto-select when adjusting guest count
                                  if (!isSelected) {
                                    handleCampingBlockToggle(block)
                                  }
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
                          {!isSelected && (
                            <div className="mt-2 text-xs text-center text-gray-500">
                              💡 ปรับจำนวนคนเพื่อเลือกบล็อคนี้
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Selected Rooms Summary */}
              {bookingType === 'room' && selectedRooms.length > 0 && (
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

              {/* Selected Camping Blocks Summary */}
              {bookingType === 'camping' && selectedCampingBlocks.length > 0 && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">บล็อคที่เลือกแล้ว ({selectedCampingBlocks.length})</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {selectedCampingBlocks.map(item => (
                      <div key={item.block.id} className="flex items-center justify-between bg-white rounded px-2 py-1">
                        <div className="flex-1">
                          <span className="text-sm text-gray-900">{item.block.name}</span>
                          <span className="text-xs text-gray-500 ml-2">({item.guestCount} คน)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCampingBlockToggle(item.block)}
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
                      placeholder="unknow@gmail.com"
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

              {/* Payment & Status */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CreditCard size={20} />
                  การชำระเงินและสถานะ
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 bg-green-50"
                      disabled
                    >
                      <option value="CONFIRMED">ยืนยันแล้ว (ได้รับมัดจำแล้ว)</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">การจองจากแอดมินจะเป็น CONFIRMED เสมอ เพราะได้รับมัดจำแล้ว</p>
                  </div>
                </div>

                {/* Payment Slip Upload */}
                <div className="border-t pt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รูปภาพสลิปโอนเงิน
                  </label>
                  <div className="space-y-4">
                    {!paymentSlipPreview ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                        <input
                          type="file"
                          id="paymentSlip"
                          accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                          onChange={handleSlipFileSelect}
                          className="hidden"
                        />
                        <label
                          htmlFor="paymentSlip"
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <Upload className="text-gray-400" size={32} />
                          <span className="text-sm text-gray-600">
                            คลิกเพื่ออัปโหลดรูปภาพสลิปโอนเงิน
                          </span>
                          <span className="text-xs text-gray-500">
                            รองรับไฟล์: JPEG, PNG, GIF, WebP (สูงสุด 10MB)
                          </span>
                        </label>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <div className="flex items-center gap-4">
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white border border-gray-200">
                              <Image
                                src={paymentSlipPreview}
                                alt="Payment slip preview"
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900 mb-1">
                                {paymentSlipFile?.name || 'รูปภาพสลิปโอนเงิน'}
                              </p>
                              <p className="text-xs text-gray-500">
                                {(paymentSlipFile?.size || 0) / 1024 / 1024 < 1
                                  ? `${((paymentSlipFile?.size || 0) / 1024).toFixed(2)} KB`
                                  : `${((paymentSlipFile?.size || 0) / 1024 / 1024).toFixed(2)} MB`}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveSlip}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="ลบรูปภาพ"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <label
                            htmlFor="paymentSlipChange"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:text-primary-700 cursor-pointer border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
                          >
                            <ImageIcon size={16} />
                            เปลี่ยนรูปภาพ
                          </label>
                          <input
                            type="file"
                            id="paymentSlipChange"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={handleSlipFileSelect}
                            className="hidden"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Discount Section */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <DollarSign size={20} />
                  ส่วนลด
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ส่วนลด (เปอร์เซ็นต์)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.discount}
                      onChange={(e) => {
                        const discount = parseFloat(e.target.value) || 0
                        handleInputChange('discount', discount)
                        handleInputChange('discountAmount', 0) // Clear fixed amount when using percentage
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="0"
                    />
                    <p className="mt-1 text-xs text-gray-500">กรอกเป็นเปอร์เซ็นต์ (0-100)</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ส่วนลด (จำนวนเงิน)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.discountAmount}
                      onChange={(e) => {
                        const discountAmount = parseFloat(e.target.value) || 0
                        handleInputChange('discountAmount', discountAmount)
                        handleInputChange('discount', 0) // Clear percentage when using fixed amount
                      }}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                      placeholder="0"
                    />
                    <p className="mt-1 text-xs text-gray-500">กรอกเป็นจำนวนเงิน (บาท)</p>
                  </div>
                </div>
                {(formData.discount > 0 || formData.discountAmount > 0) && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">ราคาก่อนส่วนลด:</span>
                      <span className="text-gray-900">฿{calculateBasePrice().toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-red-700 font-medium">ส่วนลด:</span>
                      <span className="text-red-700 font-bold">
                        {formData.discount > 0 
                          ? `-฿${(calculateBasePrice() * formData.discount / 100).toLocaleString()} (${formData.discount}%)`
                          : `-฿${formData.discountAmount.toLocaleString()}`
                        }
                      </span>
                    </div>
                  </div>
                )}
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
              {(selectedRoom || selectedRooms.length > 0 || selectedCampingBlocks.length > 0) && formData.checkIn && formData.checkOut && (
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
                        {selectedCampingBlocks.length > 0 && (
                          <>
                            <div className="flex justify-between">
                              <span className="text-gray-600">บล็อคกางเต๊นท์:</span>
                              <span className="text-gray-900">{selectedCampingBlocks.length} บล็อค</span>
                            </div>
                            {selectedCampingBlocks.map((item, idx) => {
                              const blockPrice = item.block.pricePerPerson * item.guestCount * nights
                              return (
                                <div key={idx} className="flex justify-between text-sm text-gray-600 ml-4">
                                  <span>{item.block.name} ({item.guestCount} คน)</span>
                                  <span>{formatCurrency(blockPrice)}</span>
                                </div>
                              )
                            })}
                          </>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-600">จำนวนคืน:</span>
                          <span className="text-gray-900">{nights} คืน</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">ราคารวม:</span>
                          <span className="text-gray-900">{formatCurrency(calculateBasePrice())}</span>
                        </div>
                        {selectedAddOns.length > 0 && (
                          <>
                            <div className="border-t pt-3 mt-3">
                              <div className="text-sm font-medium text-gray-700 mb-2">อ๊อฟชั่นเสริม:</div>
                              {selectedAddOns.map((addOn, idx) => (
                                <div key={idx} className="flex justify-between text-sm text-gray-600 mb-1">
                                  <span>{addOn.name} x{addOn.quantity} {addOn.unit}</span>
                                  <span>{formatCurrency(addOn.price * addOn.quantity)}</span>
                                </div>
                              ))}
                              <div className="flex justify-between mt-2 pt-2 border-t">
                                <span className="text-gray-700 font-medium">รวมอ๊อฟชั่นเสริม:</span>
                                <span className="text-gray-900 font-medium">{formatCurrency(calculateAddOnsPrice())}</span>
                              </div>
                            </div>
                          </>
                        )}
                        {((formData.discount > 0 || formData.discountAmount > 0) && totalPrice < (calculateBasePrice() + calculateAddOnsPrice())) && (
                          <>
                            <div className="border-t pt-3">
                              <div className="flex justify-between">
                                <span className="text-gray-600">ราคาก่อนส่วนลด:</span>
                                <span className="text-gray-600 line-through">฿{calculateBasePrice().toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-red-700">
                                <span className="text-red-700">ส่วนลด:</span>
                                <span className="text-red-700 font-bold">
                                  {formData.discount > 0 
                                    ? `-฿${(calculateBasePrice() * formData.discount / 100).toLocaleString()} (${formData.discount}%)`
                                    : `-฿${formData.discountAmount.toLocaleString()}`
                                  }
                                </span>
                              </div>
                            </div>
                            <div className="border-t pt-3 mt-3">
                              <div className="flex justify-between text-lg font-bold">
                                <span className="text-gray-900">ราคารวมหลังหักส่วนลด:</span>
                                <span className="text-primary-600">฿{totalPrice.toLocaleString()}</span>
                              </div>
                            </div>
                          </>
                        )}
                        {!(formData.discount > 0 || formData.discountAmount > 0) && (
                          <div className="border-t pt-3">
                            <div className="flex justify-between text-lg font-bold">
                              <span className="text-gray-900">ราคารวม:</span>
                              <span className="text-primary-600">฿{totalPrice.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
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
                  disabled={loading || (selectedRooms.length === 0 && !selectedRoom && selectedCampingBlocks.length === 0)}
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
