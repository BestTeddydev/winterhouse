import { apiRoute } from '@/server/http'
import { checkOutSchema } from '@/server/schemas/attendance'
import { checkOut } from '@/server/services/attendance'

export const POST = apiRoute(
  { access: ['EMPLOYEE'], body: checkOutSchema, errorMessage: 'ไม่สามารถเช็คเอาท์ได้' },
  ({ body, session }) => checkOut(body, session)
)
