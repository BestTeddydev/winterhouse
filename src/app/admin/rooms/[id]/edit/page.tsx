'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import Navbar from '@/components/Navbar'
import RoomForm from '../../_components/RoomForm'
import RoomFormPage from '../../_components/RoomFormPage'
import { roomToFormValues, type RoomFormValues } from '../../_lib/roomForm'

export default function EditRoomPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [room, setRoom] = useState<{ values: RoomFormValues; urls: string[]; cover?: string } | null>(null)

  useEffect(() => {
    axios
      .get(`/api/rooms/${id}`)
      .then(({ data }) =>
        setRoom({
          values: roomToFormValues(data),
          urls: data.imageUrls?.length ? data.imageUrls : data.imageUrl ? [data.imageUrl] : [],
          cover: data.imageUrl,
        })
      )
      .catch(() => toast.error('ไม่สามารถโหลดข้อมูลห้องพักได้'))
  }, [id])

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex justify-center items-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <RoomFormPage title="แก้ไขห้องพัก">
      <RoomForm
        mode="edit"
        initialValues={room.values}
        initialImages={{ urls: room.urls, cover: room.cover }}
        onSubmit={async (payload) => {
          await axios.put(`/api/rooms/${id}`, payload)
          toast.success('อัพเดทห้องพักสำเร็จ')
          router.push('/admin/rooms')
        }}
      />
    </RoomFormPage>
  )
}
