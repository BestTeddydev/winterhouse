'use client'

import { useRef, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Film, Upload, X } from 'lucide-react'

const ACCEPT = 'video/mp4,video/webm,video/quicktime'
const MAX_BYTES = 200 * 1024 * 1024
const MAX_VIDEOS = 10

/**
 * Uploads a video straight from the browser to storage: the server only hands out a signed URL,
 * so large files never pass through it. Reports progress (0-100) while uploading.
 */
async function uploadVideo(file: File, onProgress: (percent: number) => void): Promise<string> {
  const { data } = await axios.post('/api/upload/video', { fileName: file.name, contentType: file.type, size: file.size })
  await axios.put(data.uploadUrl, file, {
    headers: data.headers,
    onUploadProgress: (e) => e.total && onProgress(Math.round((e.loaded / e.total) * 100)),
  })
  return data.url
}

interface Props {
  value: string[]
  onChange: (urls: string[]) => void
  /** True while a video is uploading (the form shouldn't be saved then) */
  onUploadingChange?: (uploading: boolean) => void
}

/** Video clips of a room: upload (with progress), preview and remove */
export default function VideoListEditor({ value, onChange, onUploadingChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [progress, setProgress] = useState<number | null>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!ACCEPT.split(',').includes(file.type)) return void toast.error('กรุณาเลือกไฟล์วิดีโอ (MP4, WebM หรือ MOV)')
    if (file.size > MAX_BYTES) return void toast.error('ไฟล์วิดีโอมีขนาดใหญ่เกินไป (สูงสุด 200MB)')

    setProgress(0)
    onUploadingChange?.(true)
    try {
      const url = await uploadVideo(file, setProgress)
      onChange([...value, url])
      toast.success('อัปโหลดวิดีโอสำเร็จ')
    } catch (error: any) {
      console.error('Error uploading video:', error)
      toast.error(error.response?.data?.error || 'อัปโหลดวิดีโอไม่สำเร็จ')
    } finally {
      setProgress(null)
      onUploadingChange?.(false)
    }
  }

  const remove = (url: string) => {
    if (window.confirm('ต้องการลบวิดีโอนี้ใช่หรือไม่?')) onChange(value.filter((u) => u !== url))
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {value.map((url, index) => (
            <div key={url} className="relative rounded-lg overflow-hidden border border-gray-200 bg-black">
              <video src={url} controls preload="metadata" playsInline className="w-full aspect-video" />
              <button
                type="button"
                onClick={() => remove(url)}
                aria-label={`ลบวิดีโอที่ ${index + 1}`}
                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {progress !== null ? (
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between text-sm text-gray-700 mb-2">
            <span>กำลังอัปโหลดวิดีโอ...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-primary-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : (
        value.length < MAX_VIDEOS && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-gray-600 hover:border-primary-500 hover:text-primary-600 flex flex-col items-center gap-2 transition-colors"
          >
            {value.length ? <Upload size={28} /> : <Film size={28} />}
            <span className="font-medium">เพิ่มวิดีโอ</span>
            <span className="text-xs text-gray-500">MP4 (แนะนำ), WebM หรือ MOV ไม่เกิน 200MB</span>
          </button>
        )
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
