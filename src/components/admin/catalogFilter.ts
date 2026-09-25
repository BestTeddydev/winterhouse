// Search + active/inactive filter of the admin room and camping block lists

export type CatalogStatusFilter = 'all' | 'active' | 'inactive'

interface Item {
  name: string
  description: string
  isActive: boolean
}

export function matchesCatalogFilter(item: Item, search: string, status: CatalogStatusFilter) {
  const needle = search.trim().toLowerCase()
  const found = !needle || item.name.toLowerCase().includes(needle) || item.description.toLowerCase().includes(needle)
  return found && (status === 'all' || (status === 'active') === item.isActive)
}
