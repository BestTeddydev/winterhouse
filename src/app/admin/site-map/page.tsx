'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Save, MapPin, ArrowLeft } from 'lucide-react'
import Navbar from '@/components/Navbar'
import PageSpinner from '@/components/PageSpinner'
import { useIsStaff } from '@/hooks/useRequireRole'
import type { BuildingHotspot, MapType, SiteMapData } from '@/lib/siteMap'
import SiteMapEditor from './_components/SiteMapEditor'

type Item = { id: string; name: string }

const EMPTY_MAP: SiteMapData = { imageUrl: '/placeholder-map.svg', hotspots: [] }

const toItems = (list: Array<{ id?: string; _id?: string; name: string }>): Item[] =>
  list.map((item) => ({ id: (item.id ?? item._id)!, name: item.name }))

export default function AdminSiteMapPage() {
  const { staff: isStaff } = useIsStaff()
  const [mapType, setMapType] = useState<MapType>('accommodation')
  const [siteMap, setSiteMap] = useState<SiteMapData>(EMPTY_MAP)
  // Accommodation maps link rooms, camping maps link camping blocks
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Load (and reload when the map type changes). All rooms: the editor offers each building
  // its own rooms plus the ones not in any building.
  const load = useCallback(async (type: MapType) => {
    setLoading(true)
    const [itemsResult, mapResult] = await Promise.allSettled([
      axios.get(type === 'camping' ? '/api/camping-blocks' : '/api/rooms'),
      axios.get('/api/site-map', { params: { type } }),
    ])
    if (itemsResult.status === 'fulfilled') setItems(toItems(itemsResult.value.data))
    else setItems([])
    if (mapResult.status === 'fulfilled') setSiteMap({ imageUrl: mapResult.value.data.imageUrl, hotspots: mapResult.value.data.hotspots })
    else setSiteMap(EMPTY_MAP)
    if (itemsResult.status === 'rejected' || mapResult.status === 'rejected') {
      console.error('Error fetching site map data:', itemsResult, mapResult)
      toast.error('ไม่สามารถโหลดข้อมูลได้')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (isStaff) load(mapType)
  }, [isStaff, mapType, load])

  const setHotspots = useCallback(
    (update: (hotspots: BuildingHotspot[]) => BuildingHotspot[]) =>
      setSiteMap((map) => ({ ...map, hotspots: update(map.hotspots) })),
    []
  )

  const handleImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await axios.post('/api/upload', formData)
    setSiteMap((map) => ({ ...map, imageUrl: data.url }))
    toast.success('อัปโหลดรูปภาพสำเร็จ')
    return data.url
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await axios.post('/api/site-map', {
        ...siteMap,
        type: mapType,
      })
      toast.success('บันทึกแผนผังสำเร็จ')
    } catch (error) {
      console.error('Error saving site map:', error)
      toast.error('ไม่สามารถบันทึกแผนผังได้')
    } finally {
      setSaving(false)
    }
  }

  if (!isStaff) return null

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <PageSpinner />
      </div>
    )
  }

  const unlinkedRooms = items.filter((room) => !siteMap.hotspots.some((h) => h.rooms?.includes(room.id))).length

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
                อัปโหลดแผนผังที่ดินและระบุตำแหน่งอาคาร/ห้องพักหรือลานกางเต๊นท์
              </p>
              
              {/* Tab Selector */}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setMapType('accommodation')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    mapType === 'accommodation'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🏠 แผนผังห้องพัก
                </button>
                <button
                  onClick={() => setMapType('camping')}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    mapType === 'camping'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  🏕️ แผนผังลานกางเต๊นท์
                </button>
              </div>
              
              {mapType === 'accommodation' && unlinkedRooms > 0 && (
                <p className="text-sm text-blue-600 mt-2 font-medium">
                  💡 มีห้องพัก {unlinkedRooms} ห้องที่ยังไม่ได้ผูกกับอาคาร
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
            <li>เลือกประเภทแผนผัง: "แผนผังห้องพัก" หรือ "แผนผังลานกางเต๊นท์"</li>
            <li>คลิก "เปลี่ยนรูปแผนผัง" เพื่ออัปโหลดรูปแผนผังที่ดิน/อาคาร/ลานกางเต๊นท์</li>
            <li>คลิก "เพิ่ม{mapType === 'camping' ? 'จุดกางเต๊นท์' : 'อาคาร'}" แล้วคลิกที่ตำแหน่งบนแผนผังที่ต้องการ</li>
            <li>กรอกข้อมูล{mapType === 'camping' ? 'จุดกางเต๊นท์' : 'อาคาร'} เลือกประเภท และ{mapType === 'accommodation' ? 'เชื่อมโยงกับห้องพัก' : 'ระบุรายละเอียด'}</li>
            <li>คลิกที่จุดบนแผนผังเพื่อแก้ไขข้อมูล</li>
            <li>คลิก "บันทึกแผนผัง" เมื่อเสร็จสิ้น</li>
          </ol>
        </div>

        {/* Site Map Editor */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <SiteMapEditor
            imageUrl={siteMap.imageUrl}
            hotspots={siteMap.hotspots}
            availableRooms={mapType === 'accommodation' ? items : []}
            availableCampingBlocks={mapType === 'camping' ? items : []}
            onChange={setHotspots}
            onImageUpload={handleImageUpload}
            mapType={mapType}
          />
        </div>

        {/* Tips */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-bold text-yellow-900 mb-3">💡 เคล็ดลับ</h3>
          <ul className="list-disc list-inside space-y-2 text-yellow-800">
            <li>ใช้รูปแผนผังที่มีความละเอียดสูงเพื่อความชัดเจน</li>
            {mapType === 'accommodation' ? (
              <>
                <li>ตั้งชื่ออาคารให้เข้าใจง่าย เช่น "อาคาร A", "คาเฟ่ชั้น 1"</li>
                <li>เชื่อมโยงห้องพักกับอาคารที่ถูกต้องเพื่อให้ลูกค้าค้นหาได้ง่าย</li>
                <li>กำหนดประเภทอาคารให้ถูกต้องเพื่อแสดง icon ที่เหมาะสม</li>
                <li>ห้องพักที่ยังไม่ได้ผูกกับอาคารจะแสดงในรายการห้องพักที่ใช้ได้</li>
                <li>สามารถผูกห้องพักกับอาคารได้โดยการเลือก checkbox ในรายการห้องพัก</li>
              </>
            ) : (
              <>
                <li>ตั้งชื่อจุดกางเต๊นท์ให้เข้าใจง่าย เช่น "โซน A", "โซน B", "จุดใกล้ห้องน้ำ"</li>
                <li>ระบุประเภทจุดกางเต๊นท์ให้ถูกต้อง เช่น จุดกางเต๊นท์, ห้องน้ำ, ที่จอดรถ</li>
                <li>เพิ่มรายละเอียดและสิ่งอำนวยความสะดวกของแต่ละจุด</li>
                <li>สามารถระบุตำแหน่งสิ่งอำนวยความสะดวกต่างๆ เช่น ห้องน้ำ, ที่จอดรถ, สวน</li>
              </>
            )}
          </ul>
        </div>
      </main>
    </div>
  )
}

