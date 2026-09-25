import { Calendar } from 'lucide-react'
import { bangkokDateKey } from '@/lib/dates'
import { FieldLabel, FormSection, INPUT_CLASS } from './ui'

interface Props {
  checkIn: string
  checkOut: string
  onChange: (field: 'checkIn' | 'checkOut', value: string) => void
  /** New bookings can't start in the past; existing ones may already have */
  allowPastCheckIn?: boolean
}

export default function StayDatesSection({ checkIn, checkOut, onChange, allowPastCheckIn = false }: Props) {
  const today = bangkokDateKey()
  return (
    <FormSection icon={Calendar} title="วันที่เข้าพัก">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="checkIn">วันเช็คอิน *</FieldLabel>
          <input
            id="checkIn"
            type="date"
            value={checkIn}
            onChange={(e) => onChange('checkIn', e.target.value)}
            min={allowPastCheckIn ? undefined : today}
            className={INPUT_CLASS}
            required
          />
        </div>

        <div>
          <FieldLabel htmlFor="checkOut">วันเช็คเอาท์ *</FieldLabel>
          <input
            id="checkOut"
            type="date"
            value={checkOut}
            onChange={(e) => onChange('checkOut', e.target.value)}
            min={checkIn || today}
            className={INPUT_CLASS}
            required
          />
        </div>
      </div>
    </FormSection>
  )
}
