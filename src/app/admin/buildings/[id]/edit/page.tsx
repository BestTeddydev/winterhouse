'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import toast from 'react-hot-toast'
import BuildingForm, { buildingToFormValues, type BuildingFormValues } from '../../_components/BuildingForm'
import BuildingFormPage from '../../_components/BuildingFormPage'

export default function EditBuilding() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [values, setValues] = useState<BuildingFormValues | null>(null)

  useEffect(() => {
    axios
      .get(`/api/buildings/${id}`)
      .then(({ data }) => setValues(buildingToFormValues(data.building)))
      .catch((error) => {
        console.error('Error fetching building:', error)
        toast.error(error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลอาคารได้')
        router.push('/admin/buildings')
      })
  }, [id, router])

  return (
    <BuildingFormPage title="แก้ไขอาคาร" loading={!values}>
      {values && (
        <BuildingForm
          initialValues={values}
          submitLabel="บันทึกการแก้ไข"
          errorMessage="ไม่สามารถอัปเดตอาคารได้"
          onSubmit={async (body) => {
            await axios.put(`/api/buildings/${id}`, body)
            toast.success('อัปเดตอาคารสำเร็จ')
            router.push('/admin/buildings')
          }}
        />
      )}
    </BuildingFormPage>
  )
}
