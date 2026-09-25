'use client'

import { forwardRef, useState } from 'react'
import Image from 'next/image'

interface MapCanvasProps {
  imageUrl: string
  alt: string
  /** Largest height the map may take (px); the width follows the image's aspect ratio */
  maxHeight?: number
  className?: string
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void
  onImageError?: () => void
  children?: React.ReactNode
}

/**
 * Renders a map image in a box with exactly the image's aspect ratio, so children positioned
 * with left/top percentages (hotspots) always point at the same spot of the image at any
 * screen size. Used by both the site map viewer and editor, so coordinates saved in the
 * editor are percentages of the image itself.
 */
const MapCanvas = forwardRef<HTMLDivElement, MapCanvasProps>(function MapCanvas(
  { imageUrl, alt, maxHeight = 600, className = '', onClick, onImageError, children },
  ref
) {
  // Ratio is tied to the URL it was measured for, so switching maps never reuses a stale ratio
  const [measured, setMeasured] = useState<{ url: string; ratio: number } | null>(null)
  const aspectRatio = measured?.url === imageUrl ? measured.ratio : null

  return (
    <div className="flex w-full justify-center overflow-hidden rounded-xl border-4 border-gray-200 bg-gray-100 shadow-lg">
      <div
        ref={ref}
        onClick={onClick}
        className={`relative ${className}`}
        style={{
          aspectRatio: aspectRatio ?? 16 / 9,
          // Fill the width, but never exceed maxHeight (the width shrinks to keep the ratio)
          width: aspectRatio ? `min(100%, ${Math.round(maxHeight * aspectRatio)}px)` : '100%',
        }}
      >
        <Image
          key={imageUrl}
          src={imageUrl}
          alt={alt}
          fill
          priority
          draggable={false}
          className="select-none object-fill"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 90vw, 1200px"
          onLoad={(e) => {
            const img = e.currentTarget
            if (img.naturalWidth && img.naturalHeight) setMeasured({ url: imageUrl, ratio: img.naturalWidth / img.naturalHeight })
          }}
          onError={onImageError}
        />
        {/* Positions are only meaningful once the real ratio is known */}
        {aspectRatio && children}
      </div>
    </div>
  )
})

export default MapCanvas
