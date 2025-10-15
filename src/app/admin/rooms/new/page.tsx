'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import HotspotEditor from '@/components/HotspotEditor'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowLeft, Upload, X, Image as ImageIcon } from 'lucide-react'
import Link from 'next/link'

export default function NewRoom() {
  const router = useRouter()
  const { data: session } = useSession()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [price, setPrice] = useState('')
  const [capacity, setCapacity] = useState('')
  const [amenities, setAmenities] = useState<string[]>([])
  const [amenityInput, setAmenityInput] = useState('')
  const [hotspots, setHotspots] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAddAmenity = () => {
    if (amenityInput.trim()) {
      setAmenities([...amenities, amenityInput.trim()])
      setAmenityInput('')
    }
  }

  const handleRemoveAmenity = (index: number) => {
    setAmenities(amenities.filter((_, i) => i !== index))
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('กรุณาเลือกไฟล์รูปภาพ')
        return
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)')
        return
      }
      
      setSelectedFile(file)
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setImageUrl(previewUrl)
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return
    
    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      
      setImageUrl(response.data.url)
      toast.success('อัปโหลดรูปภาพสำเร็จ')
      
      // Clean up preview URL
      if (imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl)
      }
      
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('ไม่สามารถอัปโหลดรูปภาพได้')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = () => {
    setSelectedFile(null)
    setImageUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    
    // Clean up preview URL
    if (imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !description || !imageUrl || !price || !capacity) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    // ถ้ายังไม่ได้อัปโหลด ให้อัปโหลดก่อน
    if (selectedFile && imageUrl.startsWith('blob:')) {
      await handleFileUpload()
      // รอให้อัปโหลดเสร็จ
      if (imageUrl.startsWith('blob:')) {
        toast.error('กรุณาอัปโหลดรูปภาพก่อนบันทึก')
        return
      }
    }

    setSubmitting(true)

    try {
      await axios.post('/api/rooms', {
        name,
        description,
        imageUrl,
        price: parseFloat(price),
        capacity: parseInt(capacity),
        amenities,
        hotspots,
      })

      toast.success('เพิ่มห้องพักสำเร็จ')
      router.push('/admin/rooms')
    } catch (error) {
      console.error('Error creating room:', error)
      toast.error('ไม่สามารถเพิ่มห้องพักได้')
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
            href="/admin/rooms"
            className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft size={20} />
            กลับไปหน้าจัดการห้องพัก
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">เพิ่มห้องพักใหม่</h1>

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
              placeholder="เช่น Deluxe Room"
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
              placeholder="คำอธิบายห้องพัก"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              รูปภาพห้องพัก *
            </label>
            
            {/* File Upload Area */}
            {!imageUrl ? (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium">คลิกเพื่อเลือกรูปภาพ</p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF สูงสุด 10MB</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Image Preview */}
                <div className="relative h-64 w-full rounded-lg overflow-hidden border">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.jpg'
                    }}
                  />
                  
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
                
                {/* Upload Button (if preview from file) */}
                {selectedFile && imageUrl.startsWith('blob:') && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleFileUpload}
                      disabled={uploading}
                      className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Upload size={16} />
                      {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพ'}
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                    >
                      ยกเลิก
                    </button>
                  </div>
                )}
                
                {/* Change Image Button (if already uploaded) */}
                {!imageUrl.startsWith('blob:') && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    เปลี่ยนรูปภาพ
                  </button>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
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
                placeholder="1000"
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
                placeholder="2"
              />
            </div>
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
              disabled={submitting || uploading || (selectedFile && imageUrl.startsWith('blob:'))}
              className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {submitting ? 'กำลังบันทึก...' : 'บันทึกห้องพัก'}
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

