'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { X, Plus } from 'lucide-react'

interface Hotspot {
  x: number
  y: number
  title: string
  description: string
}

interface HotspotEditorProps {
  imageUrl: string
  hotspots: Hotspot[]
  onChange: (hotspots: Hotspot[]) => void
}

export default function HotspotEditor({
  imageUrl,
  hotspots,
  onChange,
}: HotspotEditorProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [isAddingHotspot, setIsAddingHotspot] = useState(false)
  const imageRef = useRef<HTMLDivElement>(null)

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAddingHotspot) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const newHotspot: Hotspot = {
      x,
      y,
      title: 'จุดสนใจใหม่',
      description: 'คลิกเพื่อแก้ไข',
    }

    onChange([...hotspots, newHotspot])
    setSelectedIndex(hotspots.length)
    setIsAddingHotspot(false)
  }

  const handleHotspotUpdate = (index: number, updates: Partial<Hotspot>) => {
    const newHotspots = [...hotspots]
    newHotspots[index] = { ...newHotspots[index], ...updates }
    onChange(newHotspots)
  }

  const handleDeleteHotspot = (index: number) => {
    const newHotspots = hotspots.filter((_, i) => i !== index)
    onChange(newHotspots)
    setSelectedIndex(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">จุดสนใจบนรูปภาพ (Hotspots)</h3>
        <button
          type="button"
          onClick={() => setIsAddingHotspot(!isAddingHotspot)}
          className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
            isAddingHotspot
              ? 'bg-red-500 text-white hover:bg-red-600'
              : 'bg-primary-600 text-white hover:bg-primary-700'
          }`}
        >
          {isAddingHotspot ? (
            <>
              <X size={16} />
              ยกเลิก
            </>
          ) : (
            <>
              <Plus size={16} />
              เพิ่มจุดสนใจ
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Image with Hotspots */}
        <div
          ref={imageRef}
          className={`relative w-full h-96 border-2 rounded-lg overflow-hidden ${
            isAddingHotspot ? 'border-primary-500 cursor-crosshair' : 'border-gray-200'
          }`}
          onClick={handleImageClick}
        >
          <Image src={imageUrl} alt="Room" fill className="object-cover" />

          {hotspots.map((hotspot, index) => (
            <button
              key={index}
              type="button"
              className={`absolute w-8 h-8 -ml-4 -mt-4 rounded-full border-4 border-white shadow-lg hover:scale-110 transition-transform ${
                selectedIndex === index ? 'bg-red-500' : 'bg-primary-500'
              }`}
              style={{
                left: `${hotspot.x}%`,
                top: `${hotspot.y}%`,
              }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedIndex(index)
              }}
            >
              <span className="sr-only">{hotspot.title}</span>
            </button>
          ))}

          {isAddingHotspot && (
            <div className="absolute inset-0 bg-primary-500 bg-opacity-10 flex items-center justify-center">
              <p className="bg-white px-4 py-2 rounded-lg shadow-lg">
                คลิกที่ตำแหน่งที่ต้องการเพิ่มจุดสนใจ
              </p>
            </div>
          )}
        </div>

        {/* Hotspot List and Editor */}
        <div className="space-y-4">
          {hotspots.length === 0 ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center text-gray-500">
              <p>ยังไม่มีจุดสนใจ</p>
              <p className="text-sm">คลิกปุ่ม "เพิ่มจุดสนใจ" เพื่อเริ่มต้น</p>
            </div>
          ) : (
            hotspots.map((hotspot, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg p-4 ${
                  selectedIndex === index
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">จุดสนใจ #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => handleDeleteHotspot(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={20} />
                  </button>
                </div>

                {selectedIndex === index ? (
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">หัวข้อ</label>
                      <input
                        type="text"
                        value={hotspot.title}
                        onChange={(e) =>
                          handleHotspotUpdate(index, { title: e.target.value })
                        }
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">รายละเอียด</label>
                      <textarea
                        value={hotspot.description}
                        onChange={(e) =>
                          handleHotspotUpdate(index, { description: e.target.value })
                        }
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      ตำแหน่ง: X: {hotspot.x.toFixed(2)}%, Y: {hotspot.y.toFixed(2)}%
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium">{hotspot.title}</p>
                    <p className="text-sm text-gray-600">{hotspot.description}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

