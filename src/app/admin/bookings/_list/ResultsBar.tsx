import type { BookingFilters, Pagination, SortField } from '../_lib/useBookingList'

const SORTS: Array<{ field: SortField; label: string; short?: string }> = [
  { field: 'checkIn', label: 'วันที่เช็คอิน', short: 'เช็คอิน' },
  { field: 'createdAt', label: 'วันที่สร้าง', short: 'สร้าง' },
  { field: 'totalPrice', label: 'ราคา' },
]

interface Props {
  shown: number
  filtered: boolean
  filters: BookingFilters
  pagination: Pagination
  loading: boolean
  sort: { by: SortField; order: 'asc' | 'desc' }
  onSort: (field: SortField) => void
}

/** "Showing x of y" with the sort buttons */
export default function ResultsBar({ shown, filtered, filters, pagination, loading, sort, onSort }: Props) {
  return (
    <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <span className="text-xs sm:text-sm md:text-base text-gray-700 font-semibold">
            แสดงผล {shown} {filtered ? 'จากการกรอง' : ''} จาก {pagination.total} การจอง
          </span>
          {filters.dateFrom && filters.dateTo && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              {filters.dateType === 'checkIn' ? 'เช็คอิน' : 'สร้าง'}: {filters.dateFrom} ถึง {filters.dateTo}
            </span>
          )}
          {pagination.totalPages > 1 && (
            <span className="text-gray-500 text-xs sm:text-sm">
              (หน้า {pagination.page} จาก {pagination.totalPages})
            </span>
          )}
          {loading && (
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" aria-label="กำลังโหลด" />
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <span className="text-xs sm:text-sm text-gray-600 whitespace-nowrap">เรียงตาม:</span>
          <div className="flex bg-gray-100 rounded-lg p-0.5 sm:p-1 w-full sm:w-auto">
            {SORTS.map(({ field, label, short }) => (
              <button
                key={field}
                onClick={() => onSort(field)}
                aria-pressed={sort.by === field}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md transition-colors text-xs sm:text-sm font-medium flex-1 sm:flex-none ${
                  sort.by === field ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {short ? (
                  <>
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{short}</span>
                  </>
                ) : (
                  label
                )}
                {sort.by === field && <span className="ml-1">{sort.order === 'asc' ? '↑' : '↓'}</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
