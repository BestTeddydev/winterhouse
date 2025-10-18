'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowLeft, Plus, X } from 'lucide-react'
import Link from 'next/link'

const buildingTypes = [
  { value: 'accommodation', label: 'ที่พัก', icon: '🏠' },
  { value: 'cafe', label: 'คาเฟ่', icon: '☕' },
  { value: 'restaurant', label: 'ร้านอาหาร', icon: '🍽️' },
  { value: 'facility', label: 'สิ่งอำนวยความสะดวก', icon: '🏢' },
  { value: 'parking', label: 'ที่จอดรถ', icon: '🚗' },
  { value: 'garden', label: 'สวน', icon: '🌳' },
]

export default function NewBuilding() {
  const router = useRouter()
  const { data: session } = useSession()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [buildingType, setBuildingType] = useState('accommodation')
  const [facilities, setFacilities] = useState<string[]>([])
  const [facilityInput, setFacilityInput] = useState('')
  const [x, setX] = useState('50')
  const [y, setY] = useState('50')
  const [submitting, setSubmitting] = useState(false)

  const handleAddFacility = () => {
    if (facilityInput.trim()) {
      setFacilities([...facilities, facilityInput.trim()])
      setFacilityInput('')
    }
  }

  const handleRemoveFacility = (index: number) => {
    setFacilities(facilities.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !description) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    setSubmitting(true)

    try {
      await axios.post('/api/buildings', {
        name,
        description,
        buildingType,
        facilities,
        x: parseFloat(x),
        y: parseFloat(y),
      })

      toast.success('เพิ่มอาคารสำเร็จ')
      router.push('/admin/buildings')
    } catch (error) {
      console.error('Error creating building:', error)
      toast.error('ไม่สามารถเพิ่มอาคารได้')
    } finally {
      setSubmitting(false)
    }
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/admin/buildings"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft size={20} />
            กลับไปหน้าจัดการอาคาร
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">เพิ่มอาคารใหม่</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                ชื่ออาคาร *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="เช่น อาคาร A"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                ประเภทอาคาร *
              </label>
              <select
                value={buildingType}
                onChange={(e) => setBuildingType(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {buildingTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              คำอธิบาย *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="คำอธิบายอาคาร"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              สิ่งอำนวยความสะดวก
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={facilityInput}
                onChange={(e) => setFacilityInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddFacility())}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="เช่น WiFi, แอร์, ที่จอดรถ"
              />
              <button
                type="button"
                onClick={handleAddFacility}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Plus size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {facilities.map((facility, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full flex items-center gap-2"
                >
                  {facility}
                  <button
                    type="button"
                    onClick={() => handleRemoveFacility(index)}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                ตำแหน่ง X บนแผนผัง (%) *
              </label>
              <input
                type="number"
                value={x}
                onChange={(e) => setX(e.target.value)}
                required
                min="0"
                max="100"
                step="0.1"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="50"
              />
              <p className="text-sm text-gray-500 mt-1">ตำแหน่งซ้าย-ขวา (0-100%)</p>
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                ตำแหน่ง Y บนแผนผัง (%) *
              </label>
              <input
                type="number"
                value={y}
                onChange={(e) => setY(e.target.value)}
                required
                min="0"
                max="100"
                step="0.1"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="50"
              />
              <p className="text-sm text-gray-500 mt-1">ตำแหน่งบน-ล่าง (0-100%)</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">💡 คำแนะนำ</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• ตำแหน่ง X และ Y ใช้สำหรับแสดงตำแหน่งอาคารบนแผนผัง</li>
              <li>• ค่า 0% คือด้านซ้ายสุด/บนสุด, ค่า 100% คือด้านขวาสุด/ล่างสุด</li>
              <li>• สามารถปรับแต่งตำแหน่งได้ภายหลังในหน้าแก้ไขอาคาร</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกอาคาร'}
            </button>
            <Link
              href="/admin/buildings"
              className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
