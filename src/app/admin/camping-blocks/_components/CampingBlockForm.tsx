'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Plus, Upload, X } from 'lucide-react'
import { useImageList } from '@/components/admin/useImageList'

export interface CampingBlockFormValues {
  name: string
  description: string
  pricePerPerson: string
  minCapacity: string
  maxCapacity: string
  amenities: string[]
  isActive: boolean
}

export const EMPTY_CAMPING_BLOCK: CampingBlockFormValues = {
  name: '',
  description: '',
  pricePerPerson: '',
  minCapacity: '1',
  maxCapacity: '',
  amenities: [],
  isActive: true,
}

export function campingBlockToFormValues(block: any): CampingBlockFormValues {
  return {
    name: block.name ?? '',
    description: block.description ?? '',
    pricePerPerson: block.pricePerPerson?.toString() ?? '',
    minCapacity: block.minCapacity?.toString() ?? '1',
    maxCapacity: block.maxCapacity?.toString() ?? '',
    amenities: block.amenities ?? [],
    isActive: block.isActive ?? true,
  }
}

interface Props {
  mode: 'create' | 'edit'
  initialValues: CampingBlockFormValues
  initialImageUrls?: string[]
  onSubmit: (payload: Record<string, unknown>) => Promise<void>
}

/** Camping block create/edit form */
export default function CampingBlockForm({ mode, initialValues, initialImageUrls, onSubmit }: Props) {
  const [values, setValues] = useState(initialValues)
  const [amenityInput, setAmenityInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const images = useImageList(initialImageUrls)
  const set = <K extends keyof CampingBlockFormValues>(key: K, value: CampingBlockFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }))

  const handleAddAmenity = () => {
    if (!amenityInput.trim()) return
    set('amenities', [...values.amenities, amenityInput.trim()])
    setAmenityInput('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (mode === 'create' && images.items.length === 0) return void toast.error('กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป')

    setSubmitting(true)
    try {
      const { urls, cover } = await images.uploadPending()
      await onSubmit({
        name: values.name,
        description: values.description,
        // The first image is the cover everywhere
        imageUrls: cover ? [cover, ...urls.filter((u) => u !== cover)] : urls,
        pricePerPerson: parseFloat(values.pricePerPerson),
        maxCapacity: parseInt(values.maxCapacity),
        minCapacity: parseInt(values.minCapacity) || 1,
        amenities: values.amenities,
        ...(mode === 'edit' && { isActive: values.isActive }),
      })
    } catch (error: any) {
      toast.error(
        error.response?.data?.error || (mode === 'edit' ? 'ไม่สามารถอัปเดตบล็อคกางเต๊นท์ได้' : 'ไม่สามารถสร้างบล็อคกางเต๊นท์ได้')
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
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
              value={values.name}
              onChange={(e) => set('name', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              คำอธิบาย <span className="text-red-500">*</span>
            </label>
            <textarea
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
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
                value={values.pricePerPerson}
                onChange={(e) => set('pricePerPerson', e.target.value)}
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
                value={values.minCapacity}
                onChange={(e) => set('minCapacity', e.target.value)}
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
                value={values.maxCapacity}
                onChange={(e) => set('maxCapacity', e.target.value)}
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
              onChange={(e) => {
                images.addFiles(Array.from(e.target.files || []))
                e.target.value = ''
              }}
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

          {images.pendingCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 mb-2">
                มีรูปภาพ {images.pendingCount} รูปที่ยังไม่ได้อัปโหลด
              </p>
              <button
                type="button"
                onClick={() => images.uploadPending().catch(() => toast.error('ไม่สามารถอัปโหลดรูปภาพได้'))}
                disabled={images.uploading}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Upload size={18} />
                {images.uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพ'}
              </button>
            </div>
          )}

          {images.items.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.items.map(({ url }, index) => (
                <div key={url} className="relative group">
                  <div className="relative h-32 w-full rounded-lg overflow-hidden border-2 border-gray-200">
                    <Image
                      src={url}
                      alt={`Image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    {images.cover === index && (
                      <div className="absolute top-1 left-1 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                        รูปปก
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => images.setCover(index)}
                      className="opacity-0 group-hover:opacity-100 px-2 py-1 bg-primary-600 text-white text-xs rounded hover:bg-primary-700"
                    >
                      ตั้งเป็นรูปปก
                    </button>
                    <button
                      type="button"
                      onClick={() => images.remove(index)}
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
              onKeyDown={(e) => {
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

          {values.amenities.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {values.amenities.map((amenity, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm flex items-center gap-2"
                >
                  {amenity}
                  <button
                    type="button"
                    onClick={() => set('amenities', values.amenities.filter((_, i) => i !== index))}
                    className="text-primary-700 hover:text-primary-900"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        {mode === 'edit' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">สถานะ</h2>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={values.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                เปิดใช้งานบล็อคกางเต๊นท์นี้
              </label>
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={submitting || images.uploading}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2 font-semibold"
          >
            {submitting ? 'กำลังบันทึก...' : mode === 'edit' ? 'บันทึกการเปลี่ยนแปลง' : 'บันทึก'}
          </button>
          <Link
            href="/admin/camping-blocks"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            ยกเลิก
          </Link>
        </div>
    </form>
  )
}
