import { Plus } from 'lucide-react'
import AddOnOptions from '@/components/booking/AddOnOptions'
import { FormSection } from './ui'

type Props = Omit<React.ComponentProps<typeof AddOnOptions>, 'listClassName'>

/** Extras section of the admin forms; hidden when there are none */
export default function AddOnsSection(props: Props) {
  if (props.addOns.length === 0) return null
  return (
    <FormSection icon={Plus} title="อ๊อฟชั่นเสริม">
      <AddOnOptions {...props} listClassName="space-y-3 mb-4" />
    </FormSection>
  )
}
