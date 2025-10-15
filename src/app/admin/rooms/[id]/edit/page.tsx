'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import HotspotEditor from '@/components/HotspotEditor'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EditRoom() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()

  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [price, setPrice] = useState('')
  const [capacity, setCapacity] = useState('')
  const [amenities, setAmenities] = useState<string[]>([])
  const [amenityInput, setAmenityInput] = useState('')
  const [hotspots, setHotspots] = useState<any[]>([])
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin')
      return
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }

    if (params.id) {
      fetchRoom()
    }
  }, [session, params.id])

  const fetchRoom = async () => {
    try {
      const response = await axios.get(`/api/rooms/${params.id}`)
      const room = response.data

      setName(room.name)
      setDescription(room.description)
      setImageUrl(room.imageUrl)
      setPrice(room.price)
      setCapacity(room.capacity.toString())
      setAmenities(room.amenities || [])
      setHotspots(room.hotspots || [])
      setIsActive(room.isActive)
    } catch (error) {
      console.error('Error fetching room:', error)
      toast.error('ไม่สามารถโหลดข้อมูลห้องพักได้')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAmenity = () => {
    if (amenityInput.trim()) {
      setAmenities([...amenities, amenityInput.trim()])
      setAmenityInput('')
    }
  }

  const handleRemoveAmenity = (index: number) => {
    setAmenities(amenities.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !description || !imageUrl || !price || !capacity) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    setSubmitting(true)

    try {
      await axios.put(`/api/rooms/${params.id}`, {
        name,
        description,
        imageUrl,
        price: parseFloat(price),
        capacity: parseInt(capacity),
        amenities,
        hotspots,
        isActive,
      })

      toast.success('อัพเดทห้องพักสำเร็จ')
      router.push('/admin/rooms')
    } catch (error) {
      console.error('Error updating room:', error)
      toast.error('ไม่สามารถอัพเดทห้องพักได้')
    } finally {
      setSubmitting(false)
    }
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/admin/rooms"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft size={20} />
            กลับไปหน้าจัดการห้องพัก
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">แก้ไขห้องพัก</h1>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              ชื่อห้อง *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
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
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              URL รูปภาพ *
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              required
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            {imageUrl && (
              <div className="mt-4 relative h-64 w-full">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                ราคาต่อคืน (บาท) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                min="0"
                step="0.01"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                ความจุ (คน) *
              </label>
              <input
                type="number"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
                min="1"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-gray-700 font-medium">เปิดใช้งาน</span>
            </label>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              สิ่งอำนวยความสะดวก
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={amenityInput}
                onChange={(e) => setAmenityInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAmenity())}
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="เช่น WiFi, แอร์, TV"
              />
              <button
                type="button"
                onClick={handleAddAmenity}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                เพิ่ม
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full flex items-center gap-2"
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() => handleRemoveAmenity(index)}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {imageUrl && (
            <div>
              <HotspotEditor
                imageUrl={imageUrl}
                hotspots={hotspots}
                onChange={setHotspots}
              />
            </div>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}
            </button>
            <Link
              href="/admin/rooms"
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

