'use client'

import { useState } from 'react'
import { MapPin, Tent, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { BookableCampingBlock, BookableRoom, SelectedCampingBlock } from '../_lib/bookingForm'
import CampingBlockOptionCard from './CampingBlockOptionCard'
import RoomOptionCard from './RoomOptionCard'

interface Props {
  rooms: BookableRoom[]
  campingBlocks: BookableCampingBlock[]
  selectedRooms: BookableRoom[]
  selectedCampingBlocks: SelectedCampingBlock[]
  checkIn: string
  nights: number
  total: number
  onToggleRoom: (room: BookableRoom) => void
  onToggleCampingBlock: (block: BookableCampingBlock) => void
  onCampingGuestsChange: (block: BookableCampingBlock, count: number) => void
}

const TABS = [
  { key: 'room', label: 'ห้องพัก', icon: MapPin, heading: 'เลือกห้องพัก', hint: '💡 สามารถเลือกหลายห้องโดยคลิก checkbox' },
  { key: 'camping', label: 'กางเต๊นท์', icon: Tent, heading: 'เลือกบล็อคกางเต๊นท์', hint: '💡 สามารถเลือกหลายบล็อคและกำหนดจำนวนคนได้' },
] as const

/** Sticky side panel of the create page: pick rooms and camping blocks */
export default function SelectionPanel(props: Props) {
  const { rooms, campingBlocks, selectedRooms, selectedCampingBlocks, checkIn, nights, total } = props
  const [tab, setTab] = useState<'room' | 'camping'>('room')
  const current = TABS.find((t) => t.key === tab)!

  const summary =
    tab === 'room'
      ? {
          title: `ห้องที่เลือกแล้ว (${selectedRooms.length})`,
          maxHeight: 'max-h-32',
          items: selectedRooms.map((room) => ({ id: room.id, name: room.name, note: '', remove: () => props.onToggleRoom(room) })),
        }
      : {
          title: `บล็อคที่เลือกแล้ว (${selectedCampingBlocks.length})`,
          maxHeight: 'max-h-48',
          items: selectedCampingBlocks.map((item) => ({
            id: item.block.id,
            name: item.block.name,
            note: `(${item.guestCount} คน)`,
            remove: () => props.onToggleCampingBlock(item.block),
          })),
        }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
      <div className="mb-6 flex gap-2 border-b border-gray-200">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`px-4 py-2 text-sm font-semibold transition-colors border-b-2 ${
              tab === key ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={16} className="inline mr-1" />
            {label}
          </button>
        ))}
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <current.icon size={20} />
        {current.heading}
      </h2>
      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-700">{current.hint}</p>
      </div>

      <div className="space-y-4">
        {tab === 'room'
          ? rooms.map((room) => (
              <RoomOptionCard
                key={room.id}
                room={room}
                selected={selectedRooms.some((r) => r.id === room.id)}
                onToggle={() => props.onToggleRoom(room)}
                checkIn={checkIn}
              />
            ))
          : campingBlocks.map((block) => (
              <CampingBlockOptionCard
                key={block.id}
                block={block}
                guestCount={selectedCampingBlocks.find((s) => s.block.id === block.id)?.guestCount ?? null}
                nights={nights}
                onToggle={() => props.onToggleCampingBlock(block)}
                onGuestsChange={(count) => props.onCampingGuestsChange(block, count)}
              />
            ))}
      </div>

      {summary.items.length > 0 && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">{summary.title}</h3>
          <div className={`space-y-2 ${summary.maxHeight} overflow-y-auto`}>
            {summary.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-white rounded px-2 py-1">
                <div className="flex-1">
                  <span className="text-sm text-gray-900">{item.name}</span>
                  {item.note && <span className="text-xs text-gray-500 ml-2">{item.note}</span>}
                </div>
                <button type="button" onClick={item.remove} aria-label={`เอา ${item.name} ออก`} className="text-red-500 hover:text-red-700">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
          {nights > 0 && (
            <div className="mt-3 pt-3 border-t border-green-300">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-900">ราคารวม:</span>
                <span className="text-lg font-bold text-green-700">{formatCurrency(total)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
