import Image from 'next/image'

/** Small preview of the chosen cover image */
export default function CoverImagePreview({ url, index, total, note }: { url?: string; index: number; total: number; note: string }) {
  if (!url) return null
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h3 className="font-semibold text-gray-900 mb-3">รูปปกที่เลือก</h3>
      <div className="flex items-center gap-4">
        <div className="relative w-24 h-16 rounded-lg overflow-hidden border-2 border-primary-500">
          <Image src={url} alt="Cover Image" fill className="object-cover" />
        </div>
        <div>
          <p className="text-sm text-gray-700">
            รูปที่ {index + 1} จาก {total} รูป
          </p>
          <p className="text-xs text-gray-500">{note}</p>
        </div>
      </div>
    </div>
  )
}
