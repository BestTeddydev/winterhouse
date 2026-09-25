'use client'

import { useState } from 'react'

interface Props {
  value: string[]
  onChange: (amenities: string[]) => void
  label?: string
  placeholder?: string
}

/** Free-text tag list (amenities) with add/remove */
export default function AmenitiesInput({ value, onChange, label = 'สิ่งอำนวยความสะดวก', placeholder = 'เช่น WiFi, แอร์, TV' }: Props) {
  const [input, setInput] = useState('')

  const add = () => {
    if (!input.trim()) return
    onChange([...value, input.trim()])
    setInput('')
  }

  return (
    <div>
      <label className="block text-gray-700 font-medium mb-2">{label}</label>
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add()
            }
          }}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder={placeholder}
        />
        <button type="button" onClick={add} className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
          เพิ่ม
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {value.map((amenity, index) => (
          <span key={index} className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full flex items-center gap-2">
            {amenity}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="text-primary-600 hover:text-primary-800"
            >
              ×
            </button>
          </span>
        ))}
      </div>
    </div>
  )
}
