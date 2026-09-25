'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import CampingBlockForm, { campingBlockToFormValues, type CampingBlockFormValues } from '../../_components/CampingBlockForm'
import CampingBlockFormPage from '../../_components/CampingBlockFormPage'

export default function EditCampingBlockPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [block, setBlock] = useState<{ values: CampingBlockFormValues; imageUrls: string[] } | null>(null)

  useEffect(() => {
    axios
      .get(`/api/camping-blocks/${id}`)
      .then(({ data }) => setBlock({ values: campingBlockToFormValues(data), imageUrls: data.imageUrls ?? [] }))
      .catch(() => toast.error('ไม่สามารถโหลดข้อมูลบล็อคกางเต๊นท์ได้'))
  }, [id])

  return (
    <CampingBlockFormPage title="แก้ไขบล็อคกางเต๊นท์" loading={!block}>
      {block && (
        <CampingBlockForm
          mode="edit"
          initialValues={block.values}
          initialImageUrls={block.imageUrls}
          onSubmit={async (payload) => {
            await axios.put(`/api/camping-blocks/${id}`, payload)
            toast.success('อัปเดตบล็อคกางเต๊นท์สำเร็จ')
            router.push('/admin/camping-blocks')
          }}
        />
      )}
    </CampingBlockFormPage>
  )
}
