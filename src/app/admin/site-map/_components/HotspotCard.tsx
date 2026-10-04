'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react'
import type { BuildingHotspot } from '@/lib/siteMap'

type Item = { id: string; name: string }
type TypeOption = { value: string; label: string; icon: string }

export type BuildingFields = Partial<Pick<BuildingHotspot, 'buildingName' | 'description' | 'buildingType'>>

interface HotspotCardProps {
  hotspot: BuildingHotspot
  selected: boolean
  typeOptions: TypeOption[]
  /** Rooms / camping blocks that may go in this building (its own plus the ones in no building) */
  offeredRooms: Item[]
  offeredBlocks: Item[]
  allRooms: Item[]
  allBlocks: Item[]
  onSelect: () => void
  onDelete: () => void
  /** Moves the building up/down in the display order; absent at the top/bottom */
  onMoveUp?: () => void
  onMoveDown?: () => void
  onSave: (fields: BuildingFields) => void
  onToggleRoom: (roomId: string) => void
  onToggleBlock: (blockId: string) => void
}

const inputClass =
  'w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'

/** One building in the editor's list: a summary, or the edit form when selected */
export default function HotspotCard({
  hotspot,
  selected,
  typeOptions,
  offeredRooms,
  offeredBlocks,
  allRooms,
  allBlocks,
  onSelect,
  onDelete,
  onMoveUp,
  onMoveDown,
  onSave,
  onToggleRoom,
  onToggleBlock,
}: HotspotCardProps) {
  const type = typeOptions.find((t) => t.value === hotspot.buildingType)

  return (
    <div
      className={`border-2 rounded-xl p-6 transition-all duration-300 ${
        selected ? 'border-primary-500 bg-primary-50 shadow-lg' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-500 rounded-full flex items-center justify-center text-xl">
            {type?.icon || '🏢'}
          </div>
          <div>
            <h4 className="font-bold text-gray-900">{selected ? 'แก้ไขอาคาร' : hotspot.buildingName}</h4>
            <p className="text-xs text-gray-600">{type?.label}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={!onMoveUp}
            aria-label="เลื่อนขึ้น"
            title="เลื่อนขึ้น"
            className="p-1 rounded text-gray-500 hover:text-primary-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronUp size={20} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={!onMoveDown}
            aria-label="เลื่อนลง"
            title="เลื่อนลง"
            className="p-1 rounded text-gray-500 hover:text-primary-600 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronDown size={20} />
          </button>
          <button type="button" onClick={onDelete} aria-label="ลบ" className="ml-1 p-1 text-red-500 hover:text-red-700 transition-colors">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {selected ? (
        <div className="space-y-4">
          <TextField
            label="ชื่ออาคาร"
            value={hotspot.buildingName}
            placeholder="เช่น อาคาร A"
            requiredMessage="ต้องระบุชื่ออาคาร"
            onCommit={(buildingName) => onSave({ buildingName })}
          />

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">ประเภทอาคาร</label>
            <select
              value={hotspot.buildingType}
              onChange={(e) => onSave({ buildingType: e.target.value })}
              className={inputClass}
            >
              {typeOptions.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.icon} {t.label}
                </option>
              ))}
            </select>
          </div>

          <TextField
            label="รายละเอียด"
            value={hotspot.description}
            placeholder="อธิบายเกี่ยวกับอาคารนี้..."
            requiredMessage="ต้องระบุคำอธิบาย"
            multiline
            onCommit={(description) => onSave({ description })}
          />

          {hotspot.buildingType === 'accommodation' && (
            <LinkList
              label="ห้องพักในอาคารนี้"
              empty="ยังไม่มีห้องพัก กรุณาสร้างห้องพักก่อน"
              items={offeredRooms}
              linked={hotspot.rooms}
              onToggle={onToggleRoom}
            />
          )}

          {hotspot.buildingType === 'camping' && (
            <LinkList
              label="บล็อคกางเต๊นท์ในจุดนี้"
              empty="ยังไม่มีบล็อคกางเต๊นท์ กรุณาสร้างบล็อคกางเต๊นท์ก่อน"
              items={offeredBlocks}
              linked={hotspot.campingBlocks ?? []}
              onToggle={onToggleBlock}
            />
          )}

          <div className="text-xs text-gray-500 bg-gray-100 p-3 rounded-lg">
            <p>
              📍 ตำแหน่ง: X: {hotspot.x.toFixed(2)}%, Y: {hotspot.y.toFixed(2)}%
            </p>
            <p className="mt-1">ID: {hotspot.id}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-sm text-gray-700">{hotspot.description}</p>
          <Chips ids={hotspot.rooms} items={allRooms} className="bg-primary-100 text-primary-700" />
          <Chips ids={hotspot.campingBlocks ?? []} items={allBlocks} className="bg-green-100 text-green-700" />
          <button
            type="button"
            onClick={onSelect}
            className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
          >
            <Edit size={14} />
            แก้ไข
          </button>
        </div>
      )}
    </div>
  )
}

/** Text input kept as a local draft and saved once, when it loses focus. Blank values are refused. */
function TextField({
  label,
  value,
  placeholder,
  requiredMessage,
  multiline = false,
  onCommit,
}: {
  label: string
  value: string
  placeholder: string
  requiredMessage: string
  multiline?: boolean
  onCommit: (value: string) => void
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => setDraft(value), [value])

  const commit = () => {
    const next = draft.trim()
    if (next === value) return
    if (!next) {
      toast.error(requiredMessage)
      setDraft(value)
      return
    }
    onCommit(next)
  }

  const props = {
    value: draft,
    placeholder,
    className: inputClass,
    onBlur: commit,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
  }

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      {multiline ? <textarea rows={3} {...props} /> : <input type="text" {...props} />}
    </div>
  )
}

function LinkList({
  label,
  empty,
  items,
  linked,
  onToggle,
}: {
  label: string
  empty: string
  items: Item[]
  linked: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>
      <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
        {items.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-2">{empty}</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <label key={item.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={linked.includes(item.id)}
                  onChange={() => onToggle(item.id)}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700">{item.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Chips({ ids, items, className }: { ids: string[]; items: Item[]; className: string }) {
  const names = ids.map((id) => items.find((i) => i.id === id)).filter((i): i is Item => !!i)
  if (names.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {names.map((item) => (
        <span key={item.id} className={`px-2 py-1 text-xs rounded-full font-medium ${className}`}>
          {item.name}
        </span>
      ))}
    </div>
  )
}
