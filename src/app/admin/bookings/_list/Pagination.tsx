import { ChevronLeft, ChevronRight } from 'lucide-react'
import { pageWindow } from '../_lib/bookingList'
import type { Pagination as PaginationInfo } from '../_lib/useBookingList'

const NAV = 'px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors flex items-center gap-1 sm:gap-2 text-xs sm:text-sm'
const ENABLED = 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
const DISABLED = 'bg-gray-100 text-gray-400 cursor-not-allowed'

export default function Pagination({ pagination, page, onPage }: { pagination: PaginationInfo; page: number; onPage: (page: number) => void }) {
  if (pagination.totalPages <= 1) return null
  return (
    <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-2">
      <button
        onClick={() => onPage(Math.max(1, page - 1))}
        disabled={!pagination.hasPrevPage}
        className={`${NAV} ${pagination.hasPrevPage ? ENABLED : DISABLED}`}
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">ก่อนหน้า</span>
      </button>

      <div className="flex items-center gap-1">
        {pageWindow(page, pagination.totalPages).map((n) => (
          <button
            key={n}
            onClick={() => onPage(n)}
            aria-current={page === n ? 'page' : undefined}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm ${
              page === n ? 'bg-primary-600 text-white' : ENABLED
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPage(Math.min(pagination.totalPages, page + 1))}
        disabled={!pagination.hasNextPage}
        className={`${NAV} ${pagination.hasNextPage ? ENABLED : DISABLED}`}
      >
        <span className="hidden sm:inline">ถัดไป</span>
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>
    </div>
  )
}
