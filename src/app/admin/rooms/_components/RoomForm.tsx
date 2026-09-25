'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import HotspotEditor from '@/components/HotspotEditor'
import AmenitiesInput from '@/components/admin/AmenitiesInput'
import CoverImagePreview from '@/components/admin/CoverImagePreview'
import ImageListEditor from '@/components/admin/ImageListEditor'
import { useImageList } from '@/components/admin/useImageList'
import { roomPayload, validateRoomForm, type RoomFormValues } from '../_lib/roomForm'
import RoomPricingFields from './RoomPricingFields'
import SeasonalPricingEditor from './SeasonalPricingEditor'

interface Props {
  mode: 'create' | 'edit'
  initialValues: RoomFormValues
  initialImages?: { urls: string[]; cover?: string }
  /** Saves the room; resolves when done (the page navigates away) */
  onSubmit: (payload: ReturnType<typeof roomPayload>) => Promise<void>
}

/** Room create/edit form: details, images, prices, seasons, amenities (and status/hotspots when editing) */
export default function RoomForm({ mode, initialValues, initialImages, onSubmit }: Props) {
  const [values, setValues] = useState(initialValues)
  const [submitting, setSubmitting] = useState(false)
  const images = useImageList(initialImages?.urls, initialImages?.cover)
  const set = <K extends keyof RoomFormValues>(key: K, value: RoomFormValues[K]) => setValues((v) => ({ ...v, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const error = validateRoomForm(values)
    if (error) return void toast.error(error)

    if (images.items.length === 0) {
      if (mode === 'create') return void toast.error('กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป')
      if (!window.confirm('คุณแน่ใจหรือไม่ที่จะลบรูปภาพทั้งหมด? หากบันทึก ห้องพักนี้จะไม่มีรูปภาพ')) return
    }

    setSubmitting(true)
    try {
      // Pending images are uploaded as part of saving
      const uploaded = await images.uploadPending()
      await onSubmit(roomPayload(values, uploaded))
    } catch {
      toast.error(mode === 'create' ? 'ไม่สามารถเพิ่มห้องพักได้' : 'ไม่สามารถอัพเดทห้องพักได้')
    } finally {
      setSubmitting(false)
    }
  }

  const coverUrl = images.items[images.cover]?.url

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div>
        <label className="block text-gray-700 font-medium mb-2">ชื่อห้อง *</label>
        <input
          type="text"
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          required
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="เช่น Deluxe Room"
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">คำอธิบาย *</label>
        <textarea
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          required
          rows={4}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="คำอธิบายห้องพัก"
        />
      </div>

      <div>
        <label className="block text-gray-700 font-medium mb-2">รูปภาพห้องพัก * (สามารถอัปโหลดหลายรูป)</label>
        <p className="text-sm text-gray-600 mb-4">รูปแรกจะเป็นรูปปก (Cover Image) ที่แสดงในรายการห้องพัก</p>
        <ImageListEditor images={images} confirmClear={mode === 'edit'} />
      </div>

      <CoverImagePreview url={coverUrl} index={images.cover} total={images.items.length} note="รูปนี้จะแสดงในรายการห้องพัก" />

      <RoomPricingFields value={values} onChange={(v) => setValues((current) => ({ ...current, ...v }))} />

      <SeasonalPricingEditor
        value={values.seasonalPricing}
        onChange={(seasons) => set('seasonalPricing', seasons)}
        basePrice={values.price}
        pricing={values.pricing}
      />

      {mode === 'edit' && (
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(e) => set('isActive', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-gray-700 font-medium">เปิดใช้งาน</span>
          </label>
        </div>
      )}

      <AmenitiesInput value={values.amenities} onChange={(amenities) => set('amenities', amenities)} />

      {mode === 'edit' && coverUrl && (
        <div>
          <HotspotEditor imageUrl={coverUrl} hotspots={values.hotspots} onChange={(hotspots) => set('hotspots', hotspots)} />
        </div>
      )}

      {mode === 'create' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 หมายเหตุ</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• ห้องพักจะถูกสร้างโดยไม่ผูกกับอาคาร</li>
            <li>• สามารถผูกห้องพักกับอาคารได้ในหน้า "จัดการแผนผัง"</li>
            <li>• สามารถอัปโหลดรูปภาพหลายรูปสำหรับห้องพักเดียว</li>
            <li>• รูปปกจะแสดงในรายการห้องพักและเป็นรูปหลักของห้องพัก</li>
          </ul>
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={submitting || images.uploading}
          className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {submitting ? 'กำลังบันทึก...' : mode === 'create' ? `บันทึกห้องพัก (${images.items.length} รูป)` : 'บันทึกการแก้ไข'}
        </button>
        <Link
          href="/admin/rooms"
          className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          ยกเลิก
        </Link>
      </div>
    </form>
  )
}
