import { z } from 'zod'
import { isValidId } from '@/lib/odm'

export const objectId = (label = 'ID') =>
  z.string({ message: `ต้องระบุ ${label}` }).refine(isValidId, { message: `รูปแบบ ${label} ไม่ถูกต้อง` })

/** Values the frontend sends for "nothing selected" */
const isBlank = (v: unknown) => v === undefined || v === null || v === '' || v === 'null'

/** Optional id: blank values ('', null, 'null') become undefined */
export const optionalId = (label = 'ID') => z.preprocess((v) => (isBlank(v) ? undefined : v), objectId(label).optional())

/** Optional id list: blank entries are dropped, an empty list becomes undefined */
export const optionalIdList = (label = 'ID') =>
  z.preprocess((v) => {
    if (!Array.isArray(v)) return isBlank(v) ? undefined : v
    const ids = v.filter((x) => !isBlank(x))
    return ids.length ? ids : undefined
  }, z.array(objectId(label)).optional())

/** A date ("YYYY-MM-DD" or ISO string) */
export const dateInput = (label: string) =>
  z.coerce.date({ message: `รูปแบบ${label}ไม่ถูกต้อง` }).refine((d) => !Number.isNaN(d.getTime()), `รูปแบบ${label}ไม่ถูกต้อง`)

/** Optional trimmed text; blank becomes undefined */
export const optionalText = (max = 2000) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), z.string().trim().max(max).optional())

export const money = (label: string) => z.coerce.number({ message: `${label}ไม่ถูกต้อง` }).min(0, `${label}ต้องไม่ติดลบ`)

export const pageQuery = {
  page: z.coerce.number().int().min(1).catch(1).default(1),
  limit: z.coerce.number().int().min(1).max(10000).catch(20).default(20),
}
