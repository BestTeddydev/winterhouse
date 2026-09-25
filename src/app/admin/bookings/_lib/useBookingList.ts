'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'

export type SortField = 'checkIn' | 'createdAt' | 'totalPrice'

export interface BookingFilters {
  search: string
  status: string
  payment: string
  dateType: 'createdAt' | 'checkIn'
  dateFrom: string
  dateTo: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export const EMPTY_FILTERS: BookingFilters = { search: '', status: 'all', payment: 'all', dateType: 'createdAt', dateFrom: '', dateTo: '' }
const PAGE_SIZE = 20
const EMPTY_PAGINATION: Pagination = { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false }

/** Query params of the bookings API for the filters and sort */
export function bookingQuery(filters: BookingFilters, sort: { by: SortField; order: 'asc' | 'desc' }) {
  const params: Record<string, string> = { sortBy: sort.by, sortOrder: sort.order }
  if (filters.dateFrom && filters.dateTo) {
    Object.assign(params, { dateFrom: filters.dateFrom, dateTo: filters.dateTo, dateFilterType: filters.dateType })
  }
  if (filters.search.trim()) params.search = filters.search.trim()
  if (filters.status !== 'all') params.status = filters.status
  if (filters.payment !== 'all') params.paymentStatus = filters.payment
  return params
}

export const hasFilters = (f: BookingFilters) =>
  Boolean(f.search.trim() || f.status !== 'all' || f.payment !== 'all' || (f.dateFrom && f.dateTo))

/** One page of bookings for the filters; any filter/sort change starts again from page 1 */
export function useBookingList(enabled: boolean, query: Record<string, string>) {
  const [bookings, setBookings] = useState<any[]>([])
  const [pagination, setPagination] = useState<Pagination>(EMPTY_PAGINATION)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const queryKey = JSON.stringify(query)
  const stableQuery = useMemo(() => JSON.parse(queryKey) as Record<string, string>, [queryKey])
  const previousQuery = useRef(queryKey)

  useEffect(() => {
    if (!enabled) return
    if (previousQuery.current !== queryKey) {
      previousQuery.current = queryKey
      if (page !== 1) return void setPage(1) // runs again with page 1
    }

    // Abort the previous request so a slow, outdated response can't overwrite a newer one
    const controller = new AbortController()
    setLoading(true)
    axios
      .get('/api/bookings', { params: { ...stableQuery, page, limit: PAGE_SIZE }, signal: controller.signal, timeout: 30000 })
      .then(({ data }) => {
        setBookings(data.bookings)
        setPagination(data.pagination)
        setHasLoaded(true)
      })
      .catch((error) => {
        if (axios.isCancel(error)) return
        console.error('Error fetching bookings:', error)
        toast.error('ไม่สามารถโหลดข้อมูลการจองได้')
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [enabled, queryKey, stableQuery, page, reloadKey])

  return { bookings, pagination, page, setPage, loading, hasLoaded, reload: () => setReloadKey((k) => k + 1) }
}
