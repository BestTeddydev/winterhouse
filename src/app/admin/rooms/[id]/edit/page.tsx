'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import HotspotEditor from '@/components/HotspotEditor'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowLeft, Upload, X, Image as ImageIcon, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function EditRoom() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()

  const [loading, setLoading] = useState(true)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [coverImageIndex, setCoverImageIndex] = useState(0)
  const [price, setPrice] = useState('')
  const [pricing, setPricing] = useState({
    weekday: '',
    weekend: '',
    holiday: ''
  })
  const [capacity, setCapacity] = useState('')
  const [amenities, setAmenities] = useState<string[]>([])
  const [amenityInput, setAmenityInput] = useState('')
  const [hotspots, setHotspots] = useState<any[]>([])
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Wait for session to load
    if (session === undefined) {
      return
    }
    
    setSessionLoading(false)
    
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
      
      // Handle multiple images
      if (room.imageUrls && room.imageUrls.length > 0) {
        setImageUrls(room.imageUrls)
        // Find cover image index
        const coverIndex = room.imageUrls.findIndex((url: string) => url === room.imageUrl)
        setCoverImageIndex(coverIndex >= 0 ? coverIndex : 0)
      } else if (room.imageUrl) {
        // Fallback to single image
        setImageUrls([room.imageUrl])
        setCoverImageIndex(0)
      }
      
      setPrice(room.price || room.pricing?.weekday || '')
      setCapacity(room.capacity.toString())
      setPricing({
        weekday: room.pricing?.weekday?.toString() || room.price?.toString() || '',
        weekend: room.pricing?.weekend?.toString() || '',
        holiday: room.pricing?.holiday?.toString() || ''
      })
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    // Validate files
    const validFiles: File[] = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`ไฟล์ ${file.name} ไม่ใช่รูปภาพ`)
        continue
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (สูงสุด 10MB)`)
        continue
      }
      
      validFiles.push(file)
    }

    if (validFiles.length > 0) {
      setSelectedFiles([...selectedFiles, ...validFiles])
      
      // Create preview URLs
      const previewUrls = validFiles.map(file => URL.createObjectURL(file))
      setImageUrls([...imageUrls, ...previewUrls])
    }
  }

  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return
    
    setUploading(true)
    
    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const formData = new FormData()
        formData.append('file', file)
        
        const response = await axios.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
        
        return response.data.url
      })
      
      const uploadedUrls = await Promise.all(uploadPromises)
      setImageUrls([...imageUrls, ...uploadedUrls])
      setSelectedFiles([])
      
      // Clean up preview URLs
      imageUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
      
      toast.success(`อัปโหลดรูปภาพ ${uploadedUrls.length} รูปสำเร็จ`)
      
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('ไม่สามารถอัปโหลดรูปภาพได้')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    const urlToRemove = imageUrls[index]
    
    // Clean up preview URL if it's a blob
    if (urlToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRemove)
    }
    
    // Remove from arrays
    const newImageUrls = imageUrls.filter((_, i) => i !== index)
    setImageUrls(newImageUrls)
    
    // Adjust cover image index if needed
    if (coverImageIndex >= newImageUrls.length) {
      setCoverImageIndex(Math.max(0, newImageUrls.length - 1))
    } else if (coverImageIndex > index) {
      setCoverImageIndex(coverImageIndex - 1)
    }
    
    // Update main imageUrl if this was the cover image
    if (coverImageIndex === index) {
      setImageUrl(newImageUrls[Math.max(0, newImageUrls.length - 1)] || '')
    }
  }

  const handleSetCoverImage = (index: number) => {
    setCoverImageIndex(index)
    setImageUrl(imageUrls[index])
  }

  const handleRemoveAllImages = () => {
    // Clean up all preview URLs
    imageUrls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
      }
    })
    
    setSelectedFiles([])
    setImageUrls([])
    setImageUrl('')
    setCoverImageIndex(0)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !description || !price || !capacity) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    if (imageUrls.length === 0) {
      toast.error('กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป')
      return
    }

    // ถ้ายังไม่ได้อัปโหลด ให้อัปโหลดก่อน
    if (selectedFiles.length > 0) {
      await handleFileUpload()
      // รอให้อัปโหลดเสร็จ
      if (selectedFiles.length > 0) {
        toast.error('กรุณาอัปโหลดรูปภาพก่อนบันทึก')
        return
      }
    }

    setSubmitting(true)

    try {
      const roomData: any = {
        name,
        description,
        imageUrl: imageUrls[coverImageIndex], // รูปปก
        imageUrls, // รูปทั้งหมด
        price: parseFloat(price),
        capacity: parseInt(capacity),
        amenities,
        hotspots,
        isActive,
      }

      // Add pricing if provided
      if (pricing.weekday || pricing.weekend || pricing.holiday) {
        const basePrice = pricing.weekday || price
        roomData.pricing = {
          weekday: parseFloat(pricing.weekday || basePrice),
          weekend: parseFloat(pricing.weekend || pricing.weekday || basePrice),
          holiday: parseFloat(pricing.holiday || pricing.weekday || basePrice)
        }
      }

      await axios.put(`/api/rooms/${params.id}`, roomData)

      toast.success('อัพเดทห้องพักสำเร็จ')
      router.push('/admin/rooms')
    } catch (error) {
      console.error('Error updating room:', error)
      toast.error('ไม่สามารถอัพเดทห้องพักได้')
    } finally {
      setSubmitting(false)
    }
  }

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
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
              รูปภาพห้องพัก * (สามารถอัปโหลดหลายรูป)
            </label>
            <p className="text-sm text-gray-600 mb-4">
              รูปแรกจะเป็นรูปปก (Cover Image) ที่แสดงในรายการห้องพัก
            </p>
            
            {/* File Upload Area */}
            {imageUrls.length === 0 ? (
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600 font-medium">คลิกเพื่อเลือกรูปภาพ</p>
                <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF สูงสุด 10MB/รูป (สามารถเลือกหลายรูป)</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Images Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {imageUrls.map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div className={`relative h-48 w-full rounded-lg overflow-hidden border-2 ${
                        coverImageIndex === index ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'
                      }`}>
                        <Image
                          src={imageUrl}
                          alt={`Preview ${index + 1}`}
                          fill
                          className="object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.jpg'
                          }}
                        />
                        
                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={16} />
                        </button>
                        
                        {/* Cover Image Badge */}
                        {coverImageIndex === index && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-primary-500 text-white text-xs rounded font-medium">
                            รูปปก
                          </div>
                        )}
                        
                        {/* Set Cover Button */}
                        {coverImageIndex !== index && (
                          <button
                            type="button"
                            onClick={() => handleSetCoverImage(index)}
                            className="absolute bottom-2 left-2 px-3 py-1 bg-white bg-opacity-90 text-gray-700 text-xs rounded hover:bg-opacity-100 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            เลือกเป็นรูปปก
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  {selectedFiles.length > 0 && (
                    <button
                      type="button"
                      onClick={handleFileUpload}
                      disabled={uploading}
                      className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Upload size={16} />
                      {uploading ? 'กำลังอัปโหลด...' : `อัปโหลด ${selectedFiles.length} รูป`}
                    </button>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    เพิ่มรูป
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleRemoveAllImages}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} />
                    ลบทั้งหมด
                  </button>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* Cover Image Preview */}
          {imageUrls.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">รูปปกที่เลือก</h3>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-16 rounded-lg overflow-hidden border-2 border-primary-500">
                  <Image
                    src={imageUrls[coverImageIndex]}
                    alt="Cover Image"
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-700">
                    รูปที่ {coverImageIndex + 1} จาก {imageUrls.length} รูป
                  </p>
                  <p className="text-xs text-gray-500">
                    รูปนี้จะแสดงในรายการห้องพัก
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                ราคาพื้นฐาน (บาท) *
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
              <p className="text-xs text-gray-500 mt-1">ราคาพื้นฐาน (สำหรับความเข้ากันได้กับระบบเดิม)</p>
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

          {/* Advanced Pricing */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-4">💰 กำหนดราคาแบบยืดหยุ่น (แนะนำ)</h3>
            <p className="text-sm text-blue-800 mb-4">
              กำหนดราคาที่แตกต่างกันตามประเภทของวัน เพื่อเพิ่มรายได้
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  ราคาวันธรรมดา (จันทร์-พฤหัสบดี) *
                </label>
                <input
                  type="number"
                  value={pricing.weekday}
                  onChange={(e) => setPricing({ ...pricing, weekday: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={price}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  ราคาวันหยุดสุดสัปดาห์ (ศุกร์-อาทิตย์)
                </label>
                <input
                  type="number"
                  value={pricing.weekend}
                  onChange={(e) => setPricing({ ...pricing, weekend: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={pricing.weekday || price}
                />
                <p className="text-xs text-gray-500 mt-1">หากไม่กรอก จะใช้ราคาวันธรรมดา</p>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2 text-sm">
                  ราคาวันหยุดนักขัตฤกษ์
                </label>
                <input
                  type="number"
                  value={pricing.holiday}
                  onChange={(e) => setPricing({ ...pricing, holiday: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder={pricing.weekday || price}
                />
                <p className="text-xs text-gray-500 mt-1">หากไม่กรอก จะใช้ราคาวันธรรมดา</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-white rounded border">
              <p className="text-xs text-gray-600">
                💡 <strong>แนะนำ:</strong> ตั้งราคา weekend สูงกว่า weekday 20-30% และ holiday สูงกว่า weekday 50% เพื่อเพิ่มรายได้
              </p>
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

          {imageUrls.length > 0 && (
            <div>
              <HotspotEditor
                imageUrl={imageUrls[coverImageIndex]}
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

