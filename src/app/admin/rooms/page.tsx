'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Plus, Search } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PageSpinner from '@/components/PageSpinner'
import RoomGridCard from './_components/RoomGridCard'
import RoomListFilters, { type ViewMode } from './_components/RoomListFilters'
import RoomTable from './_components/RoomTable'
import { filterRooms, type AdminRoom, type RoomSort, type RoomStatusFilter } from './_lib/roomList'

export default function AdminRooms() {
  const { data: session, status: sessionStatus } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const [rooms, setRooms] = useState<AdminRoom[] | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<RoomStatusFilter>('all')
  const [sort, setSort] = useState<RoomSort>('name')
  const [view, setView] = useState<ViewMode>('grid')

  // Switched-off rooms too, so they can be switched on again
  const load = useCallback(
    () =>
      axios
        .get('/api/rooms', { params: { includeInactive: true } })
        .then((res) => setRooms(res.data))
        .catch((error) => {
          console.error('Error fetching rooms:', error)
          toast.error('ไม่สามารถโหลดข้อมูลห้องพักได้')
          setRooms((r) => r ?? [])
        }),
    []
  )

  useEffect(() => {
    if (isAdmin) load()
  }, [isAdmin, load])

  const toggle = async (room: AdminRoom) => {
    try {
      await axios.put(`/api/rooms/${room.id}`, { isActive: !room.isActive })
      toast.success('อัพเดทสถานะห้องพักสำเร็จ')
      load()
    } catch (error) {
      console.error('Error updating room:', error)
      toast.error('ไม่สามารถอัพเดทสถานะห้องพักได้')
    }
  }

  const remove = async (room: AdminRoom) => {
    // Rooms are only switched off so existing bookings keep them
    if (!confirm(`คุณต้องการลบห้อง "${room.name}" ใช่หรือไม่?\nห้องจะถูกปิดใช้งานและซ่อนจากลูกค้า ส่วนการจองเดิมยังอยู่`)) return
    try {
      await axios.delete(`/api/rooms/${room.id}`)
      toast.success('ลบห้องพักสำเร็จ')
      load()
    } catch (error) {
      console.error('Error deleting room:', error)
      toast.error('ไม่สามารถลบห้องพักได้')
    }
  }

  if (sessionStatus !== 'loading' && !isAdmin) return null
  if (!rooms) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <PageSpinner />
      </div>
    )
  }

  const shown = filterRooms(rooms, { search, status, sort })

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">จัดการห้องพัก</h1>
            <p className="text-gray-700 text-lg font-medium">จัดการข้อมูลห้องพักและสิ่งอำนวยความสะดวก</p>
          </div>
          <Link
            href="/admin/rooms/new"
            className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Plus size={20} />
            เพิ่มห้องพักใหม่
          </Link>
        </div>

        <RoomListFilters
          search={search}
          status={status}
          sort={sort}
          view={view}
          onSearch={setSearch}
          onStatus={setStatus}
          onSort={setSort}
          onView={setView}
        />

        <div className="mb-6">
          <p className="text-gray-700 font-semibold">
            แสดงผล {shown.length} จาก {rooms.length} ห้องพัก
          </p>
        </div>

        {rooms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Plus className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">ยังไม่มีห้องพัก</h3>
            <p className="text-gray-500 mb-6">เริ่มต้นด้วยการเพิ่มห้องพักแรกของคุณ</p>
            <Link
              href="/admin/rooms/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold transition-colors"
            >
              <Plus size={20} />
              เพิ่มห้องพักแรก
            </Link>
          </div>
        ) : shown.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="text-gray-400" size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบห้องพัก</h3>
            <p className="text-gray-500">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shown.map((room) => (
              <RoomGridCard key={room.id} room={room} onToggle={() => toggle(room)} onDelete={() => remove(room)} />
            ))}
          </div>
        ) : (
          <RoomTable rooms={shown} onToggle={toggle} onDelete={remove} />
        )}
      </main>
    </div>
  )
}
