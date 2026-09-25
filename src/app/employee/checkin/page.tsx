'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { AlertCircle } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PageSpinner from '@/components/PageSpinner'
import { bangkokDateKey } from '@/lib/dates'
import CheckInForm from './_components/CheckInForm'
import TodayStatusCard from './_components/TodayStatusCard'

export default function EmployeeCheckIn() {
  const { status } = useSession()
  const [attendance, setAttendance] = useState<any>(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)

  const loadToday = useCallback(async () => {
    try {
      const { data } = await axios.get('/api/employee/attendance', { params: { date: bangkokDateKey(), limit: 1 } })
      setAttendance(data.attendance?.[0] ?? null)
    } catch (error) {
      console.error('Error checking today attendance:', error)
    }
  }, [])

  useEffect(() => {
    if (status === 'authenticated') loadToday()
  }, [status, loadToday])

  const checkIn = async (values: { location: string; notes: string }) => {
    setCheckingIn(true)
    try {
      const { data } = await axios.post('/api/employee/attendance/checkin', values)
      toast.success('เช็คอินสำเร็จ รอการอนุมัติ')
      setAttendance(data.attendance)
      return true
    } catch (error: any) {
      console.error('Error checking in:', error)
      if (error.response?.data?.attendance) {
        setAttendance(error.response.data.attendance)
        toast.error('คุณได้เช็คอินแล้ววันนี้')
      } else {
        toast.error(error.response?.data?.error || 'ไม่สามารถเช็คอินได้')
      }
      return false
    } finally {
      setCheckingIn(false)
    }
  }

  const checkOut = async (notes: string) => {
    setCheckingOut(true)
    try {
      const { data } = await axios.post('/api/employee/attendance/checkout', { notes })
      toast.success('เช็คเอาท์สำเร็จ')
      setAttendance(data.attendance)
      await loadToday()
    } catch (error: any) {
      console.error('Error checking out:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถเช็คเอาท์ได้')
    } finally {
      setCheckingOut(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <PageSpinner />
      </div>
    )
  }

  const todayLabel = new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Asia/Bangkok',
  })
  const rejected = attendance?.status === 'REJECTED'

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">เช็คอินเข้างาน</h1>
          <p className="text-gray-700 text-lg">{todayLabel}</p>
        </div>

        <div className="max-w-2xl mx-auto">
          {attendance && <TodayStatusCard attendance={attendance} checkingOut={checkingOut} onCheckOut={checkOut} />}
          {/* A rejected check-in may be sent again */}
          {(!attendance || rejected) && <CheckInForm busy={checkingIn} again={rejected} onSubmit={checkIn} />}

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">คำแนะนำ:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>คุณสามารถเช็คอินได้เพียงครั้งเดียวต่อวัน</li>
                  <li>การเช็คอินจะต้องรอการอนุมัติจากผู้ดูแลระบบ</li>
                  <li>หากมีการปฏิเสธ คุณสามารถเช็คอินใหม่ได้</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
