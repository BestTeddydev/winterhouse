'use client'

import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import RoomForm from '../_components/RoomForm'
import RoomFormPage from '../_components/RoomFormPage'
import { EMPTY_ROOM } from '../_lib/roomForm'

export default function NewRoomPage() {
  const router = useRouter()
  return (
    <RoomFormPage title="เพิ่มห้องพักใหม่">
      <RoomForm
        mode="create"
        initialValues={EMPTY_ROOM}
        onSubmit={async (room) => {
          await axios.post('/api/rooms', room)
          toast.success(`เพิ่มห้องพัก "${room.name}" สำเร็จ (${room.imageUrls.length} รูป)`)
          router.push('/admin/rooms')
        }}
      />
    </RoomFormPage>
  )
}
