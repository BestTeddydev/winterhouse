'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowLeft, Upload, X, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function NewCampingBlock() {
  const router = useRouter()
  const { data: session } = useSession()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrls, setImageUrls] = useState<string[]>([])
  const [coverImageIndex, setCoverImageIndex] = useState(0)
  const [pricePerPerson, setPricePerPerson] = useState('')
  const [maxCapacity, setMaxCapacity] = useState('')
  const [minCapacity, setMinCapacity] = useState('1')
  const [amenities, setAmenities] = useState<string[]>([])
  const [amenityInput, setAmenityInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
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
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

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
      setImageUrls(uploadedUrls)
      setSelectedFiles([])
      
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
    
    if (urlToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRemove)
    }
    
    const newImageUrls = imageUrls.filter((_, i) => i !== index)
    const newSelectedFiles = selectedFiles.filter((_, i) => i !== index)
    
    setImageUrls(newImageUrls)
    setSelectedFiles(newSelectedFiles)
    
    if (coverImageIndex >= newImageUrls.length) {
      setCoverImageIndex(Math.max(0, newImageUrls.length - 1))
    } else if (coverImageIndex > index) {
      setCoverImageIndex(coverImageIndex - 1)
    }
  }

  const handleSetCoverImage = (index: number) => {
    setCoverImageIndex(index)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !description || !pricePerPerson || !maxCapacity) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    if (parseInt(minCapacity) > parseInt(maxCapacity)) {
      toast.error('จำนวนคนขั้นต่ำต้องไม่มากกว่าจำนวนคนสูงสุด')
      return
    }

    if (imageUrls.length === 0) {
      toast.error('กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป')
      return
    }

    if (selectedFiles.length > 0) {
      await handleFileUpload()
      if (selectedFiles.length > 0) {
        toast.error('กรุณาอัปโหลดรูปภาพก่อนบันทึก')
        return
      }
    }

    setSubmitting(true)

    try {
      const blockData = {
        name,
        description,
        imageUrls,
        pricePerPerson: parseFloat(pricePerPerson),
        maxCapacity: parseInt(maxCapacity),
        minCapacity: parseInt(minCapacity) || 1,
        amenities,
      }

      await axios.post('/api/camping-blocks', blockData)
      toast.success('สร้างบล็อคกางเต๊นท์สำเร็จ')
      router.push('/admin/camping-blocks')
    } catch (error: any) {
      console.error('Error creating camping block:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถสร้างบล็อคกางเต๊นท์ได้')
    } finally {
      setSubmitting(false)
    }
  }

  if (session === undefined) {
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
        <Link
          href="/admin/camping-blocks"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold mb-6"
        >
          <ArrowLeft size={20} />
          กลับไปหน้ารายการบล็อคกางเต๊นท์
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">เพิ่มบล็อคกางเต๊นท์ใหม่</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">ข้อมูลพื้นฐาน</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ชื่อบล็อคกางเต๊นท์ <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  คำอธิบาย <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Pricing & Capacity */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">ราคาและความจุ</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ราคาต่อคน (บาท) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={pricePerPerson}
                    onChange={(e) => setPricePerPerson(e.target.value)}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    จำนวนคนขั้นต่ำ
                  </label>
                  <input
                    type="number"
                    value={minCapacity}
                    onChange={(e) => setMinCapacity(e.target.value)}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    จำนวนคนสูงสุด <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(e.target.value)}
                    min="1"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Images */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">รูปภาพ</h2>
              
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
                >
                  <Upload size={18} />
                  เลือกรูปภาพ
                </button>
              </div>

              {selectedFiles.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-sm text-yellow-800 mb-2">
                    มีรูปภาพ {selectedFiles.length} รูปที่ยังไม่ได้อัปโหลด
                  </p>
                  <button
                    type="button"
                    onClick={handleFileUpload}
                    disabled={uploading}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Upload size={18} />
                    {uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพ'}
                  </button>
                </div>
              )}

              {imageUrls.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <div className="relative h-32 w-full rounded-lg overflow-hidden border-2 border-gray-200">
                        <Image
                          src={url}
                          alt={`Image ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                        {coverImageIndex === index && (
                          <div className="absolute top-1 left-1 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                            รูปปก
                          </div>
                        )}
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleSetCoverImage(index)}
                          className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700"
                        >
                          ตั้งเป็นรูปปก
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Amenities */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">สิ่งอำนวยความสะดวก</h2>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={amenityInput}
                  onChange={(e) => setAmenityInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddAmenity()
                    }
                  }}
                  placeholder="เพิ่มสิ่งอำนวยความสะดวก"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleAddAmenity}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                >
                  <Plus size={18} />
                  เพิ่ม
                </button>
              </div>

              {amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {amenities.map((amenity, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-2"
                    >
                      {amenity}
                      <button
                        type="button"
                        onClick={() => handleRemoveAmenity(index)}
                        className="text-primary-700 hover:text-primary-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 font-semibold"
              >
                {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
              <Link
                href="/admin/camping-blocks"
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                ยกเลิก
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}

