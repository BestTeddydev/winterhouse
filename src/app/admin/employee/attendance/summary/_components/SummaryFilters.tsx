import { Search } from 'lucide-react'
import FilterChips from '../../_components/FilterChips'
import { WORK_TYPES, filterDate } from '../../_components/attendance'

export interface SummaryFilterValues {
  search: string
  dateFrom: string
  dateTo: string
  employeeId: string
  location: string
}

export const EMPTY_SUMMARY_FILTERS: SummaryFilterValues = { search: '', dateFrom: '', dateTo: '', employeeId: 'all', location: 'all' }

const INPUT = 'w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
const LABEL = 'block text-sm font-medium text-gray-700 mb-1'

interface Props {
  value: SummaryFilterValues
  onChange: (patch: Partial<SummaryFilterValues>) => void
  employees: Array<{ _id: string; name?: string; email?: string }>
}

export default function SummaryFilters({ value, onChange, employees }: Props) {
  const employeeName = employees.find((e) => e._id === value.employeeId)?.name || 'N/A'
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            aria-label="ค้นหาพนักงาน"
            placeholder="ค้นหาพนักงาน..."
            value={value.search}
            onChange={(e) => onChange({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="dateFrom" className={LABEL}>
            จากวันที่
          </label>
          <input id="dateFrom" type="date" value={value.dateFrom} onChange={(e) => onChange({ dateFrom: e.target.value })} className={INPUT} />
        </div>
        <div>
          <label htmlFor="dateTo" className={LABEL}>
            ถึงวันที่
          </label>
          <input id="dateTo" type="date" value={value.dateTo} min={value.dateFrom} onChange={(e) => onChange({ dateTo: e.target.value })} className={INPUT} />
        </div>
        <div>
          <label htmlFor="employee" className={LABEL}>
            พนักงาน
          </label>
          <select id="employee" value={value.employeeId} onChange={(e) => onChange({ employeeId: e.target.value })} className={`${INPUT} bg-white`}>
            <option value="all">ทั้งหมด</option>
            {employees.map((employee) => (
              <option key={employee._id} value={employee._id}>
                {employee.name || employee.email}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="workType" className={LABEL}>
            ประเภท
          </label>
          <select id="workType" value={value.location} onChange={(e) => onChange({ location: e.target.value })} className={`${INPUT} bg-white`}>
            <option value="all">ทั้งหมด</option>
            {WORK_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <FilterChips
        chips={[
          value.dateFrom && `จาก: ${filterDate(value.dateFrom)}`,
          value.dateTo && `ถึง: ${filterDate(value.dateTo)}`,
          value.employeeId !== 'all' && `พนักงาน: ${employeeName}`,
          value.location !== 'all' && `ประเภท: ${value.location}`,
          value.search && `ค้นหา: ${value.search}`,
        ]}
        onClear={() => onChange(EMPTY_SUMMARY_FILTERS)}
      />
    </div>
  )
}
