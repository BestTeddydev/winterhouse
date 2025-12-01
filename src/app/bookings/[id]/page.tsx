'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  CreditCard,
  Mail,
  Phone,
  Receipt,
  ExternalLink
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export default function BookingDetail() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Wait for session to load
    if (sessionStatus === 'loading') {
      return
    }

    // Only redirect if session is unauthenticated after loading
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin')
      return
    }

    // If we have a session, fetch booking
    if (sessionStatus === 'authenticated' && session) {
      fetchBooking()
    }
  }, [session, sessionStatus, bookingId, router])

  const fetchBooking = async () => {
    try {
      const response = await axios.get(`/api/bookings/${bookingId}`)
      setBooking(response.data)
    } catch (error) {
      console.error('Error fetching booking:', error)
      toast.error('ไม่สามารถโหลดข้อมูลการจองได้')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800 border-green-300'
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'COMPLETED':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return <CheckCircle className="text-green-600" />
      case 'PENDING':
        return <Clock className="text-yellow-600" />
      case 'CANCELLED':
        return <XCircle className="text-red-600" />
      default:
        return <AlertCircle className="text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'ยืนยันแล้ว'
      case 'PENDING':
        return 'รอการยืนยัน'
      case 'CANCELLED':
        return 'ยกเลิกแล้ว'
      case 'COMPLETED':
        return 'เสร็จสิ้น'
      default:
        return status
    }
  }

  if (loading) {
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

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">ไม่พบการจอง</h2>
              <p className="text-gray-700 mb-6">ไม่สามารถโหลดข้อมูลการจองได้</p>
              <button
                onClick={() => router.push('/bookings')}
                className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                กลับไปที่การจองของฉัน
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const isMultipleRooms = booking.roomIds && booking.roomIds.length > 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/bookings"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">รายละเอียดการจอง</h1>
            <p className="text-gray-600">เลขที่การจอง: #{booking._id?.slice(-8) || booking.id?.slice(-8)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(booking.status)}
                  <div>
                    <h3 className="font-semibold text-gray-900">สถานะการจอง</h3>
                    <p className="text-sm text-gray-600">อัปเดตล่าสุด</p>
                  </div>
                </div>
                <span className={`px-4 py-2 rounded-full border-2 font-semibold ${getStatusColor(booking.status)}`}>
                  {getStatusText(booking.status)}
                </span>
              </div>
            </div>

            {/* Booking Dates */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="text-primary-600" />
                วันที่เข้าพัก
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border-l-4 border-primary-500 pl-4">
                  <p className="text-sm text-gray-600">วันเช็คอิน</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(booking.checkIn).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </p>
                </div>
                <div className="border-l-4 border-primary-500 pl-4">
                  <p className="text-sm text-gray-600">วันเช็คเอาท์</p>
                  <p className="text-lg font-bold text-gray-900">
                    {new Date(booking.checkOut).toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Room Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="text-primary-600" />
                {isMultipleRooms ? 'ห้องพักที่จอง' : 'ห้องพัก'}
              </h3>
              {isMultipleRooms ? (
                <div className="space-y-4">
                  {booking.rooms?.map((room: any, idx: number) => (
                    <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                        {room.roomId.imageUrls.length > 0 && (
                          <Image
                            src={room.roomId.imageUrls[0]}
                            alt={room.name}
                            width={96}
                            height={96}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{room?.roomId.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">{room.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-1 text-gray-600">
                            <Users size={16} />
                            {room?.roomId.capacity} คน
                          </div>
                          <div className="font-bold text-primary-600">
                            {formatCurrency(room.price)}/คืน
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                booking.roomId && (
                  <div className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-24 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {booking.roomId.imageUrl && (
                        <Image
                          src={booking.roomId.imageUrl}
                          alt={booking.roomId.name}
                          width={96}
                          height={96}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{booking.roomId.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{booking.roomId.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Users size={16} />
                          {booking.roomId.capacity} คน
                        </div>
                        <div className="font-bold text-primary-600">
                          {formatCurrency(booking.roomId.price)}/คืน
                        </div>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Guest Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="text-primary-600" />
                ข้อมูลผู้เข้าพัก
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">อีเมล</p>
                    <p className="font-medium text-gray-900">{booking.guestEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={20} className="text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">เบอร์โทรศัพท์</p>
                    <p className="font-medium text-gray-900">{booking.guestPhone}</p>
                  </div>
                </div>
                {booking.specialRequests && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-gray-600 mb-1">ความต้องการพิเศษ</p>
                    <p className="text-gray-900">{booking.specialRequests}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Payment Summary */}
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign className="text-primary-600" />
                สรุปการชำระเงิน
              </h3>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">ราคารวม</span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(booking.totalPrice)}
                  </span>
                </div>
                {booking.paymentId && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">สถานะการชำระ</span>
                      <span className={`font-medium ${
                        booking.paymentId.status === 'COMPLETED' 
                          ? 'text-green-600' 
                          : booking.paymentId.status === 'PENDING'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}>
                        {booking.paymentId.status === 'COMPLETED' ? 'ชำระแล้ว' : 
                         booking.paymentId.status === 'PENDING' ? 'รอชำระ' : 
                         'ยังไม่ชำระ'}
                      </span>
                    </div>
                    {booking.paymentId.paidAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">ชำระไปแล้ว</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(booking.paymentId.paidAmount)}
                        </span>
                      </div>
                    )}
                    {booking.paymentId.paymentSlipUrl && (
                      <div className="pt-3 border-t">
                        <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                          <Receipt size={16} />
                          สลิปโอนเงิน
                        </p>
                        <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
                          <Image
                            src={booking.paymentId.paymentSlipUrl}
                            alt="สลิปโอนเงิน"
                            fill
                            className="object-contain p-2"
                          />
                          <a
                            href={booking.paymentId.paymentSlipUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          >
                            <div className="flex items-center gap-2 text-white bg-primary-600 px-4 py-2 rounded-lg">
                              <ExternalLink size={18} />
                              <span className="font-medium">เปิดดูขนาดเต็ม</span>
                            </div>
                          </a>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-lg font-bold mb-4">
                  <span className="text-gray-900">ยอดที่ต้องชำระ</span>
                  <span className="text-primary-600">
                    {booking.paymentId?.remainingAmount 
                      ? formatCurrency(booking.paymentId.remainingAmount)
                      : formatCurrency(booking.totalPrice)
                    }
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  {booking.paymentId && booking.paymentId.status !== 'COMPLETED' && (
                    <Link
                      href={`/bookings/${bookingId}/payment`}
                      className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CreditCard size={20} />
                      ชำระเงิน
                    </Link>
                  )}
                  <Link
                    href="/bookings"
                    className="w-full bg-gray-200 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                  >
                    <ArrowLeft size={20} />
                    กลับไปที่การจอง
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

