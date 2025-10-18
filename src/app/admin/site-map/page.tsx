'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import SiteMapEditor from '@/components/SiteMapEditor'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Save, MapPin, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface BuildingHotspot {
  id: string
  x: number
  y: number
  buildingName: string
  buildingType: string
  rooms: string[]
  description: string
  facilities: string[]
}

interface SiteMapData {
  imageUrl: string
  hotspots: BuildingHotspot[]
}

export default function AdminSiteMapPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [siteMap, setSiteMap] = useState<SiteMapData>({
    imageUrl: '/placeholder-map.jpg',
    hotspots: [],
  })
  const [availableRooms, setAvailableRooms] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session === undefined) {
      return
    }

    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (!session.user) {
      router.push('/auth/signin')
      return
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }

    fetchData()
  }, [session, router])

  const fetchData = async () => {
    try {
      // Fetch rooms that are not linked to any building
      const roomsResponse = await axios.get('/api/rooms')
      const unlinkedRooms = roomsResponse.data.filter((room: any) => !room.buildingId)
      setAvailableRooms(
        unlinkedRooms.map((room: any) => ({
          id: room._id || room.id,
          name: room.name,
        }))
      )

      // Fetch site map data (you'll need to create this API endpoint)
      try {
        const siteMapResponse = await axios.get('/api/site-map')
        if (siteMapResponse.data) {
          setSiteMap(siteMapResponse.data)
        }
      } catch (error) {
        // Site map doesn't exist yet, use default
        console.log('No site map found, using default')
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('ไม่สามารถโหลดข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      // You'll need to create an upload endpoint
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const newImageUrl = response.data.url
      setSiteMap({ ...siteMap, imageUrl: newImageUrl })
      toast.success('อัปโหลดรูปภาพสำเร็จ')
      return newImageUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await axios.post('/api/site-map', siteMap)
      toast.success('บันทึกแผนผังสำเร็จ')
    } catch (error) {
      console.error('Error saving site map:', error)
      toast.error('ไม่สามารถบันทึกแผนผังได้')
    } finally {
      setSaving(false)
    }
  }

  if (session === undefined || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  if (!session || !session.user || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold mb-4"
          >
            <ArrowLeft size={20} />
            กลับไปหน้าแอดมิน
          </Link>
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <MapPin className="text-primary-600" size={36} />
                จัดการแผนผังที่ดินและอาคาร
              </h1>
              <p className="text-gray-700 text-lg font-medium">
                อัปโหลดแผนผังที่ดินและระบุตำแหน่งอาคาร/ห้องพักต่างๆ
              </p>
              {availableRooms.length > 0 && (
                <p className="text-sm text-blue-600 mt-2 font-medium">
                  💡 มีห้องพัก {availableRooms.length} ห้องที่ยังไม่ได้ผูกกับอาคาร
                </p>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl hover:from-primary-700 hover:to-primary-800 flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={20} />
              {saving ? 'กำลังบันทึก...' : 'บันทึกแผนผัง'}
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
          <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
            <span>ℹ️</span>
            คำแนะนำการใช้งาน
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>คลิก "เปลี่ยนรูปแผนผัง" เพื่ออัปโหลดรูปแผนผังที่ดิน/อาคาร</li>
            <li>คลิก "เพิ่มอาคาร" แล้วคลิกที่ตำแหน่งบนแผนผังที่ต้องการ</li>
            <li>กรอกข้อมูลอาคาร เลือกประเภท และเชื่อมโยงกับห้องพัก</li>
            <li>คลิกที่จุดบนแผนผังเพื่อแก้ไขข้อมูล</li>
            <li>คลิก "บันทึกแผนผัง" เมื่อเสร็จสิ้น</li>
          </ol>
        </div>

        {/* Site Map Editor */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <SiteMapEditor
            imageUrl={siteMap.imageUrl}
            hotspots={siteMap.hotspots}
            availableRooms={availableRooms}
            onChange={(hotspots) => setSiteMap({ ...siteMap, hotspots })}
            onImageUpload={handleImageUpload}
          />
        </div>

        {/* Tips */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-bold text-yellow-900 mb-3">💡 เคล็ดลับ</h3>
          <ul className="list-disc list-inside space-y-2 text-yellow-800">
            <li>ใช้รูปแผนผังที่มีความละเอียดสูงเพื่อความชัดเจน</li>
            <li>ตั้งชื่ออาคารให้เข้าใจง่าย เช่น "อาคาร A", "คาเฟ่ชั้น 1"</li>
            <li>เชื่อมโยงห้องพักกับอาคารที่ถูกต้องเพื่อให้ลูกค้าค้นหาได้ง่าย</li>
            <li>กำหนดประเภทอาคารให้ถูกต้องเพื่อแสดง icon ที่เหมาะสม</li>
            <li>ห้องพักที่ยังไม่ได้ผูกกับอาคารจะแสดงในรายการห้องพักที่ใช้ได้</li>
            <li>สามารถผูกห้องพักกับอาคารได้โดยการเลือก checkbox ในรายการห้องพัก</li>
          </ul>
        </div>
      </main>
    </div>
  )
}

