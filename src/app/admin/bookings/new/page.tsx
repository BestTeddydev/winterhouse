'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import AddOnsSection from '../_components/AddOnsSection'
import BookingFormPage from '../_components/BookingFormPage'
import { useIsStaff } from '@/hooks/useRequireRole'
import DiscountSection from '../_components/DiscountSection'
import FormActions from '../_components/FormActions'
import GuestInfoSection from '../_components/GuestInfoSection'
import NotesSection from '../_components/NotesSection'
import PaymentSection, { type NewPaymentStatus, type PaymentType } from '../_components/PaymentSection'
import PriceSummary from '../_components/PriceSummary'
import SelectionPanel from '../_components/SelectionPanel'
import StayDatesSection from '../_components/StayDatesSection'
import { priceBreakdown, selectionPayload, type PricingInputs } from '@/lib/bookingForm'
import { useBookingCatalog } from '../_lib/useBookingCatalog'
import { useBookingDraft } from '../_lib/useBookingDraft'

interface NewBookingDraft extends PricingInputs {
  guestName: string
  guestEmail: string
  guestPhone: string
  guestCount: number
  specialRequests: string
  adminNotes: string
  paymentType: PaymentType
  paymentStatus: NewPaymentStatus
}

const EMPTY_BOOKING: NewBookingDraft = {
  checkIn: '',
  checkOut: '',
  rooms: [],
  campingBlocks: [],
  addOns: [],
  discount: 0,
  discountAmount: 0,
  guestName: '',
  guestEmail: 'unknow@gmail.com',
  guestPhone: '',
  guestCount: 1,
  specialRequests: '',
  adminNotes: '',
  paymentType: 'FULL',
  paymentStatus: 'COMPLETED',
}

async function uploadSlip(file: File): Promise<string> {
  const body = new FormData()
  body.append('file', file)
  const res = await axios.post('/api/upload', body, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data.url
}

/** A booking the guest arranged by phone/LINE; staff record it as already CONFIRMED */
export default function NewBooking() {
  const router = useRouter()
  const { staff } = useIsStaff()
  const catalog = useBookingCatalog(staff)
  const booking = useBookingDraft(EMPTY_BOOKING)
  const { draft, set } = booking
  const [slip, setSlip] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const price = priceBreakdown(draft)
  const nothingSelected = draft.rooms.length === 0 && draft.campingBlocks.length === 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nothingSelected) return void toast.error('กรุณาเลือกห้องพักหรือบล็อคกางเต๊นท์')
    if (!draft.checkIn || !draft.checkOut) return void toast.error('กรุณาระบุวันเช็คอินและเช็คเอาท์')
    if (!draft.guestName.trim()) return void toast.error('กรุณาระบุชื่อ-นามสกุลของผู้เข้าพัก')

    setSaving(true)
    try {
      let paymentSlipUrl: string | undefined
      if (slip) {
        try {
          paymentSlipUrl = await uploadSlip(slip)
        } catch (error) {
          console.error('Error uploading payment slip:', error)
          return void toast.error('ไม่สามารถอัปโหลดรูปภาพสลิปโอนเงินได้')
        }
      }

      const selection = selectionPayload(draft)
      await axios.post('/api/bookings', {
        ...selection,
        checkIn: draft.checkIn,
        checkOut: draft.checkOut,
        guestName: draft.guestName,
        guestEmail: draft.guestEmail,
        guestPhone: draft.guestPhone,
        // Camping blocks count their own guests
        guestCount: draft.campingBlocks.length
          ? selection.guestCounts.reduce((sum, n) => sum + n, 0)
          : draft.guestCount,
        specialRequests: draft.specialRequests,
        manualBookingNotes: draft.adminNotes,
        paymentType: draft.paymentType,
        paymentStatus: draft.paymentStatus,
        totalPrice: price.total,
        discount: draft.discount,
        discountAmount: draft.discountAmount,
        isManualBooking: true,
        bookingStatus: 'CONFIRMED',
        paymentSlipUrl,
      })
      toast.success('สร้างการจองสำเร็จ')
      router.push('/admin/bookings')
    } catch (error: any) {
      console.error('Error creating booking:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถสร้างการจองได้')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BookingFormPage title="เพิ่มการจองใหม่" subtitle="สร้างการจองจากช่องทางอื่น" loading={!catalog}>
      <div className="lg:col-span-1">
        <SelectionPanel
          rooms={catalog?.rooms ?? []}
          campingBlocks={catalog?.campingBlocks ?? []}
          selectedRooms={draft.rooms}
          selectedCampingBlocks={draft.campingBlocks}
          checkIn={draft.checkIn}
          nights={price.nights}
          total={price.total}
          onToggleRoom={booking.toggleRoom}
          onToggleCampingBlock={booking.toggleCampingBlock}
          onCampingGuestsChange={booking.setCampingGuests}
        />
      </div>

      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          <GuestInfoSection value={draft} onChange={booking.patch} />
          <StayDatesSection checkIn={draft.checkIn} checkOut={draft.checkOut} onChange={booking.setDate} />
          <AddOnsSection
            addOns={catalog?.addOns ?? []}
            selected={draft.addOns}
            total={price.addOns}
            nights={price.nights}
            onToggle={booking.toggleAddOn}
            onQuantityChange={booking.setAddOnQuantity}
          />
          <PaymentSection
            paymentType={draft.paymentType}
            paymentStatus={draft.paymentStatus}
            slip={slip}
            onPaymentTypeChange={(v) => set('paymentType', v)}
            onPaymentStatusChange={(v) => set('paymentStatus', v)}
            onSlipChange={setSlip}
          />
          <DiscountSection
            discount={draft.discount}
            discountAmount={draft.discountAmount}
            accommodation={price.accommodation}
            discountOff={price.discountOff}
            onChange={booking.setDiscount}
          />
          <NotesSection specialRequests={draft.specialRequests} adminNotes={draft.adminNotes} onChange={set} />
          <PriceSummary inputs={draft} price={price} />
          <FormActions label="สร้างการจอง" busy={saving} disabled={nothingSelected} onCancel={() => router.back()} />
        </form>
      </div>
    </BookingFormPage>
  )
}
