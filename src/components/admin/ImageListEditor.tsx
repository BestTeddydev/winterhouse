'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { Image as ImageIcon, Plus, Trash2, Upload, X } from 'lucide-react'
import { isPending } from './imageList'
import type { ImageListController } from './useImageList'

interface Props {
  images: ImageListController
  /** Ask before removing every image */
  confirmClear?: boolean
}

/** Upload area and grid of images with cover selection (admin forms) */
export default function ImageListEditor({ images, confirmClear = false }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { items, cover, pendingCount, uploading } = images

  const pickFiles = () => fileInputRef.current?.click()
  const fileInput = (
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
  )

  const clearAll = () => {
    if (confirmClear && !window.confirm('คุณแน่ใจหรือไม่ที่จะลบรูปภาพทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้')) return
    images.clear()
  }

  if (items.length === 0) {
    return (
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onClick={pickFiles}
      >
        {fileInput}
        <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600 font-medium">คลิกเพื่อเลือกรูปภาพ</p>
        <p className="text-sm text-gray-500 mt-1">PNG, JPG, GIF สูงสุด 10MB/รูป (สามารถเลือกหลายรูป)</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, index) => (
          <div key={item.url} className="relative group">
            <div
              className={`relative h-48 w-full rounded-lg overflow-hidden border-2 ${
                cover === index ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'
              }`}
            >
              <Image src={item.url} alt={`Preview ${index + 1}`} fill className="object-cover" />

              <button
                type="button"
                onClick={() => images.remove(index)}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <X size={16} />
              </button>

              {cover === index ? (
                <div className="absolute top-2 left-2 px-2 py-1 bg-primary-500 text-white text-xs rounded font-medium">รูปปก</div>
              ) : (
                <button
                  type="button"
                  onClick={() => images.setCover(index)}
                  className="absolute bottom-2 left-2 px-3 py-1 bg-white bg-opacity-90 text-gray-700 text-xs rounded hover:bg-opacity-100 transition-colors opacity-0 group-hover:opacity-100"
                >
                  เลือกเป็นรูปปก
                </button>
              )}
              {isPending(item) && (
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-yellow-500 bg-opacity-90 text-white text-xs rounded font-medium">
                  ยังไม่ได้อัปโหลด
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        {pendingCount > 0 && (
          <button
            type="button"
            onClick={() => images.uploadPending().catch(() => {})}
            disabled={uploading}
            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Upload size={16} />
            {uploading ? 'กำลังอัปโหลด...' : `อัปโหลด ${pendingCount} รูป`}
          </button>
        )}

        <button
          type="button"
          onClick={pickFiles}
          className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <Plus size={16} />
          เพิ่มรูป
        </button>

        <button
          type="button"
          onClick={clearAll}
          className="px-4 py-2 border border-red-300 text-red-600 rounded-lg font-medium hover:bg-red-50 transition-colors flex items-center gap-2"
        >
          <Trash2 size={16} />
          ลบทั้งหมด
        </button>
      </div>

      {fileInput}
    </div>
  )
}
