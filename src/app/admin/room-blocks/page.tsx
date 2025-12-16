'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  Calendar, 
  Lock, 
  Plus, 
  Edit, 
  Trash2, 
  X,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

interface Room {
  id: string
  name: string
}

interface RoomBlock {
  _id: string
  roomId: {
    _id: string
    name: string
  }
  startDate: string
  endDate: string
  reason?: string
  isActive: boolean
  createdBy?: {
    name?: string
    email?: string
  }
}

export default function RoomBlocksPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [rooms, setRooms] = useState<Room[]>([])
  const [blocks, setBlocks] = useState<RoomBlock[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingBlock, setEditingBlock] = useState<RoomBlock | null>(null)
  const [formData, setFormData] = useState({
    roomId: '',
    startDate: '',
    endDate: '',
    reason: ''
  })

  useEffect(() => {
    if (session === undefined) return

    if (!session || (session.user?.role !== 'ADMIN' && session.user?.role !== 'OWNER')) {
      router.push('/auth/signin')
      return
    }

    fetchRooms()
    fetchBlocks()
  }, [session])

  const fetchRooms = async () => {
    try {
      const response = await axios.get('/api/rooms')
      setRooms(response.data)
    } catch (error) {
      console.error('Error fetching rooms:', error)
      toast.error('ไม่สามารถโหลดข้อมูลห้องพักได้')
    }
  }

  const fetchBlocks = async () => {
    try {
      const response = await axios.get('/api/room-blocks?activeOnly=true')
      setBlocks(response.data)
    } catch (error) {
      console.error('Error fetching blocks:', error)
      toast.error('ไม่สามารถโหลดข้อมูลการล็อคห้องได้')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.roomId || !formData.startDate || !formData.endDate) {
      toast.error('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }

    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)

    if (start >= end) {
      toast.error('วันที่เริ่มต้นต้องมาก่อนวันที่สิ้นสุด')
      return
    }

    setLoading(true)

    try {
      if (editingBlock) {
        await axios.put(`/api/room-blocks/${editingBlock._id}`, formData)
        toast.success('อัปเดตการล็อคห้องสำเร็จ')
      } else {
        await axios.post('/api/room-blocks', formData)
        toast.success('สร้างการล็อคห้องสำเร็จ')
      }
      
      setShowForm(false)
      setEditingBlock(null)
      setFormData({ roomId: '', startDate: '', endDate: '', reason: '' })
      fetchBlocks()
    } catch (error: any) {
      console.error('Error saving room block:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถบันทึกข้อมูลได้')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (block: RoomBlock) => {
    setEditingBlock(block)
    setFormData({
      roomId: block.roomId._id.toString(),
      startDate: new Date(block.startDate).toISOString().split('T')[0],
      endDate: new Date(block.endDate).toISOString().split('T')[0],
      reason: block.reason || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบการล็อคห้องนี้?')) {
      return
    }

    try {
      await axios.delete(`/api/room-blocks/${id}`)
      toast.success('ลบการล็อคห้องสำเร็จ')
      fetchBlocks()
    } catch (error: any) {
      console.error('Error deleting room block:', error)
      toast.error(error.response?.data?.error || 'ไม่สามารถลบข้อมูลได้')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingBlock(null)
    setFormData({ roomId: '', startDate: '', endDate: '', reason: '' })
  }

  const isBlockActive = (block: RoomBlock) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const endDate = new Date(block.endDate)
    endDate.setHours(0, 0, 0, 0)
    return block.isActive && endDate >= today
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">จัดการการล็อคห้อง</h1>
              <p className="text-gray-700 text-lg">ล็อคห้องไม่ให้จองในช่วงวันที่กำหนด</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
          >
            <Plus size={20} />
            เพิ่มการล็อคห้อง
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    {editingBlock ? 'แก้ไขการล็อคห้อง' : 'เพิ่มการล็อคห้อง'}
                  </h2>
                  <button
                    onClick={handleCancel}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ห้องพัก *
                    </label>
                    <select
                      value={formData.roomId}
                      onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                      required
                    >
                      <option value="">เลือกห้องพัก</option>
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>{room.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        วันที่เริ่มต้น *
                      </label>
                      <input
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        วันที่สิ้นสุด *
                      </label>
                      <input
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      เหตุผล (ไม่บังคับ)
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
                      placeholder="เช่น ซ่อมแซม, ปิดใช้งานชั่วคราว, ฯลฯ"
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save size={20} />
                          {editingBlock ? 'บันทึกการแก้ไข' : 'สร้างการล็อค'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Blocks List */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">รายการการล็อคห้อง</h2>
          </div>

          {blocks.length === 0 ? (
            <div className="p-12 text-center">
              <Lock size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600">ยังไม่มีการล็อคห้อง</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ห้องพัก</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่เริ่มต้น</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่สิ้นสุด</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เหตุผล</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานะ</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {blocks.map((block) => {
                    const isActive = isBlockActive(block)
                    return (
                      <tr key={block._id} className={!isActive ? 'opacity-60' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {block.roomId?.name || 'ไม่พบข้อมูล'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(block.startDate).toLocaleDateString('th-TH')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(block.endDate).toLocaleDateString('th-TH')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600">
                            {block.reason || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isActive ? (
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
                            <button
                              onClick={() => handleEdit(block)}
                              className="text-primary-600 hover:text-primary-900 p-2 hover:bg-primary-50 rounded-lg transition-colors"
                              title="แก้ไข"
                            >
                              <Edit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(block._id)}
                              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="ลบ"
                            >
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
      </main>
    </div>
  )
}

