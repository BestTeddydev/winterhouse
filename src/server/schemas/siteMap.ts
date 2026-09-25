import { z } from 'zod'
import { BUILDING_TYPES } from '@/lib/buildingTypes'

export const MAP_TYPES = ['accommodation', 'camping'] as const
export type MapType = (typeof MAP_TYPES)[number]

export const siteMapQuery = z.object({
  type: z.enum(MAP_TYPES).catch('accommodation').default('accommodation'),
})

const hotspot = z.object({
  id: z.string(),
  buildingName: z.string().trim().optional(),
  description: z.string().optional(),
  buildingType: z.enum(BUILDING_TYPES).optional().catch(undefined),
  facilities: z.array(z.string()).default([]),
  x: z.coerce.number().min(0).max(100),
  y: z.coerce.number().min(0).max(100),
  campingBlocks: z.array(z.string()).optional(),
})

export const saveSiteMapSchema = z.object({
  imageUrl: z.string({ message: 'กรุณาระบุรูปภาพแผนผัง' }).trim().min(1, 'กรุณาระบุรูปภาพแผนผัง'),
  name: z.string().trim().optional(),
  description: z.string().trim().optional(),
  type: z.enum(MAP_TYPES).default('accommodation'),
  hotspots: z.array(hotspot).optional(),
})

export type SaveSiteMapInput = z.infer<typeof saveSiteMapSchema>
