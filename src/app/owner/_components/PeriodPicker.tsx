import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  DAY_FIELD_LABELS,
  PRESET_LABELS,
  formatPeriod,
  matchPreset,
  periodDays,
  presetPeriod,
  shiftPeriod,
  type DayField,
  type Period,
  type PresetKey,
} from './period'

interface Props {
  period: Period
  by: DayField
  today: string
  onPeriodChange: (period: Period) => void
  onByChange: (by: DayField) => void
}

const INPUT = 'px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-xs sm:text-sm'

/** Period of the dashboard: quick choices, any from/to dates, and previous/next period */
export default function PeriodPicker({ period, by, today, onPeriodChange, onByChange }: Props) {
  const active = matchPreset(period, today)

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 mb-6 sm:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">เลือกช่วงวันที่จอง</h2>
        <div className="flex items-center gap-2">
          <label htmlFor="dayField" className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
            กรองตาม:
          </label>
          <select id="dayField" value={by} onChange={(e) => onByChange(e.target.value as DayField)} className={INPUT}>
            <option value="createdAt">{DAY_FIELD_LABELS.createdAt}</option>
            <option value="checkIn">{DAY_FIELD_LABELS.checkIn}</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(PRESET_LABELS) as PresetKey[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => onPeriodChange(presetPeriod(key, today))}
            aria-pressed={active === key}
            className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors ${
              active === key ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {PRESET_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPeriodChange(shiftPeriod(period, -1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="ช่วงก่อนหน้า"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <input
          type="date"
          aria-label="ตั้งแต่วันที่"
          value={period.from}
          max={period.to}
          onChange={(e) => e.target.value && onPeriodChange({ from: e.target.value, to: e.target.value > period.to ? e.target.value : period.to })}
          className={INPUT}
        />
        <span className="text-gray-500 text-sm">ถึง</span>
        <input
          type="date"
          aria-label="ถึงวันที่"
          value={period.to}
          min={period.from}
          onChange={(e) => e.target.value && onPeriodChange({ from: e.target.value < period.from ? e.target.value : period.from, to: e.target.value })}
          className={INPUT}
        />
        <button
          type="button"
          onClick={() => onPeriodChange(shiftPeriod(period, 1))}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="ช่วงถัดไป"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mt-4">
        <p className="text-base sm:text-lg text-gray-700 font-medium">
          {formatPeriod(period)}
          {period.from !== period.to && <span className="text-sm text-gray-500"> ({periodDays(period)} วัน)</span>}
        </p>
        <p className="text-xs sm:text-sm text-gray-500">กรองตาม: {DAY_FIELD_LABELS[by]}</p>
      </div>
    </div>
  )
}
