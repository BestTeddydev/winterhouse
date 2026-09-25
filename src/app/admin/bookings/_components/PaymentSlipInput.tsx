'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { Image as ImageIcon, Upload, X } from 'lucide-react'

const ACCEPT = 'image/jpeg,image/jpg,image/png,image/gif,image/webp'
const MAX_BYTES = 10 * 1024 * 1024

export function validateSlip(file: File): string | null {
  if (!ACCEPT.split(',').includes(file.type)) return 'กรุณาอัปโหลดไฟล์รูปภาพเท่านั้น (JPEG, PNG, GIF, WebP)'
  if (file.size > MAX_BYTES) return 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)'
  return null
}

const formatSize = (bytes: number) =>
  bytes / 1024 / 1024 < 1 ? `${(bytes / 1024).toFixed(2)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`

/** Transfer slip picker with a preview; the file is uploaded when the booking is saved */
export default function PaymentSlipInput({ file, onChange }: { file: File | null; onChange: (file: File | null) => void }) {
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!file) return setPreview(null)
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0]
    e.target.value = ''
    if (!picked) return
    const error = validateSlip(picked)
    if (error) return void toast.error(error)
    onChange(picked)
  }

  if (!file || !preview) {
    return (
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
        <input type="file" id="paymentSlip" accept={ACCEPT} onChange={pick} className="hidden" />
        <label htmlFor="paymentSlip" className="cursor-pointer flex flex-col items-center gap-2">
          <Upload className="text-gray-400" size={32} />
          <span className="text-sm text-gray-600">คลิกเพื่ออัปโหลดรูปภาพสลิปโอนเงิน</span>
          <span className="text-xs text-gray-500">รองรับไฟล์: JPEG, PNG, GIF, WebP (สูงสุด 10MB)</span>
        </label>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-white border border-gray-200">
            <Image src={preview} alt="Payment slip preview" fill className="object-cover" unoptimized />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 mb-1">{file.name}</p>
            <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="ลบรูปภาพ"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="mt-2">
        <label
          htmlFor="paymentSlipChange"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm text-primary-600 hover:text-primary-700 cursor-pointer border border-primary-300 rounded-lg hover:bg-primary-50 transition-colors"
        >
          <ImageIcon size={16} />
          เปลี่ยนรูปภาพ
        </label>
        <input type="file" id="paymentSlipChange" accept={ACCEPT} onChange={pick} className="hidden" />
      </div>
    </div>
  )
}
