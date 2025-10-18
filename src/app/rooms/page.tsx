'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import SiteMapViewer from '@/components/SiteMapViewer'
import axios from 'axios'
import toast from 'react-hot-toast'
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
  List,
  Bed,
  Eye,
  EyeOff,
  X,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
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

interface RoomAvailability {
  roomId: string
  availability: { [key: string]: 'available' | 'booked' | 'partial' }
  bookings: Array<{
    id: string
    checkIn: string
    checkOut: string
    status: string
  }>
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
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [roomAvailability, setRoomAvailability] = useState<RoomAvailability | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)
  const [checkInDate, setCheckInDate] = useState('')
  const [nights, setNights] = useState(1)
  const [selectedBookingConflicts, setSelectedBookingConflicts] = useState<any[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDateRange, setSelectedDateRange] = useState<{start: Date | null, end: Date | null}>({start: null, end: null})

  useEffect(() => {
    fetchData()
  }, [])

  // Sync calendar with form date selection
  useEffect(() => {
    if (checkInDate) {
      const selectedDate = new Date(checkInDate)
      setCurrentMonth(selectedDate)
      setSelectedDateRange({
        start: selectedDate,
        end: new Date(selectedDate.getTime() + (nights - 1) * 24 * 60 * 60 * 1000)
      })
    }
  }, [checkInDate, nights])

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

  const getAmenityIcon = (amenity: string) => {
    const lowerAmenity = amenity.toLowerCase()
    if (lowerAmenity.includes('wifi') || lowerAmenity.includes('อินเทอร์เน็ต')) return <Wifi size={16} />
    if (lowerAmenity.includes('parking') || lowerAmenity.includes('จอดรถ')) return <Car size={16} />
    if (lowerAmenity.includes('cafe') || lowerAmenity.includes('อาหาร')) return <Utensils size={16} />
    return <Star size={16} />
  }

  const handleBooking = async (roomId: string) => {
    if (!session) {
      toast.error('กรุณาเข้าสู่ระบบก่อนจองห้องพัก')
      const currentUrl = window.location.pathname + window.location.search
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(currentUrl)}`)
      return
    }
    
    if (!checkInDate) {
      toast.error('กรุณาเลือกวันที่เช็คอินก่อนจองห้องพัก')
      return
    }
    
    const checkOutDate = calculateCheckOutDate()
    const conflicts = checkBookingConflicts()
    
    if (conflicts.length > 0) {
      toast.error('วันที่ที่เลือกมีการจองทับซ้อน กรุณาเลือกวันที่อื่น')
      return
    }
    
    // Additional real-time availability check
    try {
      const response = await axios.get(`/api/rooms/${roomId}/availability`)
      const availability = response.data
      
      const selectedCheckIn = new Date(checkInDate)
      const selectedCheckOut = new Date(checkOutDate)
      
      const hasConflict = availability.bookings.some((booking: any) => {
        const bookingCheckIn = new Date(booking.checkIn)
        const bookingCheckOut = new Date(booking.checkOut)
        
        return (
          (selectedCheckIn < bookingCheckOut && selectedCheckOut > bookingCheckIn) ||
          (selectedCheckIn >= bookingCheckIn && selectedCheckOut <= bookingCheckOut) ||
          (selectedCheckIn <= bookingCheckIn && selectedCheckOut >= bookingCheckOut)
        )
      })
      
      if (hasConflict) {
        toast.error('ห้องพักไม่ว่างในวันที่เลือก กรุณาเลือกวันที่อื่น')
        return
      }
      
      // Proceed with booking
      router.push(`/bookings/new?roomId=${roomId}&checkIn=${checkInDate}&checkOut=${checkOutDate}&nights=${nights}`)
    } catch (error) {
      console.error('Error checking room availability:', error)
      toast.error('ไม่สามารถตรวจสอบความพร้อมของห้องได้')
    }
  }

  const handleRoomBook = (roomId: string) => {
    handleBooking(roomId)
  }

  const handleBuildingSelect = (building: BuildingHotspot | null) => {
    console.log('Building selected:', building)
    setSelectedBuilding(building)
    setSelectedRoom(null)
    setRoomAvailability(null)
  }

  const fetchRoomAvailability = async (roomId: string) => {
    try {
      const response = await axios.get(`/api/rooms/${roomId}/availability`)
      setRoomAvailability(response.data)
    } catch (error) {
      console.error('Error fetching room availability:', error)
      toast.error('ไม่สามารถโหลดข้อมูลการจองได้')
    }
  }

  const getAvailabilityStatus = (date: string) => {
    if (!roomAvailability) return 'unknown'
    return roomAvailability.availability[date] || 'available'
  }

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200'
      case 'booked': return 'bg-red-100 text-red-800 border-red-200'
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getAvailabilityIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle size={12} />
      case 'booked': return <XCircle size={12} />
      case 'partial': return <Clock size={12} />
      default: return null
    }
  }

  const calculateCheckOutDate = () => {
    if (!checkInDate) return ''
    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkIn)
    checkOut.setDate(checkOut.getDate() + nights)
    return checkOut.toISOString().split('T')[0]
  }

  const checkBookingConflicts = () => {
    if (!roomAvailability || !checkInDate) return []

    const checkOutDate = calculateCheckOutDate()
    const conflicts: any[] = []

    roomAvailability.bookings.forEach(booking => {
      const bookingCheckIn = new Date(booking.checkIn)
      const bookingCheckOut = new Date(booking.checkOut)
      const selectedCheckIn = new Date(checkInDate)
      const selectedCheckOut = new Date(checkOutDate)

      // Check for overlap
      if (
        (selectedCheckIn < bookingCheckOut && selectedCheckOut > bookingCheckIn) ||
        (bookingCheckIn < selectedCheckOut && bookingCheckOut > selectedCheckIn)
      ) {
        conflicts.push(booking)
      }
    })

    return conflicts
  }

  const isDateInSelectedRange = (date: string) => {
    if (!checkInDate) return false
    
    const checkOutDate = calculateCheckOutDate()
    const checkDate = new Date(date)
    const startDate = new Date(checkInDate)
    const endDate = new Date(checkOutDate)
    
    return checkDate >= startDate && checkDate < endDate
  }

  const getDateStatus = (date: string) => {
    const baseStatus = getAvailabilityStatus(date)
    const isSelected = isDateInSelectedRange(date)
    
    if (isSelected && baseStatus === 'booked') {
      return 'conflict'
    }
    
    return baseStatus
  }

  const getDateColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800 border-green-200'
      case 'booked': return 'bg-red-100 text-red-800 border-red-200'
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'conflict': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getDateIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle size={12} />
      case 'booked': return <XCircle size={12} />
      case 'partial': return <Clock size={12} />
      case 'conflict': return <XCircle size={12} />
      default: return null
    }
  }

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isDateInRange = (date: Date, start: Date | null, end: Date | null) => {
    if (!start || !end) return false
    return date >= start && date <= end
  }

  const isDateSelected = (date: Date) => {
    if (!selectedDateRange.start) return false
    if (!selectedDateRange.end) return date.getTime() === selectedDateRange.start.getTime()
    return isDateInRange(date, selectedDateRange.start, selectedDateRange.end)
  }

  const handleDateClick = (date: Date) => {
    if (!selectedDateRange.start || selectedDateRange.end) {
      // Start new selection
      setSelectedDateRange({ start: date, end: null })
      setCheckInDate(date.toISOString().split('T')[0])
      setNights(1)
    } else {
      // Complete selection
      const start = selectedDateRange.start
      const end = date
      if (end < start) {
        setSelectedDateRange({ start: end, end: start })
        setCheckInDate(end.toISOString().split('T')[0])
        const calculatedNights = Math.ceil((start.getTime() - end.getTime()) / (1000 * 60 * 60 * 24)) + 1
        setNights(calculatedNights)
      } else {
        setSelectedDateRange({ start, end })
        const calculatedNights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
        setNights(calculatedNights)
      }
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth)
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1)
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1)
    }
    setCurrentMonth(newMonth)
  }

  // Check if room is available for selected dates
  const isRoomAvailable = (room: Room) => {
    if (!checkInDate) return true // Show all rooms if no date selected
    
    const checkOutDate = calculateCheckOutDate()
    const selectedCheckIn = new Date(checkInDate)
    const selectedCheckOut = new Date(checkOutDate)
    
    // Check if room has any bookings that conflict with selected dates
    if (roomAvailability && roomAvailability.roomId === room.id) {
      return !roomAvailability.bookings.some(booking => {
        const bookingCheckIn = new Date(booking.checkIn)
        const bookingCheckOut = new Date(booking.checkOut)
        
        // Check for overlap - more comprehensive check
        return (
          // New booking starts before existing booking ends AND new booking ends after existing booking starts
          (selectedCheckIn < bookingCheckOut && selectedCheckOut > bookingCheckIn) ||
          // New booking is completely within existing booking
          (selectedCheckIn >= bookingCheckIn && selectedCheckOut <= bookingCheckOut) ||
          // New booking completely encompasses existing booking
          (selectedCheckIn <= bookingCheckIn && selectedCheckOut >= bookingCheckOut)
        )
      })
    }
    
    // If no room availability data, we need to fetch it
    // For now, return true but this should be improved
    return true
  }

  // Enhanced availability status check for calendar
  const getCalendarAvailabilityStatus = (date: string) => {
    if (!roomAvailability) return 'available'
    
    // Check if date is in the availability data
    const status = roomAvailability.availability[date]
    if (status) return status
    
    // If not in current month data, check bookings
    const dateObj = new Date(date)
    const hasBooking = roomAvailability.bookings.some(booking => {
      const bookingCheckIn = new Date(booking.checkIn)
      const bookingCheckOut = new Date(booking.checkOut)
      bookingCheckOut.setDate(bookingCheckOut.getDate() - 1) // Booked until day before checkout
      
      return dateObj >= bookingCheckIn && dateObj <= bookingCheckOut
    })
    
    return hasBooking ? 'booked' : 'available'
  }

  // Get filtered rooms based on availability
  const getFilteredRooms = () => {
    let filteredRooms = rooms.filter(room => room.isActive)
    
    // Apply date-based filtering if date is selected
    if (checkInDate) {
      filteredRooms = filteredRooms.filter(room => isRoomAvailable(room))
    }
    
    // Apply other filters
    filteredRooms = filteredRooms.filter(room => {
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
      
      return matchesSearch && matchesPrice && matchesCapacity
    })
    
    return filteredRooms
  }

  const filteredRooms = getFilteredRooms()

  // Reset calendar selection when room changes
  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room)
    fetchRoomAvailability(room.id)
    // Reset calendar to current month if no date is selected
    if (!checkInDate) {
      setCurrentMonth(new Date())
      setSelectedDateRange({ start: null, end: null })
    }
  }

  // Image Gallery Modal Component
  const ImageGalleryModal = ({ 
    images, 
    currentIndex, 
    onClose, 
    onNext, 
    onPrev 
  }: { 
    images: string[]
    currentIndex: number
    onClose: () => void
    onNext: () => void
    onPrev: () => void
  }) => {
    if (!showImageModal) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="relative max-w-4xl max-h-full">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X size={24} />
          </button>
          
          <div className="relative">
            <Image
              src={images[currentIndex]}
              alt={`Gallery image ${currentIndex + 1}`}
              width={800}
              height={600}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            
            {images.length > 1 && (
              <>
                <button
                  onClick={onPrev}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft size={32} />
                </button>
                <button
                  onClick={onNext}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                  disabled={currentIndex === images.length - 1}
                >
                  <ChevronRight size={32} />
                </button>
              </>
            )}
          </div>
          
          <div className="text-center mt-4 text-white">
            <p>{currentIndex + 1} / {images.length}</p>
          </div>
        </div>
      </div>
    )
  }

  // Interactive Calendar Component
  const InteractiveCalendar = ({ roomAvailability }: { roomAvailability: RoomAvailability | null }) => {
    if (!roomAvailability) return null

    const today = new Date()
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ]
    const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

    const conflicts = checkBookingConflicts()

    return (
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">ปฏิทินการจองล่วงหน้า</h4>
        
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="เดือนก่อนหน้า"
          >
            <ChevronLeft size={20} />
          </button>
          
          {/* Month/Year Selector */}
          <div className="flex items-center gap-2">
            <select
              value={currentMonth.getMonth()}
              onChange={(e) => {
                const newMonth = new Date(currentMonth)
                newMonth.setMonth(parseInt(e.target.value))
                setCurrentMonth(newMonth)
              }}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {monthNames.map((month, index) => (
                <option key={index} value={index}>{month}</option>
              ))}
            </select>
            
            <select
              value={currentMonth.getFullYear()}
              onChange={(e) => {
                const newMonth = new Date(currentMonth)
                newMonth.setFullYear(parseInt(e.target.value))
                setCurrentMonth(newMonth)
              }}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 1 + i
                return (
                  <option key={year} value={year}>{year}</option>
                )
              })}
            </select>
            
            {/* Today Button */}
            <button
              onClick={() => setCurrentMonth(new Date())}
              className="px-3 py-1 bg-primary-600 text-white rounded-lg text-sm hover:bg-primary-700 transition-colors"
              title="กลับไปวันนี้"
            >
              วันนี้
            </button>
          </div>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="เดือนถัดไป"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Selected Date Info */}
        {(selectedDateRange.start || checkInDate) && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>วันที่เลือก:</strong> 
              {selectedDateRange.start 
                ? selectedDateRange.start.toLocaleDateString('th-TH')
                : new Date(checkInDate).toLocaleDateString('th-TH')
              }
              {(selectedDateRange.end || (checkInDate && nights > 1)) && (
                <>
                  {' - '}
                  {selectedDateRange.end 
                    ? selectedDateRange.end.toLocaleDateString('th-TH')
                    : new Date(calculateCheckOutDate()).toLocaleDateString('th-TH')
                  }
                  {' ('}
                  {selectedDateRange.end && selectedDateRange.start
                    ? Math.ceil((selectedDateRange.end.getTime() - selectedDateRange.start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                    : nights
                  }
                  {' คืน)'}
                </>
              )}
            </div>
          </div>
        )}

        {/* Conflict Warning */}
        {conflicts.length > 0 && (
          <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
            <div className="flex items-center gap-1 text-orange-800 font-medium mb-1">
              <XCircle size={12} />
              มีการจองที่ทับซ้อนกับวันที่ที่เลือก
            </div>
            {conflicts.map((conflict, index) => (
              <div key={index} className="text-orange-700">
                • {new Date(conflict.checkIn).toLocaleDateString('th-TH')} - {new Date(conflict.checkOut).toLocaleDateString('th-TH')} ({conflict.status})
              </div>
            ))}
          </div>
        )}

        {/* Calendar Grid */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-gray-50">
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center text-sm font-semibold text-gray-600 border-r border-gray-200 last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {/* Empty cells for days before month starts */}
            {Array.from({ length: firstDay }, (_, i) => (
              <div key={`empty-${i}`} className="h-12 border-r border-b border-gray-200 last:border-r-0"></div>
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
              const dateStr = date.toISOString().split('T')[0]
              const status = getCalendarAvailabilityStatus(dateStr)
              const isToday = date.toDateString() === today.toDateString()
              const isSelected = isDateSelected(date)
              const isInRange = selectedDateRange.start && selectedDateRange.end && 
                isDateInRange(date, selectedDateRange.start, selectedDateRange.end)
              const isPast = date < today

              return (
                <button
                  key={day}
                  onClick={() => !isPast && handleDateClick(date)}
                  disabled={isPast}
                  className={`h-12 border-r border-b border-gray-200 last:border-r-0 text-sm transition-colors ${
                    isPast 
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : isSelected
                      ? 'bg-primary-600 text-white hover:bg-primary-700'
                      : isInRange
                      ? 'bg-primary-100 text-primary-800 hover:bg-primary-200'
                      : status === 'available'
                      ? 'bg-green-50 text-green-800 hover:bg-green-100'
                      : status === 'booked'
                      ? 'bg-red-50 text-red-800 hover:bg-red-100'
                      : 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100'
                  } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="flex flex-col items-center justify-center h-full">
                    <span className="text-xs">{day}</span>
                    {!isPast && (
                      <div className="text-xs">
                        {status === 'available' && <CheckCircle size={8} />}
                        {status === 'booked' && <XCircle size={8} />}
                        {status === 'partial' && <Clock size={8} />}
                      </div>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle size={12} className="text-green-600" />
            <span>ว่าง</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle size={12} className="text-red-600" />
            <span>จองแล้ว</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-yellow-600" />
            <span>บางส่วน</span>
          </div>
        </div>
      </div>
    )
  }

  // Calendar Component
  const AvailabilityCalendar = ({ roomAvailability }: { roomAvailability: RoomAvailability | null }) => {
    if (!roomAvailability) return null

    const today = new Date()
    const next30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(today)
      date.setDate(date.getDate() + i)
      return date
    })

    const conflicts = checkBookingConflicts()

    return (
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">ปฏิทินการจอง (30 วันข้างหน้า)</h4>
        
        {/* Selected Date Info */}
        {checkInDate && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              <strong>วันที่เลือก:</strong> เช็คอิน {new Date(checkInDate).toLocaleDateString('th-TH')} - เช็คเอาท์ {new Date(calculateCheckOutDate()).toLocaleDateString('th-TH')} ({nights} คืน)
            </div>
          </div>
        )}

        {/* Conflict Warning */}
        {conflicts.length > 0 && (
          <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs">
            <div className="flex items-center gap-1 text-orange-800 font-medium mb-1">
              <XCircle size={12} />
              มีการจองที่ทับซ้อนกับวันที่ที่เลือก
            </div>
            {conflicts.map((conflict, index) => (
              <div key={index} className="text-orange-700">
                • {new Date(conflict.checkIn).toLocaleDateString('th-TH')} - {new Date(conflict.checkOut).toLocaleDateString('th-TH')} ({conflict.status})
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-7 gap-1 text-xs">
          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
            <div key={day} className="text-center font-semibold text-gray-600 py-1">
              {day}
            </div>
          ))}
          {next30Days.map((date, index) => {
            const dateStr = date.toISOString().split('T')[0]
            const status = getDateStatus(dateStr)
            const isToday = date.toDateString() === today.toDateString()
            const isSelected = isDateInSelectedRange(dateStr)
            
            return (
              <div
                key={dateStr}
                className={`text-center py-1 rounded border ${
                  isToday ? 'ring-2 ring-blue-500' : ''
                } ${isSelected ? 'ring-2 ring-primary-500' : ''} ${getDateColor(status)}`}
              >
                <div className="flex items-center justify-center gap-1">
                  {getDateIcon(status)}
                  <span>{date.getDate()}</span>
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex gap-3 mt-3 text-xs">
          <div className="flex items-center gap-1">
            <CheckCircle size={12} className="text-green-600" />
            <span>ว่าง</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle size={12} className="text-red-600" />
            <span>จองแล้ว</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-yellow-600" />
            <span>บางส่วน</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle size={12} className="text-orange-600" />
            <span>ขัดแย้ง</span>
          </div>
        </div>
      </div>
    )
  }

  // BuildingRoomsView Component
  const BuildingRoomsView = ({ 
    building, 
    rooms, 
    onRoomBook, 
    onClose 
  }: { 
    building: BuildingHotspot
    rooms: Room[]
    onRoomBook: (roomId: string) => void
    onClose: () => void
  }) => {
    const buildingRooms = rooms.filter(room => building.rooms.includes(room.id))
    const buildingTypes = {
      accommodation: '🏠',
      cafe: '☕',
      restaurant: '🍽️',
      facility: '🏢',
      parking: '🚗',
      garden: '🌳'
    }

    console.log('BuildingRoomsView - Building:', building)
    console.log('BuildingRoomsView - All rooms:', rooms)
    console.log('BuildingRoomsView - Building rooms:', buildingRooms)

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between mb-4 lg:mb-6">
          <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
            <div className="w-12 h-12 lg:w-16 lg:h-16 bg-primary-500 rounded-full flex items-center justify-center text-2xl lg:text-3xl flex-shrink-0">
              {buildingTypes[building.buildingType as keyof typeof buildingTypes] || '🏢'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg lg:text-2xl font-bold text-gray-900 truncate">{building.buildingName}</h3>
              <p className="text-sm lg:text-base text-gray-600 line-clamp-2">{building.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0 ml-2"
          >
            <X size={20} className="lg:w-6 lg:h-6" />
          </button>
        </div>

        {/* Rooms List */}
        {buildingRooms.length > 0 ? (
          <div className="flex-1 overflow-y-auto">
            <h4 className="text-base lg:text-lg font-semibold text-gray-900 mb-3 lg:mb-4">ห้องพักในอาคารนี้ ({buildingRooms.length} ห้อง)</h4>
            <div className="space-y-4 lg:space-y-6">
              {buildingRooms.map((room) => (
                <div key={room.id} className={`border rounded-lg p-4 lg:p-6 transition-all ${
                  selectedRoom?.id === room.id 
                    ? 'border-primary-500 shadow-lg bg-primary-50' 
                    : 'border-gray-200 hover:shadow-md'
                }`}>
                  {/* Room Header */}
                  <div className="flex gap-4 mb-4">
                    <div className="w-24 h-20 lg:w-32 lg:h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={room.imageUrl}
                        alt={room.name}
                        width={128}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-gray-900 mb-1 text-base lg:text-lg">{room.name}</h5>
                      <p className="text-sm lg:text-base text-gray-600 mb-3 line-clamp-2">{room.description}</p>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1 text-sm lg:text-base text-gray-600">
                          <Users size={16} className="lg:w-4 lg:h-4" />
                          {room.capacity} คน
                        </div>
                        <span className="font-bold text-primary-600 text-lg lg:text-xl">฿{room.price.toLocaleString()}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRoomSelect(room)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            selectedRoom?.id === room.id
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {selectedRoom?.id === room.id ? 'กำลังดู' : 'ดูรายละเอียด'}
                        </button>
                        <button
                          onClick={() => onRoomBook(room.id)}
                          className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-1"
                        >
                          <Calendar size={14} />
                          จองห้องพัก
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Room Details (when selected) */}
                  {selectedRoom?.id === room.id && (
                    <div className="border-t pt-4">
                      {/* Image Gallery */}
                      <div className="mb-4">
                        <h6 className="text-sm font-semibold text-gray-900 mb-2">รูปภาพห้องพัก</h6>
                        <div className="flex gap-2 overflow-x-auto">
                          {[room.imageUrl, ...(room.imageUrls || [])].slice(0, 5).map((image, index) => (
                            <div
                              key={index}
                              className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => {
                                setCurrentImageIndex(index)
                                setShowImageModal(true)
                              }}
                            >
                              <Image
                                src={image}
                                alt={`${room.name} ${index + 1}`}
                                width={64}
                                height={48}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                          {[room.imageUrl, ...(room.imageUrls || [])].length > 5 && (
                            <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-600 flex-shrink-0">
                              +{([room.imageUrl, ...(room.imageUrls || [])].length - 5)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Amenities */}
                      {room.amenities.length > 0 && (
                        <div className="mb-4">
                          <h6 className="text-sm font-semibold text-gray-900 mb-2">สิ่งอำนวยความสะดวก</h6>
                          <div className="flex flex-wrap gap-2">
                            {room.amenities.map((amenity, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                              >
                                {getAmenityIcon(amenity)}
                                {amenity}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Booking Conflicts Info */}
                      {checkInDate && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h6 className="text-sm font-semibold text-blue-900 mb-2">ข้อมูลการจองที่เลือก</h6>
                          <div className="text-xs text-blue-800">
                            <div>เช็คอิน: {new Date(checkInDate).toLocaleDateString('th-TH')}</div>
                            <div>เช็คเอาท์: {new Date(calculateCheckOutDate()).toLocaleDateString('th-TH')}</div>
                            <div>จำนวนคืน: {nights} คืน</div>
                            <div>ราคารวม: ฿{(room.price * nights).toLocaleString()}</div>
                          </div>
                        </div>
                      )}

                      {/* Interactive Calendar */}
                      <InteractiveCalendar roomAvailability={roomAvailability} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Users className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">ไม่มีห้องพัก</h4>
              <p className="text-gray-600">อาคารนี้ยังไม่มีห้องพักที่เปิดให้บริการ</p>
            </div>
          </div>
        )}

        {/* Facilities */}
        {building.facilities.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-3">สิ่งอำนวยความสะดวก</h4>
            <div className="flex flex-wrap gap-2">
              {building.facilities.map((facility, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {facility}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Image Gallery Modal
  const ImageGalleryModalComponent = () => {
    if (!selectedRoom || !showImageModal) return null

    const images = [selectedRoom.imageUrl, ...(selectedRoom.imageUrls || [])]
    
    return (
      <ImageGalleryModal
        images={images}
        currentIndex={currentImageIndex}
        onClose={() => setShowImageModal(false)}
        onNext={() => setCurrentImageIndex(prev => Math.min(prev + 1, images.length - 1))}
        onPrev={() => setCurrentImageIndex(prev => Math.max(prev - 1, 0))}
      />
    )
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

  // Debug info
  console.log('RoomsPage - SiteMap:', siteMap)
  console.log('RoomsPage - Rooms:', rooms)
  console.log('RoomsPage - Selected Building:', selectedBuilding)
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Bed className="text-primary-600" size={36} />
                ห้องพักของเรา
              </h1>
              <p className="text-gray-700 text-lg font-medium">
                เลือกห้องพักที่เหมาะกับคุณจากแผนผังอาคารของเรา พร้อมสิ่งอำนวยความสะดวกครบครัน
              </p>
            </div>
            
            {/* View Mode Toggle */}
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
        </div>

        {/* Date Selection Form */}
        <div className="mb-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Calendar className="text-primary-600" size={20} />
            เลือกวันที่เช็คอิน
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">วันเช็คอิน</label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">จำนวนคืน</label>
              <select
                value={nights}
                onChange={(e) => setNights(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {[1, 2, 3, 4, 5, 6, 7, 14, 30].map(n => (
                  <option key={n} value={n}>{n} คืน</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">วันเช็คเอาท์</label>
              <div className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-700">
                {checkInDate ? new Date(calculateCheckOutDate()).toLocaleDateString('th-TH') : 'เลือกวันเช็คอินก่อน'}
              </div>
            </div>
          </div>
          {checkInDate && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>ข้อมูลการจอง:</strong> เช็คอิน {new Date(checkInDate).toLocaleDateString('th-TH')} - เช็คเอาท์ {new Date(calculateCheckOutDate()).toLocaleDateString('th-TH')} ({nights} คืน)
              </div>
              <div className="text-xs text-blue-600 mt-1">
                💡 แสดงเฉพาะห้องพักที่ว่างในวันที่เลือก
              </div>
            </div>
          )}
        </div>

        {/* Split Screen Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Side - Site Map */}
          <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">แผนผังอาคาร</h3>
              <p className="text-sm text-gray-600">คลิกที่จุดสีฟ้าบนแผนผังเพื่อดูห้องพักในอาคารนั้น</p>
            </div>
            <SiteMapViewer
              imageUrl={siteMap.imageUrl}
              hotspots={siteMap.hotspots}
              selectedBuilding={selectedBuilding}
              onBuildingSelect={handleBuildingSelect}
            />
          </div>

          {/* Right Side - Room Details */}
          <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
            <div className="mb-4 lg:hidden">
              <h3 className="text-lg font-semibold text-gray-900">รายละเอียดห้องพัก</h3>
            </div>
            {selectedBuilding ? (
              <BuildingRoomsView 
                building={selectedBuilding}
                rooms={rooms.filter(room => room.isActive)}
                onRoomBook={handleRoomBook}
                onClose={() => setSelectedBuilding(null)}
              />
            ) : (
              <div className="flex items-center justify-center h-full min-h-[400px] lg:min-h-[600px]">
                <div className="text-center text-gray-500">
                  <MapPin className="mx-auto h-12 w-12 lg:h-16 lg:w-16 text-gray-400 mb-4" />
                  <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-2">เลือกอาคาร</h3>
                  <p className="text-sm lg:text-base text-gray-600">คลิกที่จุดบนแผนผังเพื่อดูห้องพักในอาคารนั้น</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* List View Toggle */}
        <div className="mt-6 flex justify-center">
          <div className="bg-white rounded-lg p-1 shadow-sm border">
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
                viewMode === 'list' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List size={16} />
              ดูรายการห้องพักทั้งหมด
            </button>
          </div>
        </div>

        {viewMode === 'list' && (
          /* List View */
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Filter size={20} />
                กรองห้องพัก
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">ค้นหา</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">ราคา</label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">ความจุ</label>
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

            {/* Results Summary */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">ผลการค้นหา</h3>
                  <p className="text-gray-600">
                    พบ <span className="font-bold text-primary-600">{filteredRooms.length}</span> ห้องพัก
                    {filteredRooms.length !== rooms.filter(room => room.isActive).length && 
                      ` จาก ${rooms.filter(room => room.isActive).length} ห้องทั้งหมด`
                    }
                  </p>
                </div>
                {filteredRooms.length > 0 && (
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      <span>เฉลี่ย {Math.round(filteredRooms.reduce((sum, room) => sum + room.capacity, 0) / filteredRooms.length)} คน/ห้อง</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>฿</span>
                      <span>เฉลี่ย {Math.round(filteredRooms.reduce((sum, room) => sum + room.price, 0) / filteredRooms.length).toLocaleString()}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Results */}
            <div className="space-y-4">

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
                  
                  {/* Tips */}
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6">
                    <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                      <span>💡</span>
                      เคล็ดลับการใช้งาน
                    </h3>
                    <ul className="list-disc list-inside space-y-2 text-blue-800">
                      <li>ใช้โหมด "แผนผังอาคาร" เพื่อดูตำแหน่งห้องพักและสิ่งอำนวยความสะดวก</li>
                      <li>คลิกที่จุดบนแผนผังเพื่อดูรายละเอียดห้องพักในอาคารนั้น</li>
                      <li>ใช้โหมด "รายการห้องพัก" เพื่อค้นหาและกรองห้องพักตามความต้องการ</li>
                      <li>กรุณาเข้าสู่ระบบก่อนจองห้องพัก</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      
      {/* Image Gallery Modal */}
      <ImageGalleryModalComponent />
    </div>
  )
}
