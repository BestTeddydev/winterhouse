import { apiRoute, created } from '@/server/http'
import { checkInSchema } from '@/server/schemas/attendance'
import { checkIn } from '@/server/services/attendance'

export const POST = apiRoute(
  { access: ['EMPLOYEE'], body: checkInSchema, errorMessage: 'ไม่สามารถเช็คอินได้' },
  async ({ body, session }) => created(await checkIn(body, session))
)
