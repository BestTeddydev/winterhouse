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
import { getRoomPriceForDate, getDayType, formatPrice, getDayTypeLabel } from '@/lib/pricing'

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
  const [showInfoModal, setShowInfoModal] = useState(false)
  
  // Function to calculate and display price based on selected date
  const getRoomDisplayPrice = (room: Room): { price: number; dayType: string; formattedPrice: string } => {
    if (!checkInDate) {
      // No date selected, show base price
      return {
        price: room.price,
        dayType: 'ราคาพื้นฐาน',
        formattedPrice: formatPrice(room.price)
      }
    }
    
    // Use the room object with pricing
    const roomWithPricing = room as any
    const checkIn = new Date(checkInDate)
    const price = getRoomPriceForDate(roomWithPricing, checkIn)
    const dayType = getDayType(checkIn)
    const dayTypeLabel = getDayTypeLabel(dayType)
    
    return {
      price,
      dayType: dayTypeLabel,
      formattedPrice: formatPrice(price)
    }
  }
  
  // Calculate total price for selected nights
  const calculateTotalPrice = (room: Room): number => {
    if (!checkInDate) return room.price * nights
    
    const roomWithPricing = room as any
    let total = 0
    const checkIn = new Date(checkInDate)
    
    for (let i = 0; i < nights; i++) {
      const currentDate = new Date(checkIn)
      currentDate.setDate(checkIn.getDate() + i)
      total += getRoomPriceForDate(roomWithPricing, currentDate)
    }
    
    return total
  }
  const [loading, setLoading] = useState(true)
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingHotspot | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [priceFilter, setPriceFilter] = useState('all')
  const [capacityFilter, setCapacityFilter] = useState('all')
  const [selectedRooms, setSelectedRooms] = useState<Room[]>([])
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null) // Keep for detail view
  const [roomAvailability, setRoomAvailability] = useState<RoomAvailability | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showImageModal, setShowImageModal] = useState(false)
  const [checkInDate, setCheckInDate] = useState(() => {
    // Set default to today
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  })
  const [nights, setNights] = useState(1)
  const [selectedBookingConflicts, setSelectedBookingConflicts] = useState<any[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDateRange, setSelectedDateRange] = useState<{start: Date | null, end: Date | null}>({start: null, end: null})
  const [hoveredRoom, setHoveredRoom] = useState<Room | null>(null)
  const [allBookings, setAllBookings] = useState<any[]>([])

  useEffect(() => {
    fetchData()
    
    // Initialize selected date range
    const today = new Date()
    setCurrentMonth(today)
    if (checkInDate) {
      const selectedDate = new Date(checkInDate)
      setSelectedDateRange({
        start: selectedDate,
        end: new Date(selectedDate.getTime() + (nights - 1) * 24 * 60 * 60 * 1000)
      })
    }

    // Show info modal on page load
    setShowInfoModal(true)
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
      
      // Try to fetch bookings for availability checking
      let bookingsData: any[] = []
      try {
        const bookingsResponse = await axios.get('/api/bookings/public')
        bookingsData = bookingsResponse.data || []
      } catch (error) {
        console.log('Could not fetch bookings:', error)
      }
      
      console.log('Rooms data:', roomsResponse.data)
      console.log('Site map data:', siteMapResponse.data)
      console.log('Bookings data:', bookingsData)
      
      setRooms(roomsResponse.data)
      setAllBookings(bookingsData)
      
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
    
    // First check local bookings
    const roomBookings = allBookings.filter(booking => {
      const bookingRoomId = booking.roomId?._id?.toString() || booking.roomId?.toString() || booking.roomId
      let isForThisRoom = bookingRoomId === roomId
      
      if (!isForThisRoom && booking.roomIds) {
        isForThisRoom = booking.roomIds.some((rid: any) => {
          const ridStr = rid?._id?.toString() || rid?.toString() || rid
          return ridStr === roomId
        })
      }
      
      return isForThisRoom
    })
    
    const selectedCheckIn = new Date(checkInDate)
    const selectedCheckOut = new Date(checkOutDate)
    
    const localConflicts = roomBookings.filter(booking => {
      // Only check CONFIRMED bookings - PENDING bookings don't block availability until payment is completed
      if (booking.status !== 'CONFIRMED') return false
      
      const bookingCheckIn = new Date(booking.checkIn)
      const bookingCheckOut = new Date(booking.checkOut)
      
      return (
        (selectedCheckIn < bookingCheckOut && selectedCheckOut > bookingCheckIn) ||
        (selectedCheckIn >= bookingCheckIn && selectedCheckOut <= bookingCheckOut) ||
        (selectedCheckIn <= bookingCheckIn && selectedCheckOut >= bookingCheckOut)
      )
    })
    
    if (localConflicts.length > 0) {
      toast.error('ห้องพักไม่ว่างในวันที่เลือก กรุณาเลือกวันที่อื่น')
      return
    }
    
    // Additional real-time availability check
    try {
      const response = await axios.get(`/api/rooms/${roomId}/availability`)
      const availability = response.data
      
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

  // Calculate total price for multiple selected rooms
  const calculateMultipleRoomsTotalPrice = (): number => {
    if (!checkInDate) return 0
    
    return selectedRooms.reduce((total, room) => {
      return total + calculateTotalPrice(room)
    }, 0)
  }

  // Handle booking multiple rooms
  const handleMultipleRoomsBooking = () => {
    if (selectedRooms.length === 0) {
      toast.error('กรุณาเลือกห้องพักก่อน')
      return
    }

    if (!checkInDate) {
      toast.error('กรุณาเลือกวันที่เช็คอิน')
      return
    }

    // Build query params with multiple room IDs
    const roomIds = selectedRooms.map(r => r.id).join(',')
    const checkOutDate = calculateCheckOutDate() // This returns string already
    const params = new URLSearchParams({
      roomIds,
      checkIn: checkInDate,
      checkOut: checkOutDate as string
    })

    router.push(`/bookings/new?${params.toString()}`)
  }

  // Check if a room is selected
  const isRoomSelected = (roomId: string): boolean => {
    return selectedRooms.some(r => r.id === roomId)
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
      setSelectedDateRange({ start: date, end: null })
      // Use local date format to avoid timezone issues
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      setCheckInDate(`${year}-${month}-${day}`)
      setNights(1)
    } else {
      const start = selectedDateRange.start
      const end = date
      if (end < start) {
        setSelectedDateRange({ start: end, end: start })
        // Use local date format to avoid timezone issues
        const year = end.getFullYear()
        const month = String(end.getMonth() + 1).padStart(2, '0')
        const day = String(end.getDate()).padStart(2, '0')
        setCheckInDate(`${year}-${month}-${day}`)
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
    // First check if we have availability data for this specific room
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
    
    // If no room availability data for this specific room, check allBookings
    const conflictingBookings = allBookings.filter(booking => {
      // Check if this booking is for the current room
      // Handle both string and ObjectId comparisons
      const bookingRoomId = booking.roomId?._id?.toString() || booking.roomId?.toString() || booking.roomId
      const roomIdStr = room.id
      
      let isForThisRoom = bookingRoomId === roomIdStr
      
      // Check roomIds array
      if (!isForThisRoom && booking.roomIds) {
        isForThisRoom = booking.roomIds.some((rid: any) => {
          const ridStr = rid?._id?.toString() || rid?.toString() || rid
          return ridStr === roomIdStr
        })
      }
      
      // Check rooms array
      if (!isForThisRoom && booking.rooms) {
        isForThisRoom = booking.rooms.some((r: any) => {
          const rId = r.roomId?._id?.toString() || r.roomId?.toString() || r.roomId
          return rId === roomIdStr
        })
      }
      
      if (!isForThisRoom) return false
      // Only check CONFIRMED bookings for availability
      if (booking.status !== 'CONFIRMED') return false
      
      const bookingCheckIn = new Date(booking.checkIn)
      const bookingCheckOut = new Date(booking.checkOut)
      
      // Check for overlap
      return (
        (selectedCheckIn < bookingCheckOut && selectedCheckOut > bookingCheckIn) ||
        (selectedCheckIn >= bookingCheckIn && selectedCheckOut <= bookingCheckOut) ||
        (selectedCheckIn <= bookingCheckIn && selectedCheckOut >= bookingCheckOut)
      )
    })
    
    // Room is available if there are no conflicting bookings
    return conflictingBookings.length === 0
  }

  // Enhanced availability status check for calendar
  const getCalendarAvailabilityStatus = (date: string, roomId?: string) => {
    const dateObj = new Date(date)
    
    // Check allBookings for this room first (most reliable)
    if (roomId && allBookings.length > 0) {
      const hasBooking = allBookings.some(booking => {
        const bookingRoomId = booking.roomId?._id?.toString() || booking.roomId?.toString() || booking.roomId
        let isForThisRoom = bookingRoomId === roomId
        
        if (!isForThisRoom && booking.roomIds) {
          isForThisRoom = booking.roomIds.some((rid: any) => {
            const ridStr = rid?._id?.toString() || rid?.toString() || rid
            return ridStr === roomId
          })
        }
        
        if (!isForThisRoom) return false
        if (!['PENDING', 'CONFIRMED'].includes(booking.status)) return false
        
        const bookingCheckIn = new Date(booking.checkIn)
        const bookingCheckOut = new Date(booking.checkOut)
        
        // Check if date falls within booking period
        return dateObj >= bookingCheckIn && dateObj < bookingCheckOut
      })
      
      if (hasBooking) return 'booked'
    }
    
    // Use roomAvailability if we have it for this specific room
    if (roomAvailability && (!roomId || roomAvailability.roomId === roomId)) {
    // Check if date is in the availability data
    const status = roomAvailability.availability[date]    
    if (status) {
      return status
    }
    
      // If not in availability map, check bookings from roomAvailability
    const hasBooking = roomAvailability.bookings.some(booking => {
      const bookingCheckIn = new Date(booking.checkIn)
      const bookingCheckOut = new Date(booking.checkOut)
        
        return dateObj >= bookingCheckIn && dateObj < bookingCheckOut
      })
      
      return hasBooking ? 'booked' : 'available'
    }
    
    return 'available'
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

  // Group rooms by building
  const groupRoomsByBuilding = (rooms: Room[]) => {
    const grouped: { [key: string]: { buildingName: string; buildingType?: string; rooms: Room[] } } = {}
    const ungrouped: Room[] = []
    
    rooms.forEach(room => {
      if (room.buildingName) {
        const key = room.buildingName
        if (!grouped[key]) {
          grouped[key] = {
            buildingName: room.buildingName,
            buildingType: room.buildingType,
            rooms: []
          }
        }
        grouped[key].rooms.push(room)
      } else {
        ungrouped.push(room)
      }
    })
    
    return { grouped, ungrouped }
  }

  const { grouped: groupedRooms, ungrouped: ungroupedRooms } = groupRoomsByBuilding(filteredRooms)

  // Toggle room selection (add/remove from selected rooms)
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
  const InteractiveCalendar = ({ roomAvailability, roomId }: { roomAvailability: RoomAvailability | null, roomId?: string }) => {

    const today = new Date()
    const daysInMonth = getDaysInMonth(currentMonth)
    const firstDay = getFirstDayOfMonth(currentMonth)
    const monthNames = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ]
    const dayNames = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส']

    const conflicts = checkBookingConflicts()

    // Debug: Log room availability info
    console.log('InteractiveCalendar - roomAvailability:', roomAvailability)
    console.log('InteractiveCalendar - roomId:', roomId)
    console.log('InteractiveCalendar - allBookings:', allBookings)

    return (
      <div className="mt-4">
        <h4 className="text-sm font-semibold text-gray-900 mb-3">ปฏิทินการจองล่วงหน้า</h4>
        <p className="text-xs text-gray-600 mb-3">
          <span className="inline-flex items-center gap-1"><CheckCircle size={12} className="text-green-600" /> เขียว = ว่าง</span>{' '}
          <span className="inline-flex items-center gap-1 ml-2"><XCircle size={12} className="text-red-600" /> แดง = จองแล้ว</span>
        </p>
        
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
              const year = currentMonth.getFullYear()
              const month = currentMonth.getMonth() + 1 // getMonth() returns 0-11, we need 1-12
              const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
              const date = new Date(year, currentMonth.getMonth(), day)
              const status = getCalendarAvailabilityStatus(dateStr, roomId)              
    
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
                    <span className={`text-xs font-medium ${status === 'booked' ? 'text-red-900' : ''}`}>{day}</span>
                    {!isPast && (
                      <div className="text-xs">
                        {status === 'available' && <CheckCircle size={8} />}
                        {status === 'booked' && <XCircle size={8} />}
                        {status === 'partial' && <Clock size={8} />}
                      </div>
                    )}
                    {status === 'booked' && !isPast && (
                      <span className="text-[8px] text-red-700 font-bold mt-0.5">X</span>
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
            <span className='text-green-600'>ว่าง</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle size={12} className="text-red-600" />
            <span className='text-red-600'>จองแล้ว</span>
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
    onClose,
    onRoomToggle,
    isRoomSelected
  }: { 
    building: BuildingHotspot
    rooms: Room[]
    onRoomBook: (roomId: string) => void
    onClose: () => void
    onRoomToggle: (room: Room) => void
    isRoomSelected: (roomId: string) => boolean
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
                <div key={room.id} className={`border rounded-lg p-4 lg:p-6 transition-all relative ${
                  selectedRoom?.id === room.id 
                    ? 'border-primary-500 shadow-lg bg-primary-50' 
                    : isRoomSelected(room.id)
                    ? 'border-green-500 shadow-lg bg-green-50'
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
                        <div className="text-right">
                          <div className="font-bold text-primary-600 text-lg lg:text-xl">
                            {getRoomDisplayPrice(room).formattedPrice}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getRoomDisplayPrice(room).dayType}
                          </div>
                        </div>
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
                          onClick={() => onRoomToggle(room)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 transition-colors ${
                            isRoomSelected(room.id)
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-primary-600 text-white hover:bg-primary-700'
                          }`}
                        >
                          <Calendar size={14} />
                          {isRoomSelected(room.id) ? 'ยกเลิก' : 'จอง'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Room Details (when selected) - Show as expanded card content */}
                  {selectedRoom?.id === room.id && (
                    <div className="border-t pt-4 mt-4">
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

                      {/* Current Bookings Info */}
                      {(() => {
                        const roomBookings = allBookings.filter(booking => {
                          const bookingRoomId = booking.roomId?._id?.toString() || booking.roomId?.toString() || booking.roomId
                          let isForThisRoom = bookingRoomId === room.id
                          
                          if (!isForThisRoom && booking.roomIds) {
                            isForThisRoom = booking.roomIds.some((rid: any) => {
                              const ridStr = rid?._id?.toString() || rid?.toString() || rid
                              return ridStr === room.id
                            })
                          }
                          
                          // Show only CONFIRMED bookings in the UI
                          return isForThisRoom && booking.status === 'CONFIRMED'
                        })
                        
                        return roomBookings.length > 0 ? (
                          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <h6 className="text-sm font-semibold text-red-900 mb-2">การจองที่มีอยู่</h6>
                            <div className="text-xs text-red-800 space-y-1 max-h-32 overflow-y-auto">
                              {roomBookings.map((booking: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center">
                                  <span>
                                    {new Date(booking.checkIn).toLocaleDateString('th-TH')} - {new Date(booking.checkOut).toLocaleDateString('th-TH')}
                                  </span>
                                  <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">
                                    {booking.status}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : null
                      })()}

                      {/* Booking Conflicts Info */}
                      {checkInDate && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h6 className="text-sm font-semibold text-blue-900 mb-2">ข้อมูลการจองที่เลือก</h6>
                          <div className="text-xs text-blue-800">
                            <div>เช็คอิน: {new Date(checkInDate).toLocaleDateString('th-TH')}</div>
                            <div>เช็คเอาท์: {new Date(calculateCheckOutDate()).toLocaleDateString('th-TH')}</div>
                            <div>จำนวนคืน: {nights} คืน</div>
                            <div>ราคารวม: {formatPrice(calculateTotalPrice(room))}</div>
                          </div>
                        </div>
                      )}

                      {/* Interactive Calendar */}
                      <InteractiveCalendar roomAvailability={roomAvailability} roomId={room.id} />
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
      
      {/* Information Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">ข้อมูลสำคัญสำหรับการจอง</h2>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-2"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Mobile Browser Instructions */}
              <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  สำหรับการจองผ่านมือถือ
                </h3>
                <div className="space-y-2 text-blue-800">
                  <p><strong>iOS:</strong> เลือกเปิดลิงก์จองใน Safari</p>
                  <p><strong>Android:</strong> เลือกเปิดลิงก์จองใน Chrome(ตั้งค่าChrome เป็นบราวเซอร์เริ่มต้น)</p>
                </div>
              </div>

              {/* Booking Process */}
              <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center gap-2">
                  💳 ขั้นตอนการจอง
                </h3>
                <div className="space-y-4 text-yellow-800">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                      <div>
                        <p className="font-medium">เลือกห้องพักและวันที่</p>
                        <p className="text-sm">เลือกห้องพักที่ต้องการและระบุวันเช็คอิน-และเลือกคืนที่ต้องการพัก</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                      <div>
                        <p className="font-medium">กรอกข้อมูลการจอง</p>
                        <p className="text-sm">กรอกชื่อ อีเมล เบอร์โทรศัพท์ และความต้องการพิเศษ (ถ้ามี)</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                      <div>
                        <p className="font-medium">เลือกประเภทการชำระเงิน</p>
                        <p className="text-sm">เลือกชำระเต็มจำนวน หรือ ชำระมัดจำ 50% (ส่วนที่เหลือชำระเมื่อเช็คอิน)</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</div>
                      <div>
                        <p className="font-medium">ชำระเงิน</p>
                        <p className="text-sm">เลือกวิธีชำระเงิน: บัตรเครดิต/เดบิต, PromptPay, หรือ QR Code ผ่าน Stripe</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">5</div>
                      <div>
                        <p className="font-medium">รับการยืนยัน</p>
                        <p className="text-sm">ระบบจะส่งอีเมลยืนยันการจองและ LINE notification (ถ้ามี)</p>
                      </div>
                    </div>
                  </div>

                  <div className="pl-4 border-l-4 border-red-300 mt-4">
                    <p className="font-medium text-red-700">⚠️ สำคัญ:</p>
                    <p className="text-red-700 text-sm">การจองจะสมบูรณ์เมื่อชำระเงินสำเร็จเท่านั้น</p>
                    <p className="text-red-700 text-sm">หากชำระมัดจำ จะต้องชำระส่วนที่เหลือเมื่อเช็คอิน</p>
                  </div>

                  <div className="pl-4 border-l-4 border-blue-300">
                    <p className="font-medium">การติดตามสถานะการจอง:</p>
                    <p className="text-sm">สามารถดูสถานะการจองได้ที่เมนู "การจองของฉัน"</p>
                   
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  📋 เงื่อนไขต่างๆ และนโยบายการเข้าพัก
                </h3>
                <div className="space-y-3 text-gray-700">
                  <div>
                    <p><strong>เวลาเช็คอิน:</strong> 14:00 น.</p>
                    <p><strong>เวลาเช็คเอาท์:</strong> 12:00 น.</p>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="text-blue-600 mt-1 flex-shrink-0" size={16} />
                    <div>
                      <p><strong>พิกัด:</strong> บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง</p>
                      <a 
                        href="https://maps.app.goo.gl/kTWYLrEuYiy9oecj6" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        https://maps.app.goo.gl/kTWYLrEuYiy9oecj6
                      </a>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium">กฎระเบียบและข้อปฏิบัติของที่พัก:</h4>
                    
                    {/* Basic Rules */}
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-800">📋 กฎพื้นฐาน:</h5>
                      <ul className="list-disc list-inside space-y-1 pl-4 text-sm">
                        <li>จองห้องพักโดยชำระค่าห้องพักขั้นต่ำ 50%</li>
                        <li>ทางที่พักจะดำเนินการจองห้องพักให้เมื่อได้หลักฐานการโอนตามขั้นตอนที่ถูกต้อง</li>
                        <li>เช็คอิน: 14.00 น.- 20.00 น. (ต้องรบกวนเช็คอินตามเวลาที่กำหนด หากเกินกว่าเวลาที่กำหนดกรุณาแจ้งล่วงหน้า)</li>
                        <li>เช็คเอาท์: 12.00 น.</li>
                      </ul>
                    </div>

                    {/* Child Policies */}
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-800">👶 นโยบายเด็ก:</h5>
                      <ul className="list-disc list-inside space-y-1 pl-4 text-sm">
                        <li><strong>เด็ก 0-7 ขวบ:</strong> พักรวมกับผู้ปกครองฟรี ไม่มีอุปกรณ์เสริมใดๆ ให้</li>
                        <li><strong>กรณีขอเตียงเสริม:</strong> คิดค่าบริการ 500 บาท/คืน รวมอาหารเช้าพร้อมหมอน+ผ้าห่ม+ผ้าเช็ดตัว เสริมได้สูงสุด 1 ท่าน/หลัง</li>
                      </ul>
                    </div>

                    {/* Accommodation Rules */}
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-800">🏠 กฎการเข้าพัก:</h5>
                      <ul className="list-disc list-inside space-y-1 pl-4 text-sm">
                        <li>อนุญาตให้เข้าพักตามจำนวนที่แจ้งในรายการจองมาเท่านั้น หากเข้าพักเกินจํานวนที่แจ้งหรือนําบุคคลภายนอกเข้ามาพักโดยมิแจ้งให้ทราบ ทางที่พักคิดค่าปรับท่านละ 1,000 บาท</li>
                      </ul>
                    </div>

                    {/* Prohibited Activities */}
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-800">🚫 สิ่งต้องห้าม:</h5>
                      <ul className="list-disc list-inside space-y-1 pl-4 text-sm">
                        <li>ไม่อนุญาตให้เล่นการพนันหรือนำสิ่งผิดกฎหมายทุกชนิดเข้ามาในบริเวณที่พักเด็ดขาด</li>
                      </ul>
                    </div>

                    {/* Cancellation Policy */}
                    <div className="space-y-2">
                      <h5 className="font-medium text-gray-800">📅 นโยบายการยกเลิก / เปลี่ยนแปลง:</h5>
                      <div className="pl-4 space-y-2 text-sm">
                        <p><strong>การเปลี่ยนวันเข้าพัก:</strong></p>
                        <p className="pl-4">• ต้องแจ้งล่วงหน้าก่อนอย่างน้อย 15 วัน เพื่อขอเปลี่ยนวันเข้าพัก (สามารถเปลี่ยนได้เพียง 1 ครั้ง)</p>
                        
                        <p><strong>การยกเลิกห้องพัก:</strong></p>
                        <ul className="list-disc list-inside pl-4 space-y-1">
                          <li>หัก 15% เมื่อแจ้งก่อน 1 เดือนก่อนถึงวันเข้าพัก</li>
                          <li>หัก 30% เมื่อแจ้งหลัง 1 เดือน แต่ไม่เกิน 15 วัน ก่อนถึงวันเข้าพัก</li>
                          <li>หัก 50% เมื่อแจ้งหลัง 7 วัน หรือ 1 อาทิตย์ ก่อนถึงวันเข้าพัก</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
                >
                  ตรวจสอบห้องว่าง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating Action Button for Multi-Room Booking */}
      {selectedRooms.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 border-2 border-green-500 min-w-[300px]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">ห้องที่เลือกแล้ว</h3>
              <button
                onClick={() => setSelectedRooms([])}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
              {selectedRooms.map(room => (
                <div key={room.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                  <span className="text-sm font-medium text-gray-900">{room.name}</span>
                  <button
                    onClick={() => handleRoomToggle(room)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>

            {checkInDate && (
              <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">ราคารวม:</span>
                  <span className="text-lg font-bold text-green-700">
                    {formatPrice(calculateMultipleRoomsTotalPrice())}
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {selectedRooms.length} ห้อง × {nights} คืน
                </div>
              </div>
            )}
            
            <button
              onClick={handleMultipleRoomsBooking}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
            >
              <Calendar size={20} />
              จอง {selectedRooms.length} ห้อง
            </button>
          </div>
        </div>
      )}

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
              <div className="w-full px-3 py-2 bg-gray-700 border border-gray-300 rounded-lg text-white">
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
              <p className="text-sm text-gray-600">คลิกที่จุดบนแผนผังเพื่อดูห้องพักในอาคารนั้น</p>
            </div>
            <SiteMapViewer
              imageUrl={siteMap.imageUrl}
              hotspots={siteMap.hotspots}
              selectedBuilding={selectedBuilding}
              onBuildingSelect={handleBuildingSelect}
              hoveredRoom={hoveredRoom}
              rooms={rooms}
              roomBookings={allBookings}
              checkInDate={checkInDate}
              checkOutDate={calculateCheckOutDate()}
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
                onRoomToggle={handleRoomToggle}
                isRoomSelected={isRoomSelected}
              />
            ) : (
              <div className="h-full">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">รายการห้องพักทั้งหมด</h3>
                  <p className="text-sm text-gray-600 mb-2">คลิกที่จุดบนแผนผังเพื่อดูห้องพักในอาคารนั้น หรือเลือกห้องพักจากรายการด้านล่าง</p>
                  <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                    <Calendar size={14} />
                    <span>💡 สามารถเลือกจองหลายห้องพร้อมกันโดยคลิกปุ่ม "จอง" ของแต่ละห้อง</span>
                  </div>
                </div>
                
                <div className="space-y-6 max-h-[500px] overflow-y-auto">
                  {filteredRooms.length === 0 ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center text-gray-500">
                        <Calendar className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm">ไม่พบห้องพักที่ตรงกับเงื่อนไข</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Rooms grouped by building */}
                      {Object.entries(groupedRooms).map(([buildingKey, building]) => (
                        <div key={buildingKey} className="mb-6">
                          {/* Building Header */}
                          <div className="mb-4 p-3 bg-gradient-to-r from-primary-50 to-blue-50 border border-primary-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <MapPin size={18} className="text-primary-600" />
                              <h4 className="text-lg font-bold text-primary-800">{building.buildingName}</h4>
                              {building.buildingType && (
                                <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                                  {building.buildingType === 'accommodation' ? 'ที่พัก' : 
                                   building.buildingType === 'cafe' ? 'คาเฟ่' :
                                   building.buildingType === 'restaurant' ? 'ร้านอาหาร' :
                                   building.buildingType}
                                </span>
                              )}
                              <span className="text-sm text-primary-600 ml-auto">
                                {building.rooms.length} ห้อง
                              </span>
                            </div>
                          </div>

                          {/* Rooms in this building */}
                          <div className="space-y-3">
                            {building.rooms.map((room) => (
                      <div 
                        key={room.id} 
                        className={`border rounded-lg p-4 transition-all cursor-pointer relative overflow-hidden ${
                          hoveredRoom?.id === room.id 
                            ? 'border-primary-500 shadow-lg bg-primary-50' 
                            : isRoomSelected(room.id)
                            ? 'border-green-500 shadow-lg bg-green-50'
                            : 'border-gray-200 hover:shadow-md'
                        }`}
                        onMouseEnter={() => setHoveredRoom(room)}
                        onMouseLeave={() => setHoveredRoom(null)}
                      >
                        <div className="flex gap-4">
                          <div className="w-20 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                              src={room.imageUrl}
                              alt={room.name}
                              width={80}
                              height={64}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-bold text-gray-900 text-sm">{room.name}</h5>
                              <div className="text-right">
                                <div className="font-bold text-primary-600 text-sm">
                                  {getRoomDisplayPrice(room).formattedPrice}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {getRoomDisplayPrice(room).dayType}
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{room.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-xs text-gray-600">
                                <Users size={12} />
                                {room.capacity} คน
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRoomSelect(room)
                                  }}
                                  className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                    selectedRoom?.id === room.id
                                      ? 'bg-primary-600 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {selectedRoom?.id === room.id ? 'กำลังดู' : 'ดูรายละเอียด'}
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRoomToggle(room)
                                  }}
                                  className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                                    isRoomSelected(room.id)
                                      ? 'bg-green-600 text-white hover:bg-green-700'
                                      : 'bg-primary-600 text-white hover:bg-primary-700'
                                  }`}
                                >
                                  <Calendar size={10} />
                                  {isRoomSelected(room.id) ? 'ยกเลิก' : 'จอง'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Room Details - Show inside the same card when selected */}
                        {selectedRoom?.id === room.id && (
                          <div className="mt-4 pt-4 border-t border-gray-200 animate-fade-in">
                            <div className="flex items-center justify-between mb-3">
                              <h6 className="text-sm font-semibold text-gray-900">รายละเอียดเพิ่มเติม</h6>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedRoom(null)
                                }}
                                className="text-gray-500 hover:text-gray-700 text-xs"
                              >
                                <X size={16} />
                              </button>
                            </div>
                            
                            {/* Image Gallery */}
                            <div className="mb-4">
                              <div className="flex gap-2 overflow-x-auto">
                                {[ ...(room.imageUrls || [])].slice(0, 5).map((image, index) => (
                                  <div
                                    key={index}
                                    className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation()
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
                              </div>
                            </div>

                            {/* Amenities */}
                            {room.amenities.length > 0 && (
                              <div className="mb-4">
                                <h6 className="text-xs font-semibold text-gray-900 mb-2">สิ่งอำนวยความสะดวก</h6>
                                <div className="flex flex-wrap gap-1">
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

                            {/* Current Bookings Info */}
                            {(() => {
                              const roomBookings = allBookings.filter(booking => {
                                const bookingRoomId = booking.roomId?._id?.toString() || booking.roomId?.toString() || booking.roomId
                                let isForThisRoom = bookingRoomId === room.id
                                
                                if (!isForThisRoom && booking.roomIds) {
                                  isForThisRoom = booking.roomIds.some((rid: any) => {
                                    const ridStr = rid?._id?.toString() || rid?.toString() || rid
                                    return ridStr === room.id
                                  })
                                }
                                
                                // Show only CONFIRMED bookings in the UI
                          return isForThisRoom && booking.status === 'CONFIRMED'
                              })
                              
                              return roomBookings.length > 0 ? (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                  <h6 className="text-xs font-semibold text-red-900 mb-2">การจองที่มีอยู่</h6>
                                  <div className="text-xs text-red-800 space-y-1 max-h-32 overflow-y-auto">
                                    {roomBookings.map((booking: any, idx: number) => (
                                      <div key={idx} className="flex justify-between items-center">
                                        <span>
                                          {new Date(booking.checkIn).toLocaleDateString('th-TH')} - {new Date(booking.checkOut).toLocaleDateString('th-TH')}
                                        </span>
                                      
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ) : null
                            })()}

                            {/* Booking Calendar Info */}
                            {checkInDate && (
                              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <h6 className="text-xs font-semibold text-blue-900 mb-2">ข้อมูลการจองที่เลือก</h6>
                                <div className="text-xs text-blue-800">
                                  <div>เช็คอิน: {new Date(checkInDate).toLocaleDateString('th-TH')}</div>
                                  <div>เช็คเอาท์: {new Date(calculateCheckOutDate()).toLocaleDateString('th-TH')}</div>
                                  <div>จำนวนคืน: {nights} คืน</div>
                                  <div>ราคารวม: {formatPrice(calculateTotalPrice(room))}</div>
                                </div>
                              </div>
                            )}

                            {/* Interactive Calendar */}
                            <div className="mb-4">
                              <h6 className="text-xs font-semibold text-gray-900 mb-2">ความพร้อมของห้อง</h6>
                              <InteractiveCalendar roomAvailability={roomAvailability} roomId={room.id} />
                            </div>
                          </div>
                        )}
                      </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      {/* Ungrouped rooms (without building assignment) */}
                      {ungroupedRooms.length > 0 && (
                        <div className="mb-6">
                          <div className="mb-4 p-3 bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Bed size={18} className="text-gray-600" />
                              <h4 className="text-lg font-bold text-gray-800">ห้องพักอื่นๆ</h4>
                              <span className="text-sm text-gray-600 ml-auto">
                                {ungroupedRooms.length} ห้อง
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            {ungroupedRooms.map((room) => (
                              <div 
                                key={room.id} 
                                className={`border rounded-lg p-4 transition-all cursor-pointer relative overflow-hidden ${
                                  hoveredRoom?.id === room.id 
                                    ? 'border-primary-500 shadow-lg bg-primary-50' 
                                    : isRoomSelected(room.id)
                                    ? 'border-green-500 shadow-lg bg-green-50'
                                    : 'border-gray-200 hover:shadow-md'
                                }`}
                                onMouseEnter={() => setHoveredRoom(room)}
                                onMouseLeave={() => setHoveredRoom(null)}
                              >
                                <div className="flex gap-4">
                                  <div className="w-20 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                    <Image
                                      src={room.imageUrl}
                                      alt={room.name}
                                      width={80}
                                      height={64}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-2">
                                      <h5 className="font-bold text-gray-900 text-sm">{room.name}</h5>
                                      <div className="text-right">
                                        <div className="font-bold text-primary-600 text-sm">
                                          {getRoomDisplayPrice(room).formattedPrice}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          {getRoomDisplayPrice(room).dayType}
                                        </div>
                                      </div>
                                    </div>
                                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{room.description}</p>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-1 text-xs text-gray-600">
                                        <Users size={12} />
                                        {room.capacity} คน
                                      </div>
                                      <div className="flex gap-2">
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleRoomSelect(room)
                                          }}
                                          className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                                            selectedRoom?.id === room.id
                                              ? 'bg-primary-600 text-white'
                                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                          }`}
                                        >
                                          {selectedRoom?.id === room.id ? 'กำลังดู' : 'ดูรายละเอียด'}
                                        </button>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            handleRoomToggle(room)
                                          }}
                                          className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 transition-colors ${
                                            isRoomSelected(room.id)
                                              ? 'bg-green-600 text-white hover:bg-green-700'
                                              : 'bg-primary-600 text-white hover:bg-primary-700'
                                          }`}
                                        >
                                          <Calendar size={10} />
                                          {isRoomSelected(room.id) ? 'ยกเลิก' : 'จอง'}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {/* Room Details - Show inside the same card when selected */}
                                {selectedRoom?.id === room.id && (
                                  <div className="mt-4 pt-4 border-t border-gray-200 animate-fade-in">
                                    <div className="flex items-center justify-between mb-3">
                                      <h6 className="text-sm font-semibold text-gray-900">รายละเอียดเพิ่มเติม</h6>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setSelectedRoom(null)
                                        }}
                                        className="text-gray-500 hover:text-gray-700 text-xs"
                                      >
                                        <X size={16} />
                                      </button>
                                    </div>
                                    
                                    {/* Current Bookings Info */}
                                    {allBookings.length > 0 && (
                                      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <h6 className="text-sm font-semibold text-blue-900 mb-2">ข้อมูลการจองปัจจุบัน</h6>
                                        {(() => {
                                          const roomBookings = allBookings.filter(booking => {
                                            const bookingRoomId = booking.roomId?._id?.toString() || booking.roomId?.toString() || booking.roomId
                                            let isForThisRoom = bookingRoomId === room.id
                                            
                                            if (!isForThisRoom && booking.roomIds) {
                                              isForThisRoom = booking.roomIds.some((rid: any) => {
                                                const ridStr = rid?._id?.toString() || rid?.toString() || rid
                                                return ridStr === room.id
                                              })
                                            }
                                            
                                            // Show only CONFIRMED bookings in the UI
                          return isForThisRoom && booking.status === 'CONFIRMED'
                                          })
                                          
                                          if (roomBookings.length === 0) {
                                            return (
                                              <p className="text-xs text-green-700">
                                                ✅ ยังไม่มีการจอง
                                              </p>
                                            )
                                          }
                                          
                                          return (
                                            <div className="space-y-2">
                                              {roomBookings.map((booking, index) => (
                                                <div key={index} className="text-xs bg-white border border-blue-200 rounded p-2">
                                                  <div className="flex justify-between items-center">
                                                    <span className="font-medium">
                                                      {new Date(booking.checkIn).toLocaleDateString('th-TH')} - {new Date(booking.checkOut).toLocaleDateString('th-TH')}
                                                    </span>
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                      booking.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                                                      booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                      'bg-gray-100 text-gray-800'
                                                    }`}>
                                                      {booking.status === 'CONFIRMED' ? 'ยืนยันแล้ว' :
                                                       booking.status === 'PENDING' ? 'รอยืนยัน' :
                                                       booking.status}
                                                    </span>
                                                  </div>
                                                  {booking.guestName && (
                                                    <div className="text-gray-600 mt-1">
                                                      ผู้จอง: {booking.guestName}
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )
                                        })()}
                                      </div>
                                    )}

                                    {/* Interactive Calendar */}
                                    <div className="mb-4">
                                      <h6 className="text-sm font-semibold text-gray-900 mb-2">ปฏิทินการจอง</h6>
                                      <InteractiveCalendar roomAvailability={roomAvailability} roomId={room.id} />
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Image Gallery Modal */}
      <ImageGalleryModalComponent />
    </div>
  )
}
