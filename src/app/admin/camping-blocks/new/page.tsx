'use client'

import { useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import CampingBlockForm, { EMPTY_CAMPING_BLOCK } from '../_components/CampingBlockForm'
import CampingBlockFormPage from '../_components/CampingBlockFormPage'

export default function NewCampingBlockPage() {
  const router = useRouter()
  return (
    <CampingBlockFormPage title="เพิ่มบล็อคกางเต๊นท์ใหม่">
      <CampingBlockForm
        mode="create"
        initialValues={EMPTY_CAMPING_BLOCK}
        onSubmit={async (block) => {
          await axios.post('/api/camping-blocks', block)
          toast.success('สร้างบล็อคกางเต๊นท์สำเร็จ')
          router.push('/admin/camping-blocks')
        }}
      />
    </CampingBlockFormPage>
  )
}
