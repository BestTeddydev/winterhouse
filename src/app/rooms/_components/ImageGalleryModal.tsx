import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface Props {
  images: string[]
  index: number
  onClose: () => void
  onIndexChange: (index: number) => void
}

/** Full-screen image viewer with previous/next */
export default function ImageGalleryModal({ images, index, onClose, onIndexChange }: Props) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl max-h-full">
        <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300 z-10">
          <X size={24} />
        </button>

        <div className="relative">
          <Image
            src={images[index]}
            alt={`Gallery image ${index + 1}`}
            width={800}
            height={600}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
          />

          {images.length > 1 && (
            <>
              <button
                onClick={() => onIndexChange(Math.max(index - 1, 0))}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                disabled={index === 0}
              >
                <ChevronLeft size={32} />
              </button>
              <button
                onClick={() => onIndexChange(Math.min(index + 1, images.length - 1))}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300"
                disabled={index === images.length - 1}
              >
                <ChevronRight size={32} />
              </button>
            </>
          )}
        </div>

        <div className="text-center mt-4 text-white">
          <p>
            {index + 1} / {images.length}
          </p>
        </div>
      </div>
    </div>
  )
}
