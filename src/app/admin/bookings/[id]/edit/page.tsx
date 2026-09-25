'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import BookingFormPage, { useIsStaff } from '../../_components/BookingFormPage'
import EditBookingForm from '../../_components/EditBookingForm'
import { useBookingCatalog } from '../../_lib/useBookingCatalog'

export default function EditBooking() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { staff } = useIsStaff()
  const catalog = useBookingCatalog(staff)
  const [booking, setBooking] = useState<any>(null)

  useEffect(() => {
    if (!staff) return
    const controller = new AbortController()
    axios
      .get(`/api/bookings/${id}`, { signal: controller.signal, timeout: 30000 })
      .then((res) => setBooking(res.data))
      .catch((error) => {
        if (error?.code === 'ERR_CANCELED') return
        console.error('Error fetching booking:', error)
        toast.error('ไม่สามารถโหลดข้อมูลการจองได้')
        router.push('/admin/bookings')
      })
    return () => controller.abort()
  }, [staff, id, router])

  return (
    <BookingFormPage
      title="แก้ไขการจอง"
      subtitle={`รหัสการจอง: ${id.slice(0, 8)}`}
      loading={!booking || !catalog}
    >
      {booking && catalog && <EditBookingForm id={id} booking={booking} catalog={catalog} />}
    </BookingFormPage>
  )
}
