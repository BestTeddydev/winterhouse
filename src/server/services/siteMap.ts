import { isValidId } from '@/lib/odm'
import Building from '@/models/Building'
import CampingBlock from '@/models/CampingBlock'
import Room from '@/models/Room'
import SiteMap from '@/models/SiteMap'
import { byDisplayOrder } from './catalog'
import type { MapType, SaveSiteMapInput } from '../schemas/siteMap'

const DEFAULTS: Record<MapType, { name: string; description: string }> = {
  accommodation: { name: 'แผนผังห้องพัก', description: 'แผนผังหลักของสถานที่' },
  camping: { name: 'แผนผังลานกางเต๊นท์', description: 'แผนผังลานกางเต๊นท์' },
}

/** The map image with one hotspot per building and the rooms/camping blocks in it */
export async function getSiteMap(type: MapType) {
  const [siteMap, buildings, rooms, blocks] = await Promise.all([
    SiteMap.findOne({ isActive: true, type }).sort({ updatedAt: -1 }),
    // Accommodation maps show every building except camping spots; camping maps only those
    Building.find({ isActive: true, buildingType: type === 'camping' ? 'camping' : { $ne: 'camping' } }),
    type === 'accommodation' ? Room.find({ isActive: true }).select('_id buildingId').lean() : [],
    type === 'camping' ? CampingBlock.find({ isActive: true }).select('_id buildingId').lean() : [],
  ])

  const idsIn = (items: Array<{ _id: string; buildingId?: string }>, buildingId: string) =>
    items.filter((i) => String(i.buildingId) === buildingId).map((i) => i._id)

  return {
    // Until an admin uploads a map, show a placeholder (without saving anything)
    imageUrl: siteMap?.imageUrl ?? '/placeholder-map.svg',
    type,
    name: siteMap?.name ?? DEFAULTS[type].name,
    description: siteMap?.description ?? DEFAULTS[type].description,
    hotspots: [...buildings].sort(byDisplayOrder).map((b: any) => ({
      id: b._id,
      x: b.x,
      y: b.y,
      buildingName: b.name,
      buildingType: b.buildingType,
      description: b.description,
      facilities: b.facilities,
      rooms: idsIn(rooms, b._id),
      ...(type === 'camping' && { campingBlocks: idsIn(blocks, b._id) }),
    })),
  }
}

/** Saves the map image and hotspot positions; on camping maps also which blocks belong to each spot */
export async function saveSiteMap(input: SaveSiteMapInput) {
  for (const hotspot of input.hotspots ?? []) {
    if (!isValidId(hotspot.id)) continue
    // Blank names/descriptions keep the stored values (both are required on buildings)
    await Building.findByIdAndUpdate(hotspot.id, {
      name: hotspot.buildingName || undefined,
      description: hotspot.description || undefined,
      buildingType: hotspot.buildingType,
      facilities: hotspot.facilities,
      x: hotspot.x,
      y: hotspot.y,
    })
    if (input.type === 'camping' && hotspot.campingBlocks) {
      await CampingBlock.updateMany({ buildingId: hotspot.id }, { $unset: { buildingId: 1 } })
      const blockIds = hotspot.campingBlocks.filter(isValidId)
      if (blockIds.length) await CampingBlock.updateMany({ _id: { $in: blockIds } }, { buildingId: hotspot.id })
    }
  }

  const existing = await SiteMap.findOne({ isActive: true, type: input.type })
  const siteMap = existing
    ? await SiteMap.findByIdAndUpdate(
        existing._id,
        { imageUrl: input.imageUrl, ...(input.name && { name: input.name }), ...(input.description && { description: input.description }) },
        { new: true }
      )
    : await SiteMap.create({
        type: input.type,
        imageUrl: input.imageUrl,
        name: input.name || DEFAULTS[input.type].name,
        description: input.description || DEFAULTS[input.type].description,
      })

  return {
    success: true,
    message: 'บันทึกแผนผังสำเร็จ',
    data: { id: siteMap._id, name: siteMap.name, description: siteMap.description, imageUrl: siteMap.imageUrl },
  }
}
