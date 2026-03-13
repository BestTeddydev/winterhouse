'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { formatCurrency } from '@/lib/utils'
import { calculateRoomPriceRange } from '@/lib/pricing'

export default function NewBooking() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  const roomId = searchParams.get('roomId')
  const roomIdsParam = searchParams.get('roomIds') // For multi-room booking
  const roomIds = roomIdsParam ? roomIdsParam.split(',') : []
  const campingBlockId = searchParams.get('campingBlockId')
  const campingBlockIdsParam = searchParams.get('campingBlockIds') // For multi-camping-block booking
  const campingBlockIds = campingBlockIdsParam ? campingBlockIdsParam.split(',') : []
  const guestCountParam = searchParams.get('guestCount')
  const guestCountsParam = searchParams.get('guestCounts') // For multi-camping-block booking
  const guestCounts = guestCountsParam ? guestCountsParam.split(',').map(Number) : []
  const checkIn = searchParams.get('checkIn')
  const checkOut = searchParams.get('checkOut')

  const [room, setRoom] = useState<any>(null)
  const [rooms, setRooms] = useState<any[]>([]) // For multi-room booking
  const [campingBlock, setCampingBlock] = useState<any>(null)
  const [campingBlocks, setCampingBlocks] = useState<Array<{ block: any; guestCount: number }>>([]) // For multi-camping-block booking
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(true)

  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestCount, setGuestCount] = useState(1)
  const [specialRequests, setSpecialRequests] = useState('')
  const [paymentType, setPaymentType] = useState<'FULL' | 'PARTIAL'>('FULL')
  const [addOns, setAddOns] = useState<any[]>([])
  const [selectedAddOns, setSelectedAddOns] = useState<Array<{ addOnId: string; name: string; price: number; quantity: number; unit?: string }>>([])

  useEffect(() => {
    // Wait for session to load
    if (session === undefined) {
      return
    }
    
    setSessionLoading(false)
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Check if we have roomId (single), roomIds (multiple), campingBlockId, or campingBlockIds
    if (!roomId && roomIds.length === 0 && !campingBlockId && campingBlockIds.length === 0) {
      toast.error('ข้อมูลการจองไม่ครบถ้วน กรุณาเลือกห้องพักหรือบล็อคกางเต๊นท์ใหม่')
      router.push('/rooms')
      return
    }

    if (!checkIn || !checkOut) {
      toast.error('ข้อมูลการจองไม่ครบถ้วน กรุณาเลือกวันที่เช็คอิน')
      router.push('/rooms')
      return
    }

    // Handle multiple camping blocks booking
    if (campingBlockIds.length > 0) {
      fetchMultipleCampingBlocks()
    } else if (campingBlockId) {
      // Single camping block booking
      fetchCampingBlock()
    }
    
    // Handle multiple rooms booking
    if (roomIds.length > 0) {
      fetchMultipleRooms()
    } else if (roomId) {
      fetchRoom()
    }
    
    fetchAddOns()
    setGuestName(session.user.name || '')
    setGuestEmail(session.user.email || '')
    if (guestCountParam) {
      setGuestCount(parseInt(guestCountParam))
    }
  }, [session, roomId, checkIn, checkOut, roomIdsParam, campingBlockId, campingBlockIdsParam, guestCountParam])

  const fetchAddOns = async () => {
    try {
      const response = await axios.get('/api/addons?activeOnly=true')
      setAddOns(response.data)
    } catch (error) {
      console.error('Error fetching add-ons:', error)
      // Don't show error toast, just log it
    }
  }

  const fetchMultipleRooms = async () => {
    try {
      console.log('Fetching multiple rooms:', roomIds)
      const roomPromises = roomIds.map(id => axios.get(`/api/rooms/${id}`))
      const responses = await Promise.all(roomPromises)
      const roomsData = responses.map(res => res.data)
      console.log('Fetched rooms data:', roomsData)
      setRooms(roomsData)
      
      // Show first room as the primary display
      if (roomsData.length > 0) {
        setRoom(roomsData[0])
      }
    } catch (error) {
      console.error('Error fetching rooms:', error)
      toast.error('ไม่สามารถโหลดข้อมูลห้องพักได้')
    } finally {
      setLoading(false)
    }
  }

  const fetchRoom = async () => {
    try {
      const response = await axios.get(`/api/rooms/${roomId}`)
      setRoom(response.data)
    } catch (error) {
      console.error('Error fetching room:', error)
      toast.error('ไม่สามารถโหลดข้อมูลห้องพักได้')
    } finally {
      setLoading(false)
    }
  }

  const fetchCampingBlock = async () => {
    try {
      const response = await axios.get(`/api/camping-blocks/${campingBlockId}`)
      setCampingBlock(response.data)
      if (guestCountParam) {
        setGuestCount(parseInt(guestCountParam))
      } else {
        setGuestCount(response.data.minCapacity || 1)
      }
    } catch (error) {
      console.error('Error fetching camping block:', error)
      toast.error('ไม่สามารถโหลดข้อมูลบล็อคกางเต๊นท์ได้')
    } finally {
      setLoading(false)
    }
  }

  const fetchMultipleCampingBlocks = async () => {
    try {
      const blockPromises = campingBlockIds.map((id, index) => 
        axios.get(`/api/camping-blocks/${id}`)
      )
      const responses = await Promise.all(blockPromises)
      const blocksData = responses.map((res, index) => ({
        block: res.data,
        guestCount: guestCounts[index] || res.data.minCapacity || 1
      }))
      setCampingBlocks(blocksData)
    } catch (error) {
      console.error('Error fetching camping blocks:', error)
      toast.error('ไม่สามารถโหลดข้อมูลบล็อคกางเต๊นท์ได้')
    } finally {
      setLoading(false)
    }
  }

  const calculateBasePrice = () => {
    if (!checkIn || !checkOut) return 0

    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    
    let total = 0
    
    // Multiple camping blocks booking
    if (campingBlocks.length > 0) {
      total += campingBlocks.reduce((sum, item) => {
        return sum + (item.block.pricePerPerson * item.guestCount * nights)
      }, 0)
    }
    // Single camping block booking
    else if (campingBlock) {
      total += campingBlock.pricePerPerson * guestCount * nights
    }
    
    // Multiple rooms booking
    if (rooms.length > 0) {
      total += rooms.reduce((sum, room) => {
        try {
          const result = calculateRoomPriceRange(room as any, start, end)
          return sum + result.totalPrice
        } catch (error) {
          return sum + parseFloat(room.price) * nights
        }
      }, 0)
    }
    // Single room booking
    else if (room) {
      try {
        const result = calculateRoomPriceRange(room as any, start, end)
        total += result.totalPrice
      } catch (error) {
        total += parseFloat(room.price) * nights
      }
    }
    
    return total
  }

  const calculateAddOnsPrice = () => {
    return selectedAddOns.reduce((total, addOn) => {
      return total + (addOn.price * addOn.quantity)
    }, 0)
  }

  const calculateSubtotal = () => {
    const basePrice = calculateBasePrice()
    const addOnsPrice = calculateAddOnsPrice()
    return basePrice + addOnsPrice
  }

  const calculateVAT = () => {
    const subtotal = calculateSubtotal()
    // Calculate VAT 3% from subtotal
    return Math.round(subtotal * 0.03)
  }

  const calculateTotalPrice = () => {
    const subtotal = calculateSubtotal()
    const vat = calculateVAT()
    return subtotal + vat
  }

  const calculatePaymentAmount = () => {
    const totalPrice = calculateTotalPrice()
    if (paymentType === 'PARTIAL') {
      return Math.round(totalPrice * 0.5) // 50% down payment
    }
    return totalPrice
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!guestName || !guestEmail || !guestPhone) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    setSubmitting(true)

    try {
      // For multi-room booking, send roomIds array
      // For single room, send roomId
      const bookingData: any = {
        checkIn,
        checkOut,
        totalPrice: calculateTotalPrice(),
        guestName,
        guestEmail,
        guestPhone,
        specialRequests,
        paymentType,
        addOns: selectedAddOns.length > 0 ? selectedAddOns.map(a => ({
          addOnId: a.addOnId,
          name: a.name,
          price: a.price,
          quantity: a.quantity,
          unit: a.unit
        })) : undefined
      }

      // Check if this is camping block(s), multi-room, or single-room booking
      console.log('Submitting booking - campingBlocks:', campingBlocks, 'campingBlock:', campingBlock, 'rooms:', rooms, 'roomId:', roomId)
      
      // Handle multiple camping blocks
      if (campingBlocks.length > 0) {
        const validBlockIds = campingBlocks.map(item => item.block.id || item.block._id).filter(id => id && id !== 'null')
        if (validBlockIds.length > 0) {
          bookingData.campingBlockIds = validBlockIds
          bookingData.guestCounts = campingBlocks.map(item => item.guestCount)
        } else {
          toast.error('ไม่พบ Camping Block IDs ที่ถูกต้อง')
          return
        }
      }
      // Handle single camping block
      else if (campingBlockId && campingBlock) {
        bookingData.campingBlockId = campingBlockId
        bookingData.guestCount = guestCount
      }
      
      // Handle multiple rooms
      if (rooms.length > 0) {
        const validRoomIds = rooms
          .map(r => r.id || r._id)
          .filter(id => id && id !== 'null' && typeof id === 'string')
        console.log('Valid room IDs:', validRoomIds)
        
        if (validRoomIds.length > 0) {
          bookingData.roomIds = validRoomIds
        } else {
          console.error('Invalid room IDs in rooms array:', rooms)
          toast.error('ไม่พบ Room IDs ที่ถูกต้อง')
          return
        }
      }
      // Handle single room
      else if (roomId && roomId !== 'null') {
        bookingData.roomId = roomId
      }
      
      // Validate that at least one booking type is selected
      if (!bookingData.roomId && !bookingData.roomIds && !bookingData.campingBlockId && !bookingData.campingBlockIds) {
        console.error('No valid room ID, room IDs, camping block ID, or camping block IDs found')
        toast.error('กรุณาเลือกห้องพักหรือบล็อคกางเต๊นท์ก่อนจอง')
        return
      }

      const response = await axios.post('/api/bookings', bookingData)

      toast.success('สร้างการจองสำเร็จ')
      router.push(`/bookings/${response.data._id || response.data.id}/payment`)
    } catch (error: any) {
      console.error('Error creating booking:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถสร้างการจองได้')
    } finally {
      setSubmitting(false)
    }
  }

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!room && !campingBlock && !loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">ไม่พบข้อมูลการจอง</h2>
              <p className="text-gray-700 mb-6">กรุณาเลือกห้องพักหรือบล็อคกางเต๊นท์และวันที่เข้าพักใหม่</p>
              <button
                onClick={() => router.push('/rooms')}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                เลือกห้องพักใหม่
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const nights = Math.ceil(
    (new Date(checkOut!).getTime() - new Date(checkIn!).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">ยืนยันการจอง</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-900">ข้อมูลผู้เข้าพัก</h2>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-gray-900 font-semibold mb-2">ชื่อ-นามสกุล *</label>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 text-base placeholder-gray-500"
                    placeholder="กรุณากรอกชื่อ-นามสกุล"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-900 font-semibold mb-2">อีเมล *</label>
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 text-base placeholder-gray-500"
                    placeholder="กรุณากรอกอีเมล"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-900 font-semibold mb-2">เบอร์โทรศัพท์ *</label>
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 text-base placeholder-gray-500"
                    placeholder="กรุณากรอกเบอร์โทรศัพท์"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-900 font-semibold mb-2">ความต้องการพิเศษ</label>
                  <textarea
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 text-base placeholder-gray-500 resize-none"
                    placeholder="เช่น ต้องการเตียงเสริม, ต้องการห้องปลอดบุหรี่"
                  />
                </div>

                {/* Add-ons Section */}
                {addOns.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-gray-900 font-semibold mb-3">อ๊อฟชั่นเสริม</label>
                    <div className="space-y-3">
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

                <div className="mb-6">
                  <label className="block text-gray-900 font-semibold mb-2">ประเภทการชำระเงิน</label>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="full-payment"
                        name="paymentType"
                        value="FULL"
                        checked={paymentType === 'FULL'}
                        onChange={(e) => setPaymentType(e.target.value as 'FULL' | 'PARTIAL')}
                        className="mr-3 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="full-payment" className="text-gray-900 cursor-pointer">
                        <div className="font-medium">ชำระเต็มจำนวน</div>
                        <div className="text-sm text-gray-600">ชำระเงินทั้งหมดทันที</div>
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="partial-payment"
                        name="paymentType"
                        value="PARTIAL"
                        checked={paymentType === 'PARTIAL'}
                        onChange={(e) => setPaymentType(e.target.value as 'FULL' | 'PARTIAL')}
                        className="mr-3 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor="partial-payment" className="text-gray-900 cursor-pointer">
                        <div className="font-medium">ชำระมัดจำ 50%</div>
                        <div className="text-sm text-gray-600">ชำระมัดจำก่อนเข้าพัก และชำระส่วนที่เหลือเมื่อเช็คเอาท์</div>
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'กำลังดำเนินการ...' : 'ดำเนินการต่อ (ชำระเงิน)'}
                </button>
              </form>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-xl font-bold mb-4 text-gray-900">สรุปการจอง</h2>

              <div className="mb-4">
                {/* Multiple camping blocks */}
                {campingBlocks.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">{campingBlocks.length} บล็อคกางเต๊นท์</h3>
                    <div className="space-y-2">
                      {campingBlocks.map((item, idx) => (
                        <div key={item.block.id || idx} className="bg-green-50 p-3 rounded-lg border border-green-200">
                          <p className="font-medium text-gray-900 text-sm">{item.block.name}</p>
                          <p className="text-xs text-gray-600 mt-1">{item.guestCount} คน × {formatCurrency(item.block.pricePerPerson)}/คน</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Single camping block */}
                {campingBlock && !campingBlocks.length && (
                  <>
                    <h3 className="font-semibold text-gray-900">{campingBlock.name}</h3>
                    <p className="text-gray-800 text-sm">{campingBlock.description}</p>
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="font-medium">จำนวนคน: {guestCount} คน</span>
                      <span className="ml-4 font-medium">ราคาต่อคน: {formatCurrency(campingBlock.pricePerPerson)}</span>
                    </div>
                  </>
                )}
                {/* Multiple rooms */}
                {rooms.length > 0 && (
                  <div className={campingBlocks.length > 0 || campingBlock ? 'mt-4' : ''}>
                    <h3 className="font-semibold text-gray-900 mb-2">{rooms.length} ห้องพัก</h3>
                    <div className="space-y-2">
                      {rooms.map((r, idx) => (
                        <div key={r.id || idx} className="bg-gray-50 p-3 rounded-lg">
                          <p className="font-medium text-gray-900 text-sm">{r.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {/* Single room */}
                {room && !rooms.length && !campingBlock && !campingBlocks.length && (
                  <>
                    <h3 className="font-semibold text-gray-900">{room?.name}</h3>
                    <p className="text-gray-800 text-sm">{room?.description}</p>
                  </>
                )}
              </div>

              <div className="border-t border-b py-4 mb-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-800 font-medium">เช็คอิน</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(checkIn!).toLocaleDateString('th-TH')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-800 font-medium">เช็คเอาท์</span>
                  <span className="font-semibold text-gray-900">
                    {new Date(checkOut!).toLocaleDateString('th-TH')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-800 font-medium">จำนวนคืน</span>
                  <span className="font-semibold text-gray-900">{nights} คืน</span>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {campingBlocks.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-800 font-medium">
                      ราคาบล็อคกางเต๊นท์ {nights} คืน
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(campingBlocks.reduce((sum, item) => 
                        sum + (item.block.pricePerPerson * item.guestCount * nights), 0
                      ))}
                    </span>
                  </div>
                )}
                {campingBlock && !campingBlocks.length && (
                  <div className="flex justify-between">
                    <span className="text-gray-800 font-medium">
                      ราคาบล็อคกางเต๊นท์ {nights} คืน ({guestCount} คน)
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(campingBlock.pricePerPerson * guestCount * nights)}
                    </span>
                  </div>
                )}
                {rooms.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-800 font-medium">
                      ราคาห้องพัก {nights} คืน ({rooms.length} ห้อง)
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(rooms.reduce((sum, r) => {
                        try {
                          const result = calculateRoomPriceRange(r as any, new Date(checkIn!), new Date(checkOut!))
                          return sum + result.totalPrice
                        } catch {
                          return sum + (parseFloat(r.price) * nights)
                        }
                      }, 0))}
                    </span>
                  </div>
                )}
                {room && !rooms.length && !campingBlock && !campingBlocks.length && (
                  <div className="flex justify-between">
                    <span className="text-gray-800 font-medium">
                      ราคาห้องพัก {nights} คืน
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(calculateBasePrice())}
                    </span>
                  </div>
                )}
                {selectedAddOns.length > 0 && (
                  <>
                    <div className="border-t pt-2 mt-2">
                      <div className="text-sm font-medium text-gray-700 mb-1">อ๊อฟชั่นเสริม:</div>
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
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-gray-800 font-medium">
                    ราคารวมย่อย
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(calculateSubtotal())}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">
                    VAT 3%
                  </span>
                  <span className="text-gray-600">
                    {formatCurrency(calculateVAT())}
                  </span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-gray-800 font-medium">
                    ราคารวมทั้งหมด
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(calculateTotalPrice())}
                  </span>
                </div>
                {paymentType === 'PARTIAL' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">มัดจำ 50%</span>
                    <span className="text-gray-600">
                      {formatCurrency(calculatePaymentAmount())}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-xl font-bold">
                  <span className="text-gray-900">
                    {paymentType === 'PARTIAL' ? 'ยอดที่ต้องชำระ' : 'ยอดรวม'}
                  </span>
                  <span className="text-primary-700">
                    {formatCurrency(calculatePaymentAmount())}
                  </span>
                </div>
                {paymentType === 'PARTIAL' && (
                  <div className="mt-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>ส่วนที่เหลือ (ชำระเมื่อเช็คอิน)</span>
                      <span>{formatCurrency(calculateTotalPrice() - calculatePaymentAmount())}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

