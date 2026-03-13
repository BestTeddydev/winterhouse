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
  const [seasonalPricing, setSeasonalPricing] = useState<Array<{
    name: string
    startMonth: number
    endMonth: number
    weekday: string
    weekend: string
    holiday: string
  }>>([])
  const [capacity, setCapacity] = useState('')
  const [amenities, setAmenities] = useState<string[]>([])
  const [amenityInput, setAmenityInput] = useState('')
  const [hotspots, setHotspots] = useState<any[]>([])
  const [isActive, setIsActive] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [removingImages, setRemovingImages] = useState(false)
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
      
      // Handle multiple images - filter out empty or invalid URLs
      if (room.imageUrls && room.imageUrls.length > 0) {
        const validUrls = room.imageUrls.filter((url: string) => url && url.trim() !== '' && !url.includes('placeholder'))
        if (validUrls.length > 0) {
          setImageUrls(validUrls)
          // Find cover image index
          const coverIndex = validUrls.findIndex((url: string) => url === room.imageUrl)
          setCoverImageIndex(coverIndex >= 0 ? coverIndex : 0)
        } else {
          setImageUrls([])
          setCoverImageIndex(0)
        }
      } else if (room.imageUrl && room.imageUrl.trim() !== '' && !room.imageUrl.includes('placeholder')) {
        // Fallback to single image
        setImageUrls([room.imageUrl])
        setCoverImageIndex(0)
      } else {
        setImageUrls([])
        setCoverImageIndex(0)
      }
      
      setPrice(room.price || room.pricing?.weekday || '')
      setCapacity(room.capacity.toString())
      setPricing({
        weekday: room.pricing?.weekday?.toString() || room.price?.toString() || '',
        weekend: room.pricing?.weekend?.toString() || '',
        holiday: room.pricing?.holiday?.toString() || ''
      })
      
      // Load seasonal pricing if exists
      if (room.seasonalPricing && Array.isArray(room.seasonalPricing) && room.seasonalPricing.length > 0) {
        setSeasonalPricing(room.seasonalPricing.map((season: any) => ({
          name: season.name || '',
          startMonth: season.startMonth || 1,
          endMonth: season.endMonth || 3,
          weekday: season.weekday?.toString() || '',
          weekend: season.weekend?.toString() || '',
          holiday: season.holiday?.toString() || ''
        })))
      }
      
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
      
      // Separate existing URLs (non-blob) from preview URLs (blob)
      const existingUrls = imageUrls.filter(url => url && !url.startsWith('blob:') && url.trim() !== '')
      
      // Clean up all blob preview URLs before updating state
      imageUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
      
      // Combine existing URLs with newly uploaded URLs
      const newImageUrls = [...existingUrls, ...uploadedUrls]
      setImageUrls(newImageUrls)
      setSelectedFiles([])
      
      // Update cover image if needed
      if (newImageUrls.length > 0 && coverImageIndex >= existingUrls.length) {
        // If cover was a blob preview that we removed, set to last uploaded image
        setCoverImageIndex(newImageUrls.length - 1)
        setImageUrl(newImageUrls[newImageUrls.length - 1])
      } else if (newImageUrls.length > 0 && (coverImageIndex < 0 || !imageUrl || imageUrl.startsWith('blob:'))) {
        // If cover is invalid or missing, set to first existing image or last uploaded
        const validCoverIndex = existingUrls.length > 0 ? 0 : newImageUrls.length - 1
        setCoverImageIndex(validCoverIndex)
        setImageUrl(newImageUrls[validCoverIndex])
      }
      
      toast.success(`อัปโหลดรูปภาพ ${uploadedUrls.length} รูปสำเร็จ`)
      
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('ไม่สามารถอัปโหลดรูปภาพได้')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveImage = (index: number) => {
    if (index < 0 || index >= imageUrls.length) return
    
    const urlToRemove = imageUrls[index]
    
    // Clean up preview URL if it's a blob
    if (urlToRemove && urlToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRemove)
    }
    
    // Remove from arrays and filter out any empty/invalid URLs
    const newImageUrls = imageUrls
      .filter((_, i) => i !== index)
      .filter(url => url && url.trim() !== '' && !url.includes('placeholder'))
    
    setImageUrls(newImageUrls)
    
    // Adjust cover image index if needed
    if (newImageUrls.length === 0) {
      setCoverImageIndex(0)
      setImageUrl('')
    } else if (coverImageIndex === index) {
      // If we removed the cover image, set new cover (prefer existing, then last uploaded)
      const newCoverIndex = Math.max(0, Math.min(coverImageIndex, newImageUrls.length - 1))
      setCoverImageIndex(newCoverIndex)
      setImageUrl(newImageUrls[newCoverIndex] || '')
    } else if (coverImageIndex > index) {
      // Adjust index if we removed an image before the cover
      setCoverImageIndex(coverImageIndex - 1)
      setImageUrl(newImageUrls[coverImageIndex - 1] || '')
    } else {
      // Keep current cover but update imageUrl to ensure it's valid
      if (newImageUrls[coverImageIndex]) {
        setImageUrl(newImageUrls[coverImageIndex])
      }
    }
  }

  const handleSetCoverImage = (index: number) => {
    if (index < 0 || index >= imageUrls.length) {
      console.error('Invalid cover image index:', index)
      return
    }
    
    const selectedUrl = imageUrls[index]
    if (!selectedUrl || selectedUrl.trim() === '' || selectedUrl.startsWith('blob:')) {
      toast.error('กรุณาอัปโหลดรูปภาพก่อนเลือกเป็นรูปปก')
      return
    }
    
    setCoverImageIndex(index)
    setImageUrl(selectedUrl)
  }

  const handleRemoveAllImages = async () => {
    // Ask for confirmation
    const confirm = window.confirm('คุณแน่ใจหรือไม่ที่จะลบรูปภาพทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้')
    if (!confirm) return

    setRemovingImages(true)

    try {
      // Clean up all preview URLs
      imageUrls.forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url)
        }
      })
      
      // Update state immediately for better UX
      setSelectedFiles([])
      setImageUrls([])
      setImageUrl('')
      setCoverImageIndex(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

      // Update database by sending empty imageUrls array
      await axios.put(`/api/rooms/${params.id}`, {
        name,
        description,
        imageUrl: '',
        imageUrls: [],
        price: parseFloat(price),
        capacity: parseInt(capacity),
        amenities,
        hotspots,
        isActive,
        pricing: pricing.weekday || pricing.weekend || pricing.holiday ? {
          weekday: parseFloat(pricing.weekday || price),
          weekend: parseFloat(pricing.weekend || pricing.weekday || price),
          holiday: parseFloat(pricing.holiday || pricing.weekday || price)
        } : undefined
      })

      toast.success('ลบรูปภาพทั้งหมดสำเร็จ')
    } catch (error: any) {
      console.error('Error removing all images:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถลบรูปภาพได้')
      
      // Re-fetch room data on error to restore state
      try {
        await fetchRoom()
      } catch (fetchError) {
        console.error('Error fetching room after failed delete:', fetchError)
      }
    } finally {
      setRemovingImages(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !description || !price || !capacity) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    // Allow empty imageUrls if user intentionally deleted all images
    // This will update the database to have empty imageUrls array
    if (imageUrls.length === 0 && selectedFiles.length === 0) {
      // Check if user is trying to delete all images - allow this
      const confirmDelete = window.confirm('คุณแน่ใจหรือไม่ที่จะลบรูปภาพทั้งหมด? หากบันทึก ห้องพักนี้จะไม่มีรูปภาพ')
      if (!confirmDelete) {
        return
      }
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
        price: parseFloat(price),
        capacity: parseInt(capacity),
        amenities,
        hotspots,
        isActive,
      }

      // Handle image URLs - only set if there are images
      if (imageUrls.length > 0 && imageUrls[coverImageIndex]) {
        roomData.imageUrl = imageUrls[coverImageIndex] // รูปปก
        roomData.imageUrls = imageUrls.filter(url => url && url.trim() !== '') // รูปทั้งหมด (filter out empty strings)
      } else {
        // If no images, set empty arrays
        roomData.imageUrl = ''
        roomData.imageUrls = []
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

      // Add seasonal pricing if provided
      if (seasonalPricing.length > 0) {
        const basePrice = pricing.weekday || price
        roomData.seasonalPricing = seasonalPricing
          .filter(season => season.name && season.weekday) // Only include valid seasons
          .map(season => ({
            name: season.name,
            startMonth: season.startMonth,
            endMonth: season.endMonth,
            weekday: parseFloat(season.weekday || basePrice),
            weekend: parseFloat(season.weekend || season.weekday || basePrice),
            holiday: parseFloat(season.holiday || season.weekday || basePrice)
          }))
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
                        {imageUrl && imageUrl.trim() !== '' ? (
                          <Image
                            src={imageUrl}
                            alt={`Preview ${index + 1}`}
                            fill
                            className="object-cover"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement
                              if (target.src && !target.src.includes('placeholder')) {
                                target.src = '/placeholder.jpg'
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                            <ImageIcon className="text-gray-400" size={48} />
                          </div>
                        )}
                        
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
                        
                        {/* Set Cover Button - Only show for uploaded images (not blob previews) */}
                        {coverImageIndex !== index && imageUrls[index] && !imageUrls[index].startsWith('blob:') && imageUrls[index].trim() !== '' ? (
                          <button
                            type="button"
                            onClick={() => handleSetCoverImage(index)}
                            className="absolute bottom-2 left-2 px-3 py-1 bg-white bg-opacity-90 text-gray-700 text-xs rounded hover:bg-opacity-100 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            เลือกเป็นรูปปก
                          </button>
                        ) : coverImageIndex !== index && imageUrls[index] && imageUrls[index].startsWith('blob:') ? (
                          <div className="absolute bottom-2 left-2 px-3 py-1 bg-yellow-500 bg-opacity-90 text-white text-xs rounded font-medium opacity-0 group-hover:opacity-100">
                            ยังไม่ได้อัปโหลด
                          </div>
                        ) : null}
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
                    disabled={removingImages || imageUrls.length === 0}
                    className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={16} />
                    {removingImages ? 'กำลังลบ...' : 'ลบทั้งหมด'}
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
          {imageUrls.length > 0 && imageUrls[coverImageIndex] && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-3">รูปปกที่เลือก</h3>
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-16 rounded-lg overflow-hidden border-2 border-primary-500">
                  {imageUrls[coverImageIndex] && imageUrls[coverImageIndex].trim() !== '' ? (
                    <Image
                      src={imageUrls[coverImageIndex]}
                      alt="Cover Image"
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement
                        if (target.src && !target.src.includes('placeholder')) {
                          target.src = '/placeholder.jpg'
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <ImageIcon className="text-gray-400" size={24} />
                    </div>
                  )}
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

          {/* Seasonal Pricing */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-green-900">📅 กำหนดราคาตามช่วงเวลา (Seasonal Pricing)</h3>
                <p className="text-sm text-green-800 mt-1">
                  กำหนดราคาพิเศษสำหรับช่วงเวลาที่กำหนด เช่น เดือน 1-3 (มกราคม-มีนาคม)
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSeasonalPricing([...seasonalPricing, {
                    name: '',
                    startMonth: 1,
                    endMonth: 3,
                    weekday: '',
                    weekend: '',
                    holiday: ''
                  }])
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
              >
                <Plus size={16} />
                เพิ่มช่วงเวลา
              </button>
            </div>

            {seasonalPricing.length > 0 && (
              <div className="space-y-4">
                {seasonalPricing.map((season, index) => (
                  <div key={index} className="bg-white rounded-lg border border-green-300 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">ช่วงเวลา #{index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => {
                          setSeasonalPricing(seasonalPricing.filter((_, i) => i !== index))
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="block text-gray-700 font-medium mb-1 text-sm">
                          ชื่อช่วงเวลา *
                        </label>
                        <input
                          type="text"
                          value={season.name}
                          onChange={(e) => {
                            const updated = [...seasonalPricing]
                            updated[index].name = e.target.value
                            setSeasonalPricing(updated)
                          }}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          placeholder="เช่น ช่วงฤดูหนาว"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-gray-700 font-medium mb-1 text-sm">
                            เดือนเริ่มต้น *
                          </label>
                          <select
                            value={season.startMonth}
                            onChange={(e) => {
                              const updated = [...seasonalPricing]
                              updated[index].startMonth = parseInt(e.target.value)
                              setSeasonalPricing(updated)
                            }}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <option key={month} value={month}>
                                {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'][month - 1]}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-gray-700 font-medium mb-1 text-sm">
                            เดือนสิ้นสุด *
                          </label>
                          <select
                            value={season.endMonth}
                            onChange={(e) => {
                              const updated = [...seasonalPricing]
                              updated[index].endMonth = parseInt(e.target.value)
                              setSeasonalPricing(updated)
                            }}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          >
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <option key={month} value={month}>
                                {['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'][month - 1]}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-gray-700 font-medium mb-1 text-sm">
                          ราคาวันธรรมดา *
                        </label>
                        <input
                          type="number"
                          value={season.weekday}
                          onChange={(e) => {
                            const updated = [...seasonalPricing]
                            updated[index].weekday = e.target.value
                            setSeasonalPricing(updated)
                          }}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          placeholder={pricing.weekday || price || "1000"}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-medium mb-1 text-sm">
                          ราคาวันหยุดสุดสัปดาห์
                        </label>
                        <input
                          type="number"
                          value={season.weekend}
                          onChange={(e) => {
                            const updated = [...seasonalPricing]
                            updated[index].weekend = e.target.value
                            setSeasonalPricing(updated)
                          }}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          placeholder={season.weekday || pricing.weekend || pricing.weekday || price || "1200"}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 font-medium mb-1 text-sm">
                          ราคาวันหยุดนักขัตฤกษ์
                        </label>
                        <input
                          type="number"
                          value={season.holiday}
                          onChange={(e) => {
                            const updated = [...seasonalPricing]
                            updated[index].holiday = e.target.value
                            setSeasonalPricing(updated)
                          }}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                          placeholder={season.weekday || pricing.holiday || pricing.weekday || price || "1500"}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {seasonalPricing.length === 0 && (
              <p className="text-sm text-green-700 text-center py-4">
                ยังไม่มีการกำหนดราคาตามช่วงเวลา คลิก "เพิ่มช่วงเวลา" เพื่อเพิ่ม
              </p>
            )}
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

