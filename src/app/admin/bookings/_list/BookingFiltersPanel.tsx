import { Calendar, CheckCircle, ChevronDown, CreditCard, Filter, Search, X } from 'lucide-react'
import { BOOKING_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/bookingStatus'
import { EMPTY_FILTERS, hasFilters, type BookingFilters } from '../_lib/useBookingList'

interface Props {
  /** Applied filters */
  filters: BookingFilters
  onChange: (patch: Partial<BookingFilters>) => void
  /** The search box is applied on Enter / the search button; everything else right away */
  searchInput: string
  onSearchInput: (value: string) => void
}

const SELECT =
  'w-full pl-8 sm:pl-10 pr-8 sm:pr-10 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white cursor-pointer text-sm'
const DATE = 'flex-1 min-w-0 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs sm:text-sm'

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium flex items-center gap-1">
      {children}
      <button onClick={onRemove} aria-label="ล้างตัวกรองนี้" className="ml-1 hover:bg-primary-200 rounded-full p-0.5">
        <X size={12} />
      </button>
    </span>
  )
}

function IconSelect({ icon: Icon, value, onChange, options }: { icon: typeof Filter; value: string; onChange: (v: string) => void; options: Array<[string, string]> }) {
  return (
    <div className="relative">
      <div className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <Icon className="text-gray-400 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
      </div>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT}>
        {options.map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>
      <div className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <ChevronDown className="text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
      </div>
    </div>
  )
}

const STATUS_OPTIONS: Array<[string, string]> = [['all', 'ทุกสถานะ'], ...['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].map((s): [string, string] => [s, BOOKING_STATUS_LABELS[s]])]
const PAYMENT_OPTIONS: Array<[string, string]> = [['all', 'ทุกสถานะการชำระ'], ...['COMPLETED', 'PENDING', 'PROCESSING', 'FAILED'].map((s): [string, string] => [s, PAYMENT_STATUS_LABELS[s]])]

export default function BookingFiltersPanel({ filters, onChange, searchInput, onSearchInput }: Props) {
  const applySearch = () => onChange({ search: searchInput })
  const clearDates = () => onChange({ dateFrom: '', dateTo: '' })
  const activeCount =
    [searchInput.trim(), filters.status !== 'all', filters.payment !== 'all', filters.dateFrom && filters.dateTo].filter(Boolean).length

  return (
    <div className="bg-white rounded-xl shadow-lg mb-4 sm:mb-6 md:mb-8 overflow-hidden">
      {hasFilters(filters) && (
        <div className="px-3 sm:px-4 md:px-6 py-2 sm:py-3 bg-primary-50 border-b border-primary-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs sm:text-sm font-medium text-primary-700">การกรองที่เปิดอยู่:</span>
            {filters.search.trim() && (
              <Chip
                onRemove={() => {
                  onSearchInput('')
                  onChange({ search: '' })
                }}
              >
                ค้นหา: {filters.search}
              </Chip>
            )}
            {filters.status !== 'all' && <Chip onRemove={() => onChange({ status: 'all' })}>สถานะ: {BOOKING_STATUS_LABELS[filters.status]}</Chip>}
            {filters.payment !== 'all' && (
              <Chip onRemove={() => onChange({ payment: 'all' })}>การชำระ: {PAYMENT_STATUS_LABELS[filters.payment] ?? filters.payment}</Chip>
            )}
            {filters.dateFrom && filters.dateTo && (
              <Chip onRemove={clearDates}>
                {filters.dateType === 'checkIn' ? 'วันที่เช็คอิน' : 'วันที่สร้าง'}: {filters.dateFrom} ถึง {filters.dateTo}
              </Chip>
            )}
          </div>
          <button
            onClick={() => {
              onSearchInput('')
              onChange(EMPTY_FILTERS)
            }}
            className="text-xs text-primary-700 hover:text-primary-800 font-medium flex items-center gap-1"
          >
            <X size={14} />
            ล้างทั้งหมด
          </button>
        </div>
      )}

      <div className="p-3 sm:p-4 md:p-6">
        <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Filter className="text-primary-600 w-4 h-4 sm:w-5 sm:h-5" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">กรองข้อมูล</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="relative">
              <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                aria-label="ค้นหา"
                placeholder="ค้นหา (ชื่อ, อีเมล, รหัส...)"
                value={searchInput}
                onChange={(e) => onSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all text-sm"
              />
            </div>
            <IconSelect icon={CheckCircle} value={filters.status} onChange={(status) => onChange({ status })} options={STATUS_OPTIONS} />
            <IconSelect icon={CreditCard} value={filters.payment} onChange={(payment) => onChange({ payment })} options={PAYMENT_OPTIONS} />
            <button
              onClick={applySearch}
              className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all flex items-center justify-center gap-2 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 text-sm"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>ค้นหา</span>
              {activeCount > 0 && (
                <span className="bg-white/30 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold min-w-[18px] sm:min-w-[20px] text-center">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:gap-4 items-start sm:items-center pt-3 sm:pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1 w-full">
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <Calendar className="text-gray-500 flex-shrink-0 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">กรองตาม:</span>
                  <select
                    value={filters.dateType}
                    onChange={(e) => onChange({ dateType: e.target.value as BookingFilters['dateType'] })}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs sm:text-sm bg-white cursor-pointer"
                  >
                    <option value="createdAt">วันที่สร้าง</option>
                    <option value="checkIn">วันที่เช็คอิน</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0 w-full sm:w-auto">
                <input type="date" aria-label="ตั้งแต่วันที่" value={filters.dateFrom} onChange={(e) => onChange({ dateFrom: e.target.value })} className={DATE} />
                <span className="text-gray-400 text-xs sm:text-sm whitespace-nowrap">ถึง</span>
                <input
                  type="date"
                  aria-label="ถึงวันที่"
                  value={filters.dateTo}
                  onChange={(e) => onChange({ dateTo: e.target.value })}
                  min={filters.dateFrom}
                  className={DATE}
                />
                {(filters.dateFrom || filters.dateTo) && (
                  <button
                    onClick={clearDates}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1 text-xs sm:text-sm flex-shrink-0"
                    title="ล้างการกรองวันที่"
                  >
                    <X className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
