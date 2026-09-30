'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { MapPin, Tent } from 'lucide-react'
import { bangkokDateKey } from '@/lib/dates'
import { priceBreakdown, selectionPayload, selectionsFromBooking, type Catalog, type PricingInputs } from '@/lib/bookingForm'
import { useBookingDraft } from '../_lib/useBookingDraft'
import AddOnsSection from './AddOnsSection'
import BookingStatusSection, { type BookingStatus, type PaymentStatus } from './BookingStatusSection'
import BookingSummaryCard from './BookingSummaryCard'
import CampingBlockOptionCard from './CampingBlockOptionCard'
import FormActions from './FormActions'
import GuestInfoSection from './GuestInfoSection'
import NotesSection from './NotesSection'
import PriceAdjustSection from './PriceAdjustSection'
import RoomOptionCard from './RoomOptionCard'
import StayDatesSection from './StayDatesSection'
import { FormSection } from './ui'

interface EditBookingDraft extends PricingInputs {
  guestName: string
  guestEmail: string
  guestPhone: string
  guestCount: number
  specialRequests: string
  adminNotes: string
  bookingStatus: BookingStatus
  paymentStatus: PaymentStatus
  totalPrice: number
}

const dateInput = (value?: string) => (value ? bangkokDateKey(new Date(value)) : '')

function draftFromBooking(booking: any, catalog: Catalog): EditBookingDraft {
  return {
    ...selectionsFromBooking(booking, catalog),
    checkIn: dateInput(booking.checkIn),
    checkOut: dateInput(booking.checkOut),
    discount: booking.discount || 0,
    discountAmount: booking.discountAmount || 0,
    guestName: booking.guestName || '',
    guestEmail: booking.guestEmail || '',
    guestPhone: booking.guestPhone || '',
    guestCount: booking.guestCount || 1,
    specialRequests: booking.specialRequests || '',
    adminNotes: booking.manualBookingNotes || '',
    bookingStatus: booking.status || 'PENDING',
    paymentStatus: booking.payment?.status || 'PENDING',
    totalPrice: booking.totalPrice || 0,
  }
}

export default function EditBookingForm({ id, booking, catalog }: { id: string; booking: any; catalog: Catalog }) {
  const router = useRouter()
  // Customers paid VAT on top; bookings made by staff don't include it
  const includeVat = !booking.isManualBooking
  // The stored total stays until something that affects the price changes
  const form = useBookingDraft(
    () => draftFromBooking(booking, catalog),
    (next) => ({ ...next, totalPrice: priceBreakdown(next, { includeVat }).total })
  )
  const { draft, set } = form
  const [saving, setSaving] = useState(false)
  const price = priceBreakdown(draft, { includeVat })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (draft.rooms.length === 0 && draft.campingBlocks.length === 0) {
      return void toast.error('กรุณาเลือกห้องพักหรือบล็อคกางเต๊นท์')
    }
    if (!draft.checkIn || !draft.checkOut) return void toast.error('กรุณาระบุวันเช็คอินและเช็คเอาท์')
    if (!draft.guestName.trim()) return void toast.error('กรุณาระบุข้อมูลผู้เข้าพัก')

    setSaving(true)
    try {
      const selection = selectionPayload(draft)
      await axios.put(`/api/bookings/${id}`, {
        ...selection,
        checkIn: draft.checkIn,
        checkOut: draft.checkOut,
        guestName: draft.guestName,
        guestEmail: draft.guestEmail,
        guestPhone: draft.guestPhone,
        guestCount: draft.campingBlocks.length
          ? selection.guestCounts.reduce((sum, n) => sum + n, 0)
          : draft.guestCount,
        specialRequests: draft.specialRequests,
        manualBookingNotes: draft.adminNotes,
        bookingStatus: draft.bookingStatus,
        paymentStatus: draft.paymentStatus,
        totalPrice: draft.totalPrice,
        discount: draft.discount,
        discountAmount: draft.discountAmount,
      })
      toast.success('อัพเดทการจองสำเร็จ')
      router.push('/admin/bookings')
    } catch (error: any) {
      console.error('Error updating booking:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถอัพเดทการจองได้')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="lg:col-span-1">
        <BookingSummaryCard
          rooms={draft.rooms}
          campingBlocks={draft.campingBlocks}
          addOns={draft.addOns}
          checkIn={draft.checkIn}
          nights={price.nights}
          total={draft.totalPrice}
          isManualBooking={!!booking.isManualBooking}
        />
      </div>

      <div className="lg:col-span-2">
        <form onSubmit={handleSubmit} className="space-y-6">
          <GuestInfoSection value={draft} onChange={form.patch} />
          <StayDatesSection checkIn={draft.checkIn} checkOut={draft.checkOut} onChange={form.setDate} allowPastCheckIn />

          <FormSection icon={MapPin} title="เลือกห้องพัก">
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">💡 คลิก checkbox เพื่อเลือก/ยกเลิกห้องพัก</p>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {catalog.rooms.map((room) => (
                <RoomOptionCard
                  key={room.id}
                  room={room}
                  selected={draft.rooms.some((r) => r.id === room.id)}
                  onToggle={() => form.toggleRoom(room)}
                  checkIn={draft.checkIn}
                />
              ))}
            </div>
          </FormSection>

          <FormSection icon={Tent} title="เลือกบล็อคกางเต๊นท์">
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-700">💡 คลิก checkbox เพื่อเลือก/ยกเลิกบล็อค และปรับจำนวนคนได้</p>
            </div>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {catalog.campingBlocks.map((block) => (
                <CampingBlockOptionCard
                  key={block.id}
                  block={block}
                  guestCount={draft.campingBlocks.find((s) => s.block.id === block.id)?.guestCount ?? null}
                  nights={price.nights}
                  onToggle={() => form.toggleCampingBlock(block)}
                  onGuestsChange={(count) => form.setCampingGuests(block, count)}
                />
              ))}
            </div>
          </FormSection>

          <AddOnsSection
            addOns={catalog.addOns}
            selected={draft.addOns}
            total={price.addOns}
            nights={price.nights}
            onToggle={form.toggleAddOn}
            onQuantityChange={form.setAddOnQuantity}
          />
          <BookingStatusSection
            bookingStatus={draft.bookingStatus}
            paymentStatus={draft.paymentStatus}
            onBookingStatusChange={(v) => set('bookingStatus', v)}
            onPaymentStatusChange={(v) => set('paymentStatus', v)}
          />
          <PriceAdjustSection
            price={price}
            includeVat={includeVat}
            discount={draft.discount}
            discountAmount={draft.discountAmount}
            totalPrice={draft.totalPrice}
            onDiscountChange={form.setDiscount}
            onTotalPriceChange={(v) => set('totalPrice', v)}
          />
          <NotesSection specialRequests={draft.specialRequests} adminNotes={draft.adminNotes} onChange={set} />
          <FormActions label="บันทึกการเปลี่ยนแปลง" busy={saving} onCancel={() => router.back()} />
        </form>
      </div>
    </>
  )
}
