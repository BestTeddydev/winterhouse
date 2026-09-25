import { User } from 'lucide-react'
import { FieldLabel, FormSection, INPUT_CLASS } from './ui'

export interface GuestInfo {
  guestName: string
  guestEmail: string
  guestPhone: string
  guestCount: number
}

interface Props {
  value: GuestInfo
  onChange: (patch: Partial<GuestInfo>) => void
}

export default function GuestInfoSection({ value, onChange }: Props) {
  return (
    <FormSection icon={User} title="ข้อมูลผู้เข้าพัก">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <FieldLabel htmlFor="guestName">ชื่อ-นามสกุล *</FieldLabel>
          <input
            id="guestName"
            type="text"
            value={value.guestName}
            onChange={(e) => onChange({ guestName: e.target.value })}
            placeholder="กรุณากรอกชื่อ-นามสกุล"
            className={INPUT_CLASS}
            required
          />
        </div>

        <div>
          <FieldLabel htmlFor="guestEmail">อีเมล</FieldLabel>
          <input
            id="guestEmail"
            type="email"
            value={value.guestEmail}
            onChange={(e) => onChange({ guestEmail: e.target.value })}
            placeholder="unknow@gmail.com"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <FieldLabel htmlFor="guestPhone">เบอร์โทรศัพท์</FieldLabel>
          <input
            id="guestPhone"
            type="tel"
            value={value.guestPhone}
            onChange={(e) => onChange({ guestPhone: e.target.value })}
            placeholder="(ไม่บังคับ)"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <FieldLabel htmlFor="guestCount">จำนวนคน</FieldLabel>
          <input
            id="guestCount"
            type="number"
            min="1"
            value={value.guestCount}
            onChange={(e) => onChange({ guestCount: parseInt(e.target.value) || 1 })}
            className={INPUT_CLASS}
          />
        </div>
      </div>
    </FormSection>
  )
}
