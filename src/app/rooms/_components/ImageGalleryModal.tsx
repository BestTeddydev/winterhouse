import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import type { RoomMedia } from '../_lib/stay'

interface Props {
  media: RoomMedia[]
  index: number
  onClose: () => void
  onIndexChange: (index: number) => void
}

/** Full-screen viewer for a room's photos and video clips, with previous/next */
export default function ImageGalleryModal({ media, index, onClose, onIndexChange }: Props) {
  const item = media[index]
  if (!item) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl max-h-full">
        <button onClick={onClose} aria-label="ปิด" className="absolute top-4 right-4 text-white hover:text-gray-300 z-10">
          <X size={24} />
        </button>

        <div className="relative">
          {item.type === 'video' ? (
            // key: switching between clips starts the new one from the beginning
            <video key={item.url} src={item.url} controls autoPlay playsInline className="max-w-full max-h-[80vh] rounded-lg bg-black" />
          ) : (
            <Image
              src={item.url}
              alt={`Gallery image ${index + 1}`}
              width={800}
              height={600}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          )}

          {media.length > 1 && (
            <>
              <button
                onClick={() => onIndexChange(Math.max(index - 1, 0))}
                aria-label="ก่อนหน้า"
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                disabled={index === 0}
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={() => onIndexChange(Math.min(index + 1, media.length - 1))}
                aria-label="ถัดไป"
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                disabled={index === media.length - 1}
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
        </div>

        <div className="text-center mt-4 text-white">
          <p>
            {index + 1} / {media.length}
          </p>
        </div>
      </div>
    </div>
  )
}
