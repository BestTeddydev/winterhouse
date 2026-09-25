'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import type { DashboardStats } from '@/server/services/dashboard'

export type DayField = 'createdAt' | 'checkIn'

interface Dashboard {
  stats: DashboardStats
  checkIns: any[]
  checkOuts: any[]
  bookings: any[]
}

/** Stats and one day's bookings; the previous day stays on screen while the next one loads */
export function useOwnerDashboard(enabled: boolean, date: string, by: DayField) {
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    setLoading(true)
    axios
      .get('/api/owner/dashboard', { params: { date, by }, signal: controller.signal })
      .then((res) => setData(res.data))
      .catch((error) => {
        if (axios.isCancel(error)) return
        console.error('Error fetching dashboard:', error)
        toast.error('ไม่สามารถโหลดข้อมูลการจองได้')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [enabled, date, by])

  return { data, loading }
}
