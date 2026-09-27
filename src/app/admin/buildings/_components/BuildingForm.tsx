'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import AmenitiesInput from '@/components/admin/AmenitiesInput'
import { buildingTypeOptions } from '@/lib/buildingTypes'

export interface BuildingFormValues {
  name: string
  description: string
  buildingType: string
  facilities: string[]
  x: string
  y: string
}

export const EMPTY_BUILDING: BuildingFormValues = {
  name: '',
  description: '',
  buildingType: 'accommodation',
  facilities: [],
  x: '50',
  y: '50',
}

export const buildingToFormValues = (building: any): BuildingFormValues => ({
  name: building.name || '',
  description: building.description || '',
  buildingType: building.buildingType || 'accommodation',
  facilities: building.facilities ?? [],
  x: String(building.x ?? 50),
  y: String(building.y ?? 50),
})

const inRange = (value: number) => value >= 0 && value <= 100

/** Checks the form; returns the API body or an error message */
export function buildingPayload(values: BuildingFormValues): { error: string } | { body: Record<string, unknown> } {
  if (!values.name.trim() || !values.description.trim()) return { error: 'กรุณากรอกข้อมูลให้ครบถ้วน' }
  const x = parseFloat(values.x)
  const y = parseFloat(values.y)
  if (!inRange(x) || !inRange(y)) return { error: 'ตำแหน่ง X และ Y ต้องอยู่ระหว่าง 0-100' }
  return {
    body: {
      name: values.name.trim(),
      description: values.description.trim(),
      buildingType: values.buildingType,
      facilities: values.facilities,
      x,
      y,
    },
  }
}

const buildingTypes = buildingTypeOptions()
const INPUT = 'w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500'
const LABEL = 'block text-gray-700 font-medium mb-2'

interface Props {
  initialValues: BuildingFormValues
  submitLabel: string
  /** Resolves when saved; errors are shown by the caller's message */
  onSubmit: (body: Record<string, unknown>) => Promise<void>
  errorMessage: string
}

/** Building fields, shared by the create and edit pages */
export default function BuildingForm({ initialValues, submitLabel, onSubmit, errorMessage }: Props) {
  const [values, setValues] = useState(initialValues)
  const [submitting, setSubmitting] = useState(false)
  const set = <K extends keyof BuildingFormValues>(key: K, value: BuildingFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = buildingPayload(values)
    if ('error' in result) return void toast.error(result.error)
    setSubmitting(true)
    try {
      await onSubmit(result.body)
    } catch (error: any) {
      console.error('Error saving building:', error)
      toast.error(error.response?.data?.error || errorMessage)
      setSubmitting(false)
    }
  }

  const coordinate = (key: 'x' | 'y', label: string, hint: string) => (
    <div>
      <label htmlFor={`building-${key}`} className={LABEL}>
        {label} *
      </label>
      <input
        id={`building-${key}`}
        type="number"
        value={values[key]}
        onChange={(e) => set(key, e.target.value)}
        required
        min="0"
        max="100"
        step="0.1"
        className={INPUT}
        placeholder="50"
      />
      <p className="text-sm text-gray-500 mt-1">{hint}</p>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="building-name" className={LABEL}>
            ชื่ออาคาร *
          </label>
          <input
            id="building-name"
            type="text"
            value={values.name}
            onChange={(e) => set('name', e.target.value)}
            required
            className={INPUT}
            placeholder="เช่น อาคาร A"
          />
        </div>

        <div>
          <label htmlFor="building-type" className={LABEL}>
            ประเภทอาคาร *
          </label>
          <select
            id="building-type"
            value={values.buildingType}
            onChange={(e) => set('buildingType', e.target.value)}
            required
            className={INPUT}
          >
            {buildingTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.icon} {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="building-description" className={LABEL}>
          คำอธิบาย *
        </label>
        <textarea
          id="building-description"
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          required
          rows={4}
          className={INPUT}
          placeholder="คำอธิบายอาคาร"
        />
      </div>

      <AmenitiesInput
        value={values.facilities}
        onChange={(facilities) => set('facilities', facilities)}
        placeholder="เช่น WiFi, แอร์, ที่จอดรถ"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {coordinate('x', 'ตำแหน่ง X บนแผนผัง (%)', 'ตำแหน่งซ้าย-ขวา (0-100%)')}
        {coordinate('y', 'ตำแหน่ง Y บนแผนผัง (%)', 'ตำแหน่งบน-ล่าง (0-100%)')}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">💡 คำแนะนำ</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• ตำแหน่ง X และ Y ใช้สำหรับแสดงตำแหน่งอาคารบนแผนผัง</li>
          <li>• ค่า 0% คือด้านซ้ายสุด/บนสุด, ค่า 100% คือด้านขวาสุด/ล่างสุด</li>
          <li>• ลากจุดบนหน้าแผนผัง (จัดการแผนผัง) เพื่อย้ายตำแหน่งได้ง่ายกว่า</li>
        </ul>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {submitting ? 'กำลังบันทึก...' : submitLabel}
        </button>
        <Link
          href="/admin/buildings"
          className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
        >
          ยกเลิก
        </Link>
      </div>
    </form>
  )
}
