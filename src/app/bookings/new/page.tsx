'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import AddOnOptions from '@/components/booking/AddOnOptions'
import type { PaymentType } from '@/lib/bookingPrice'
import {
  priceBreakdown,
  selectionPayload,
  setAddOnQuantity,
  toggleAddOn,
  type AddOnOption,
  type SelectedAddOn,
} from '@/lib/bookingForm'
import BookingNotFound from './_components/BookingNotFound'
import BookingSummary from './_components/BookingSummary'
import GuestFields, { type GuestDetails } from './_components/GuestFields'
import PaymentTypeOptions from './_components/PaymentTypeOptions'
import { parseBookingRequest } from './_lib/bookingRequest'
import { useBookingItems } from './_lib/useBookingItems'

/** Confirms what was picked on the rooms page, collects guest details and continues to payment */
export default function NewBooking() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const parsed = useMemo(() => parseBookingRequest(new URLSearchParams(searchParams.toString())), [searchParams])
  const request = 'request' in parsed ? parsed.request : null
  const items = useBookingItems(status === 'authenticated' ? request : null)

  const [guest, setGuest] = useState<GuestDetails>({ guestName: '', guestEmail: '', guestPhone: '', specialRequests: '' })
  const [paymentType, setPaymentType] = useState<PaymentType>('FULL')
  const [addOnOptions, setAddOnOptions] = useState<AddOnOption[]>([])
  const [addOns, setAddOns] = useState<SelectedAddOn[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (status === 'unauthenticated') return void router.push('/auth/signin')
    if ('error' in parsed) {
      toast.error(parsed.error)
      return void router.push('/rooms')
    }
  }, [status, parsed, router])

  useEffect(() => {
    if (!session?.user) return
    setGuest((g) => ({ ...g, guestName: g.guestName || session.user.name || '', guestEmail: g.guestEmail || session.user.email || '' }))
    axios
      .get('/api/addons?activeOnly=true')
      .then((res) => setAddOnOptions(res.data))
      .catch((error) => console.error('Error fetching add-ons:', error))
  }, [session?.user])

  useEffect(() => {
    if (items === false) toast.error('ไม่สามารถโหลดข้อมูลห้องพักหรือบล็อคกางเต๊นท์ได้')
  }, [items])

  if (!request || items === null) {
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

  if (items === false) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <BookingNotFound />
      </div>
    )
  }

  const pricing = { ...items, addOns, checkIn: request.checkIn, checkOut: request.checkOut, discount: 0, discountAmount: 0 }
  const price = priceBreakdown(pricing, { includeVat: true })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!guest.guestName || !guest.guestEmail || !guest.guestPhone) return void toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')

    setSubmitting(true)
    try {
      // The server prices the booking itself
      const { roomIds, campingBlockIds, guestCounts, addOns: addOnPayload } = selectionPayload(pricing)
      const res = await axios.post('/api/bookings', {
        ...guest,
        checkIn: request.checkIn,
        checkOut: request.checkOut,
        paymentType,
        ...(roomIds.length && { roomIds }),
        ...(campingBlockIds.length && { campingBlockIds, guestCounts }),
        ...(addOnPayload.length && { addOns: addOnPayload }),
      })
      toast.success('สร้างการจองสำเร็จ')
      router.push(`/bookings/${res.data._id || res.data.id}/payment`)
    } catch (error: any) {
      console.error('Error creating booking:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถสร้างการจองได้')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">ยืนยันการจอง</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-6 text-gray-900">ข้อมูลผู้เข้าพัก</h2>

              <form onSubmit={handleSubmit}>
                <GuestFields value={guest} onChange={(patch) => setGuest((g) => ({ ...g, ...patch }))} />

                {addOnOptions.length > 0 && (
                  <div className="mb-6">
                    <label className="block text-gray-900 font-semibold mb-3">อ๊อฟชั่นเสริม</label>
                    <AddOnOptions
                      addOns={addOnOptions}
                      selected={addOns}
                      total={price.addOns}
                      onToggle={(addOn) => setAddOns((list) => toggleAddOn(list, addOn))}
                      onQuantityChange={(id, quantity) => setAddOns((list) => setAddOnQuantity(list, id, quantity))}
                    />
                  </div>
                )}

                <PaymentTypeOptions value={paymentType} onChange={setPaymentType} />

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

          <div className="lg:col-span-1">
            <BookingSummary
              {...items}
              addOns={addOns}
              checkIn={request.checkIn}
              checkOut={request.checkOut}
              price={price}
              paymentType={paymentType}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
