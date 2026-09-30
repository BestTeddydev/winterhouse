import Image from 'next/image'
import { Play } from 'lucide-react'
import { roomMedia } from '../_lib/stay'
import type { Room } from '../_lib/types'

const SHOWN = 5

/** Small photo/video previews of a room; clicking one opens the gallery at it */
export default function RoomMediaThumbs({ room, onOpen }: { room: Room; onOpen: (index: number) => void }) {
  const media = roomMedia(room)
  return (
    <div className="flex gap-2 overflow-x-auto">
      {media.slice(0, SHOWN).map((item, index) => (
        <button
          type="button"
          key={item.url}
          aria-label={item.type === 'video' ? `วิดีโอ ${room.name}` : `รูป ${room.name} ${index + 1}`}
          className="relative w-16 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 hover:opacity-80 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            onOpen(index)
          }}
        >
          {item.type === 'video' ? (
            <>
              {/* #t=0.1 makes browsers show a frame of the clip instead of a blank box */}
              <video src={`${item.url}#t=0.1`} preload="metadata" muted playsInline className="w-full h-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/30">
                <Play size={18} className="text-white fill-white" />
              </span>
            </>
          ) : (
            <Image src={item.url} alt="" width={64} height={48} className="w-full h-full object-cover" />
          )}
        </button>
      ))}
      {media.length > SHOWN && (
        <button
          type="button"
          className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-600 flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onOpen(SHOWN)
          }}
        >
          +{media.length - SHOWN}
        </button>
      )}
    </div>
  )
}
