'use client'

import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import AddOnForm, { EMPTY_ADD_ON } from '../_components/AddOnForm'
import AddOnFormPage from '../_components/AddOnFormPage'

export default function NewAddOn() {
  const router = useRouter()
  return (
    <AddOnFormPage title="เพิ่มอ๊อฟชั่นเสริม" subtitle="สร้างอ๊อฟชั่นเสริมใหม่">
      <AddOnForm
        initialValues={EMPTY_ADD_ON}
        errorMessage="ไม่สามารถสร้างอ๊อฟชั่นเสริมได้"
        onSubmit={async (body) => {
          await axios.post('/api/addons', body)
          toast.success('สร้างอ๊อฟชั่นเสริมสำเร็จ')
          router.push('/admin/addons')
        }}
      />
    </AddOnFormPage>
  )
}
