import { apiRoute } from '@/server/http'
import { listPublicStays } from '@/server/services/availability'

export const dynamic = 'force-dynamic'

/** Confirmed stays that haven't ended yet, without guest data (public availability) */
export const GET = apiRoute({ access: 'public', errorMessage: 'ไม่สามารถดึงข้อมูลการจองได้' }, () => listPublicStays())
