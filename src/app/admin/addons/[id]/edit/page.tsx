'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useIsStaff } from '@/hooks/useIsStaff'
import AddOnForm, { addOnToFormValues, type AddOnFormValues } from '../../_components/AddOnForm'
import AddOnFormPage from '../../_components/AddOnFormPage'

export default function EditAddOn() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { staff } = useIsStaff()
  const [values, setValues] = useState<AddOnFormValues | null>(null)

  useEffect(() => {
    if (!staff) return
    axios
      .get(`/api/addons/${id}`)
      .then((res) => setValues(addOnToFormValues(res.data)))
      .catch((error) => {
        console.error('Error fetching add-on:', error)
        toast.error(error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลอ๊อฟชั่นเสริมได้')
        router.push('/admin/addons')
      })
  }, [staff, id, router])

  return (
    <AddOnFormPage title="แก้ไขอ๊อฟชั่นเสริม" subtitle="แก้ไขข้อมูลอ๊อฟชั่นเสริม" loading={!values}>
      {values && (
        <AddOnForm
          initialValues={values}
          errorMessage="ไม่สามารถแก้ไขอ๊อฟชั่นเสริมได้"
          onSubmit={async (body) => {
            await axios.put(`/api/addons/${id}`, body)
            toast.success('แก้ไขอ๊อฟชั่นเสริมสำเร็จ')
            router.push('/admin/addons')
          }}
        />
      )}
    </AddOnFormPage>
  )
}
