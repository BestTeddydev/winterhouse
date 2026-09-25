'use client'

import { useState } from 'react'
import {
  discountPatch,
  setAddOnQuantity,
  setCampingGuests,
  toggleAddOn,
  toggleCampingBlock,
  toggleRoom,
  type AddOnOption,
  type BookableCampingBlock,
  type BookableRoom,
  type PricingInputs,
} from './bookingForm'

/**
 * Form state of a booking. Every change that affects the price goes through `reprice`,
 * so `onPricingChange` can keep derived fields (e.g. an editable total) in sync.
 */
export function useBookingDraft<T extends PricingInputs>(initial: T | (() => T), onPricingChange?: (next: T) => T) {
  const [draft, setDraft] = useState<T>(initial)

  const set = <K extends keyof T>(key: K, value: T[K]) => setDraft((d) => ({ ...d, [key]: value }))
  /** Changes fields that don't affect the price */
  const patch = (values: Partial<Omit<T, keyof PricingInputs>>) => setDraft((d) => ({ ...d, ...values }))

  const reprice = (change: (d: T) => Partial<PricingInputs>) =>
    setDraft((d) => {
      const next = { ...d, ...change(d) }
      return onPricingChange ? onPricingChange(next) : next
    })

  return {
    draft,
    set,
    patch,
    setDate: (field: 'checkIn' | 'checkOut', value: string) => reprice(() => ({ [field]: value })),
    setDiscount: (kind: 'percent' | 'amount', value: number) => reprice(() => discountPatch(kind, value)),
    toggleRoom: (room: BookableRoom) => reprice((d) => ({ rooms: toggleRoom(d.rooms, room) })),
    toggleCampingBlock: (block: BookableCampingBlock) =>
      reprice((d) => ({ campingBlocks: toggleCampingBlock(d.campingBlocks, block) })),
    setCampingGuests: (block: BookableCampingBlock, count: number) =>
      reprice((d) => ({ campingBlocks: setCampingGuests(d.campingBlocks, block, count) })),
    toggleAddOn: (addOn: AddOnOption) => reprice((d) => ({ addOns: toggleAddOn(d.addOns, addOn) })),
    setAddOnQuantity: (addOnId: string, quantity: number) =>
      reprice((d) => ({ addOns: setAddOnQuantity(d.addOns, addOnId, quantity) })),
  }
}

export type BookingDraftActions = ReturnType<typeof useBookingDraft>
