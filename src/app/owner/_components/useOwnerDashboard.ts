'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import type { DashboardStats, PeriodSummary } from '@/server/services/dashboard'
import type { DayField, Period } from './period'

interface Dashboard {
  stats: DashboardStats
  period: PeriodSummary
  checkIns: any[]
  checkOuts: any[]
  bookings: any[]
}

/** Stats and a period's bookings; the previous period stays on screen while the next one loads */
export function useOwnerDashboard(enabled: boolean, { from, to }: Period, by: DayField) {
  const [data, setData] = useState<Dashboard | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    setLoading(true)
    axios
      .get('/api/owner/dashboard', { params: { from, to, by }, signal: controller.signal })
      .then((res) => setData(res.data))
      .catch((error) => {
        if (axios.isCancel(error)) return
        console.error('Error fetching dashboard:', error)
        toast.error(error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลการจองได้')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [enabled, from, to, by])

  return { data, loading }
}
