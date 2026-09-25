import { CheckCircle, Edit, Lock, Trash2 } from 'lucide-react'
import { bangkokDateKey } from '@/lib/dates'
import { isLockCurrent, lockDate, lockedItem, type LockKindConfig, type LockRecord } from './locks'

interface Props {
  kind: LockKindConfig
  locks: LockRecord[]
  onEdit: (lock: LockRecord) => void
  onDelete: (id: string) => void
}

const TH = 'px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'

export default function LocksTable({ kind, locks, onEdit, onDelete }: Props) {
  const today = bangkokDateKey()
  const EmptyIcon = kind.emptyIcon
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">{`รายการการล็อค${kind.noun}`}</h2>
      </div>

      {locks.length === 0 ? (
        <div className="p-12 text-center">
          <EmptyIcon size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">{`ยังไม่มีการล็อค${kind.noun}`}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {[kind.itemLabel, 'วันที่เริ่มต้น', 'วันที่สิ้นสุด', 'เหตุผล', 'สถานะ', 'จัดการ'].map((column) => (
                  <th key={column} className={TH}>
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {locks.map((lock) => {
                const current = isLockCurrent(lock, today)
                return (
                  <tr key={lock._id} className={!current ? 'opacity-60' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{lockedItem(lock, kind.refField).name || 'ไม่พบข้อมูล'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lockDate(lock.startDate)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{lockDate(lock.endDate)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{lock.reason || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {current ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          <Lock size={12} className="mr-1" />
                          ล็อคอยู่
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          <CheckCircle size={12} className="mr-1" />
                          หมดอายุ
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button onClick={() => onEdit(lock)} className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg transition-colors" title="แก้ไข" aria-label="แก้ไข">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => onDelete(lock._id)} className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors" title="ลบ" aria-label="ลบ">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
