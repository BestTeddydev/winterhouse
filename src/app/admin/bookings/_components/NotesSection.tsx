import { MessageSquare } from 'lucide-react'
import { FieldLabel, FormSection, INPUT_CLASS } from './ui'

interface Props {
  specialRequests: string
  adminNotes: string
  onChange: (field: 'specialRequests' | 'adminNotes', value: string) => void
}

export default function NotesSection({ specialRequests, adminNotes, onChange }: Props) {
  return (
    <FormSection icon={MessageSquare} title="หมายเหตุและความต้องการพิเศษ">
      <div className="space-y-4">
        <div>
          <FieldLabel htmlFor="specialRequests">ความต้องการพิเศษ</FieldLabel>
          <textarea
            id="specialRequests"
            value={specialRequests}
            onChange={(e) => onChange('specialRequests', e.target.value)}
            rows={3}
            className={INPUT_CLASS}
            placeholder="เช่น ต้องการเตียงเสริม, อาหารพิเศษ, ฯลฯ"
          />
        </div>

        <div>
          <FieldLabel htmlFor="adminNotes">หมายเหตุสำหรับแอดมิน</FieldLabel>
          <textarea
            id="adminNotes"
            value={adminNotes}
            onChange={(e) => onChange('adminNotes', e.target.value)}
            rows={3}
            className={INPUT_CLASS}
            placeholder="เช่น จองผ่านโทรศัพท์, ลูกค้าสำคัญ, ฯลฯ"
          />
        </div>
      </div>
    </FormSection>
  )
}
