'use client'

import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import BuildingForm, { EMPTY_BUILDING } from '../_components/BuildingForm'
import BuildingFormPage from '../_components/BuildingFormPage'

export default function NewBuilding() {
  const router = useRouter()
  return (
    <BuildingFormPage title="เพิ่มอาคารใหม่">
      <BuildingForm
        initialValues={EMPTY_BUILDING}
        submitLabel="บันทึกอาคาร"
        errorMessage="ไม่สามารถเพิ่มอาคารได้"
        onSubmit={async (body) => {
          await axios.post('/api/buildings', body)
          toast.success('เพิ่มอาคารสำเร็จ')
          router.push('/admin/buildings')
        }}
      />
    </BuildingFormPage>
  )
}
