'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowLeft, Filter, Plus, Search, Tent } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PageSpinner from '@/components/PageSpinner'
import { matchesCatalogFilter, type CatalogStatusFilter } from '@/components/admin/catalogFilter'
import CampingBlockCard, { type AdminCampingBlock } from './_components/CampingBlockCard'

export default function AdminCampingBlocks() {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const [blocks, setBlocks] = useState<AdminCampingBlock[] | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<CatalogStatusFilter>('all')

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') router.push('/auth/signin')
    else if (sessionStatus === 'authenticated' && !isAdmin) router.push('/')
  }, [sessionStatus, isAdmin, router])

  // Switched-off blocks too, so they can be switched on again
  const load = useCallback(
    () =>
      axios
        .get('/api/camping-blocks', { params: { includeInactive: true } })
        .then((res) => setBlocks(res.data))
        .catch((error) => {
          console.error('Error fetching camping blocks:', error)
          toast.error('ไม่สามารถโหลดข้อมูลบล็อคกางเต๊นท์ได้')
          setBlocks((b) => b ?? [])
        }),
    []
  )

  useEffect(() => {
    if (isAdmin) load()
  }, [isAdmin, load])

  const toggle = async (block: AdminCampingBlock) => {
    try {
      await axios.put(`/api/camping-blocks/${block.id}`, { isActive: !block.isActive })
      toast.success('อัพเดทสถานะบล็อคกางเต๊นท์สำเร็จ')
      load()
    } catch (error) {
      console.error('Error updating camping block:', error)
      toast.error('ไม่สามารถอัพเดทสถานะบล็อคกางเต๊นท์ได้')
    }
  }

  const remove = async (block: AdminCampingBlock) => {
    if (!confirm(`คุณต้องการลบบล็อคกางเต๊นท์ "${block.name}" ใช่หรือไม่?\nบล็อคจะถูกปิดใช้งานและซ่อนจากลูกค้า ส่วนการจองเดิมยังอยู่`)) return
    try {
      await axios.delete(`/api/camping-blocks/${block.id}`)
      toast.success('ลบบล็อคกางเต๊นท์สำเร็จ')
      load()
    } catch (error) {
      console.error('Error deleting camping block:', error)
      toast.error('ไม่สามารถลบบล็อคกางเต๊นท์ได้')
    }
  }

  if (!blocks || !isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        {sessionStatus === 'loading' || isAdmin ? <PageSpinner /> : null}
      </div>
    )
  }

  const filtering = Boolean(search) || status !== 'all'
  const shown = blocks.filter((b) => matchesCatalogFilter(b, search, status)).sort((a, b) => a.name.localeCompare(b.name))

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold mb-4">
            <ArrowLeft size={20} />
            กลับไปหน้าแอดมิน
          </Link>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <Tent className="text-primary-600" size={36} />
                จัดการบล็อคกางเต๊นท์
              </h1>
              <p className="text-gray-700 text-lg font-medium">เพิ่ม แก้ไข หรือลบบล็อคกางเต๊นท์</p>
            </div>
            <Link
              href="/admin/camping-blocks/new"
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
            >
              <Plus size={20} />
              เพิ่มบล็อคกางเต๊นท์
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                aria-label="ค้นหาบล็อคกางเต๊นท์"
                placeholder="ค้นหาบล็อคกางเต๊นท์..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-600" />
              <select
                aria-label="สถานะ"
                value={status}
                onChange={(e) => setStatus(e.target.value as CatalogStatusFilter)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">ทั้งหมด</option>
                <option value="active">เปิดใช้งาน</option>
                <option value="inactive">ปิดใช้งาน</option>
              </select>
            </div>
          </div>
        </div>

        {shown.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Tent className="mx-auto mb-4 text-gray-400" size={64} />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{filtering ? 'ไม่พบบล็อคกางเต๊นท์' : 'ยังไม่มีบล็อคกางเต๊นท์'}</h3>
            <p className="text-gray-600 mb-6">{filtering ? 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง' : 'เริ่มต้นโดยการเพิ่มบล็อคกางเต๊นท์ใหม่'}</p>
            {!filtering && (
              <Link
                href="/admin/camping-blocks/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus size={20} />
                เพิ่มบล็อคกางเต๊นท์
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {shown.map((block) => (
              <CampingBlockCard key={block.id} block={block} onToggle={() => toggle(block)} onDelete={() => remove(block)} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
