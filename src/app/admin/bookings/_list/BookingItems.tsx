import Image from 'next/image'
import { MapPin, Tent } from 'lucide-react'
import { campingSummary, roomImage, roomNames } from '@/lib/bookingDisplay'

/** Rooms (with a thumbnail) and camping blocks of a booking */
export default function BookingItems({ booking, compact = false }: { booking: any; compact?: boolean }) {
  const rooms = roomNames(booking)
  const camping = campingSummary(booking)
  const image = roomImage(booking)
  const thumb = compact ? 'w-10 h-10 sm:w-12 sm:h-12' : 'w-12 h-12'
  const row = compact ? 'flex items-center gap-2 sm:gap-3' : 'flex items-center gap-3'
  const name = compact ? 'text-xs sm:text-sm font-medium text-gray-900 flex items-center gap-1' : 'text-sm font-medium text-gray-900 flex items-center gap-1'
  const smallIcon = compact ? 'w-3 h-3 sm:w-3.5 sm:h-3.5' : 'w-3.5 h-3.5 flex-shrink-0'
  const text = (value: string) => (compact ? value : <span className="truncate">{value}</span>)

  return (
    <>
      {rooms && (
        <div className={row}>
          <div className={`${thumb} relative rounded-lg overflow-hidden flex-shrink-0`}>
            <Image src={image.src} alt={image.alt} fill className="object-cover" />
          </div>
          <div className={compact ? '' : 'flex-1 min-w-0'}>
            <div className={name}>
              <MapPin className={smallIcon} />
              {text(rooms)}
            </div>
          </div>
        </div>
      )}
      {camping && (
        <div className={row}>
          <div className={`${thumb} relative rounded-lg overflow-hidden flex-shrink-0 bg-green-100 flex items-center justify-center`}>
            <Tent className={compact ? 'w-5 h-5 sm:w-6 sm:h-6 text-green-600' : 'w-6 h-6 text-green-600'} />
          </div>
          <div className={compact ? '' : 'flex-1 min-w-0'}>
            <div className={name}>
              <Tent className={smallIcon} />
              {text(camping)}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
