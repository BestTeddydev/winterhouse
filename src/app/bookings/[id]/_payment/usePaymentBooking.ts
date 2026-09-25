'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'

/**
 * The booking of a payment page. Waits for the session (signing in first when needed and coming
 * back here), then loads the booking; `null` when it can't be loaded, `undefined` while loading.
 */
export function usePaymentBooking() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { status } = useSession()
  const [booking, setBooking] = useState<any>(undefined)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    if (status !== 'authenticated') return
    const controller = new AbortController()
    axios
      .get(`/api/bookings/${id}`, { signal: controller.signal })
      .then((res) => setBooking(res.data))
      .catch((error) => {
        if (axios.isCancel(error)) return
        console.error('Error fetching booking:', error)
        toast.error(error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลการจองได้')
        setBooking(null)
      })
    return () => controller.abort()
  }, [status, id, router])

  return { id, booking }
}

type Method = 'qr_code' | 'credit_card'

/** Starts a Stripe payment (first payment or the remaining balance) and goes to Stripe */
export function useStartPayment(bookingId: string, endpoint: '/api/payments' | '/api/payments/remaining') {
  const [processing, setProcessing] = useState(false)
  const start = async (paymentMethod: Method) => {
    setProcessing(true)
    try {
      const { data } = await axios.post(endpoint, { bookingId, paymentMethod })
      const url = paymentMethod === 'qr_code' ? data.qrCodeUrl : data.checkoutUrl
      if (!url) throw new Error('no payment url')
      window.location.href = url
    } catch (error: any) {
      console.error('Error starting payment:', error)
      toast.error(error.response?.data?.error || (paymentMethod === 'qr_code' ? 'ไม่สามารถสร้าง QR Code ได้' : 'ไม่สามารถชำระเงินผ่านบัตรเครดิตได้'))
      setProcessing(false)
    }
  }
  return { processing, start }
}
