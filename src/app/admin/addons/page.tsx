'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Package, Plus, Search } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PageSpinner from '@/components/PageSpinner'
import { matchesCatalogFilter, type CatalogStatusFilter } from '@/components/admin/catalogFilter'
import { useIsStaff } from '@/hooks/useRequireRole'
import AddOnsTable, { type AdminAddOn } from './_components/AddOnsTable'

export default function AdminAddOns() {
  const { status: sessionStatus, staff } = useIsStaff()
  const [addOns, setAddOns] = useState<AdminAddOn[] | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<CatalogStatusFilter>('all')

  // Staff get the switched-off add-ons too
  const load = useCallback(
    () =>
      axios
        .get('/api/addons')
        .then((res) => setAddOns(res.data))
        .catch((error) => {
          console.error('Error fetching add-ons:', error)
          toast.error('ไม่สามารถโหลดข้อมูลอ๊อฟชั่นเสริมได้')
          setAddOns((a) => a ?? [])
        }),
    []
  )

  useEffect(() => {
    if (staff) load()
  }, [staff, load])

  const toggle = async (addOn: AdminAddOn) => {
    try {
      await axios.put(`/api/addons/${addOn._id}`, { isActive: !addOn.isActive })
      toast.success('อัพเดทสถานะอ๊อฟชั่นเสริมสำเร็จ')
      load()
    } catch (error) {
      console.error('Error updating add-on:', error)
      toast.error('ไม่สามารถอัพเดทสถานะอ๊อฟชั่นเสริมได้')
    }
  }

  const remove = async (addOn: AdminAddOn) => {
    if (!confirm(`คุณต้องการลบอ๊อฟชั่นเสริม "${addOn.name}" ใช่หรือไม่?`)) return
    try {
      await axios.delete(`/api/addons/${addOn._id}`)
      toast.success('ลบอ๊อฟชั่นเสริมสำเร็จ')
      load()
    } catch (error) {
      console.error('Error deleting add-on:', error)
      toast.error('ไม่สามารถลบอ๊อฟชั่นเสริมได้')
    }
  }

  if (!addOns || !staff) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        {sessionStatus === 'loading' || staff ? <PageSpinner /> : null}
      </div>
    )
  }

  const filtering = Boolean(search) || status !== 'all'
  const shown = addOns.filter((a) => matchesCatalogFilter(a, search, status)).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">จัดการอ๊อฟชั่นเสริม</h1>
            <p className="text-gray-700 text-lg">เพิ่ม แก้ไข หรือลบอ๊อฟชั่นเสริม</p>
          </div>
          <Link
            href="/admin/addons/new"
            className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            <Plus size={20} />
            เพิ่มอ๊อฟชั่นเสริม
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                aria-label="ค้นหาอ๊อฟชั่นเสริม"
                placeholder="ค้นหาอ๊อฟชั่นเสริม..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <select
              aria-label="สถานะ"
              value={status}
              onChange={(e) => setStatus(e.target.value as CatalogStatusFilter)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">ทั้งหมด</option>
              <option value="active">เปิดใช้งาน</option>
              <option value="inactive">ปิดใช้งาน</option>
            </select>
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Package className="mx-auto text-gray-400 mb-4" size={48} />
            <p className="text-gray-500 text-lg">{filtering ? 'ไม่พบอ๊อฟชั่นเสริม' : 'ยังไม่มีอ๊อฟชั่นเสริม'}</p>
            {!filtering && (
              <Link
                href="/admin/addons/new"
                className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus size={20} />
                เพิ่มอ๊อฟชั่นเสริมแรก
              </Link>
            )}
          </div>
        ) : (
          <AddOnsTable addOns={shown} onToggle={toggle} onDelete={remove} />
        )}
      </main>
    </div>
  )
}
