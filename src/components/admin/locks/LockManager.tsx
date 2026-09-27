'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { ArrowLeft, Plus } from 'lucide-react'
import Navbar from '@/components/Navbar'
import { useIsStaff } from '@/hooks/useRequireRole'
import LockFormModal from './LockFormModal'
import LocksTable from './LocksTable'
import { EMPTY_LOCK, LOCK_KINDS, lockToForm, validateLock, type LockFormValues, type LockKind, type LockRecord } from './locks'

/** Admin page that keeps rooms or camping blocks unbookable for periods */
export default function LockManager({ kind: kindKey }: { kind: LockKind }) {
  const kind = LOCK_KINDS[kindKey]
  const router = useRouter()
  const { staff } = useIsStaff()
  const [items, setItems] = useState<Array<{ id: string; name: string }>>([])
  const [locks, setLocks] = useState<LockRecord[]>([])
  const [form, setForm] = useState<{ editingId: string | null; values: LockFormValues } | null>(null)
  const [saving, setSaving] = useState(false)

  const loadLocks = useCallback(
    () =>
      axios
        .get(kind.locksUrl, { params: { activeOnly: true } })
        .then((res) => setLocks(res.data))
        .catch((error) => {
          console.error('Error fetching locks:', error)
          toast.error(`ไม่สามารถโหลดข้อมูลการล็อค${kind.noun}ได้`)
        }),
    [kind]
  )

  useEffect(() => {
    if (!staff) return
    axios
      .get(kind.itemsUrl)
      .then((res) => setItems(res.data))
      .catch((error) => {
        console.error('Error fetching items:', error)
        toast.error(kind.itemsError)
      })
    loadLocks()
  }, [staff, kind, loadLocks])

  const save = async () => {
    if (!form) return
    const error = validateLock(form.values)
    if (error) return void toast.error(error)

    const { itemId, ...period } = form.values
    setSaving(true)
    try {
      if (form.editingId) {
        await axios.put(`${kind.locksUrl}/${form.editingId}`, period)
        toast.success(`อัปเดตการล็อค${kind.noun}สำเร็จ`)
      } else {
        await axios.post(kind.locksUrl, { ...period, [kind.refField]: itemId })
        toast.success(`สร้างการล็อค${kind.noun}สำเร็จ`)
      }
      setForm(null)
      loadLocks()
    } catch (error: any) {
      console.error('Error saving lock:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถบันทึกข้อมูลได้')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (id: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบการล็อค${kind.noun}นี้?`)) return
    try {
      await axios.delete(`${kind.locksUrl}/${id}`)
      toast.success(`ลบการล็อค${kind.noun}สำเร็จ`)
      loadLocks()
    } catch (error: any) {
      console.error('Error deleting lock:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถลบข้อมูลได้')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} aria-label="ย้อนกลับ" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{`จัดการการล็อค${kind.noun}`}</h1>
              <p className="text-gray-700 text-lg">{`ล็อค${kind.noun}ไม่ให้จองในช่วงวันที่กำหนด`}</p>
            </div>
          </div>
          <button
            onClick={() => setForm({ editingId: null, values: EMPTY_LOCK })}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            {`เพิ่มการล็อค${kind.noun}`}
          </button>
        </div>

        {form && (
          <LockFormModal
            kind={kind}
            editing={!!form.editingId}
            values={form.values}
            items={items}
            saving={saving}
            onChange={(patch) => setForm((f) => f && { ...f, values: { ...f.values, ...patch } })}
            onSubmit={save}
            onClose={() => setForm(null)}
          />
        )}

        <LocksTable
          kind={kind}
          locks={locks}
          onEdit={(lock) => setForm({ editingId: lock._id, values: lockToForm(lock, kind.refField) })}
          onDelete={remove}
        />
      </main>
    </div>
  )
}
