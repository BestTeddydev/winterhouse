import type { ComponentProps } from 'react'
import SiteMapViewer from '@/components/SiteMapViewer'
import type { MapType } from '../_lib/types'

type Props = ComponentProps<typeof SiteMapViewer> & {
  mapType: MapType
  onMapTypeChange: (mapType: MapType) => void
}

const MAP_TYPES: Array<{ type: MapType; label: string }> = [
  { type: 'accommodation', label: '🏠 ห้องพัก' },
  { type: 'camping', label: '🏕️ ลานกางเต๊นท์' },
]

/** Site map with the rooms / camping switch */
export default function MapPanel({ onMapTypeChange, ...viewerProps }: Props) {
  const { mapType } = viewerProps
  return (
    <div className="bg-white rounded-xl shadow-lg p-4 lg:p-6">
      <div className="mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {mapType === 'camping' ? 'แผนผังลานกางเต๊นท์' : 'แผนผังอาคาร'}
            </h3>
            <p className="text-sm text-gray-600">
              {mapType === 'camping'
                ? 'คลิกที่จุดบนแผนผังเพื่อดูรายละเอียดจุดกางเต๊นท์'
                : 'คลิกที่จุดบนแผนผังเพื่อดูห้องพักในอาคารนั้น'}
            </p>
          </div>
          <div className="flex gap-2">
            {MAP_TYPES.map(({ type, label }) => (
              <button
                key={type}
                onClick={() => onMapTypeChange(type)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  mapType === type ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <SiteMapViewer {...viewerProps} />
    </div>
  )
}
