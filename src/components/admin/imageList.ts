// State of an image list in admin forms: already uploaded URLs plus local files waiting to be uploaded.

export interface ImageItem {
  /** Uploaded URL, or a blob: preview URL while the file is pending */
  url: string
  /** Set while the image has not been uploaded yet */
  file?: File
}

export interface ImageListState {
  items: ImageItem[]
  /** Index of the cover image (shown first in lists) */
  cover: number
}

export type ImageListAction =
  | { type: 'reset'; urls: string[]; cover?: string }
  | { type: 'add'; items: ImageItem[] }
  | { type: 'remove'; index: number }
  | { type: 'clear' }
  | { type: 'setCover'; index: number }
  /** Pending files were uploaded: swap each preview for its uploaded URL, in place */
  | { type: 'uploaded'; uploads: Array<{ preview: string; url: string }> }

export const isPending = (item: ImageItem) => !!item.file

export function imageListReducer(state: ImageListState, action: ImageListAction): ImageListState {
  switch (action.type) {
    case 'reset': {
      const items = action.urls.filter((u) => u && u.trim() !== '' && !u.includes('placeholder')).map((url) => ({ url }))
      const cover = Math.max(0, action.cover ? items.findIndex((i) => i.url === action.cover) : 0)
      return { items, cover }
    }
    case 'add':
      return { ...state, items: [...state.items, ...action.items] }
    case 'remove': {
      if (action.index < 0 || action.index >= state.items.length) return state
      const items = state.items.filter((_, i) => i !== action.index)
      let cover = state.cover
      if (action.index < cover) cover -= 1
      cover = Math.min(Math.max(cover, 0), Math.max(items.length - 1, 0))
      return { items, cover }
    }
    case 'clear':
      return { items: [], cover: 0 }
    case 'setCover':
      return action.index >= 0 && action.index < state.items.length ? { ...state, cover: action.index } : state
    case 'uploaded': {
      const byPreview = new Map(action.uploads.map((u) => [u.preview, u.url]))
      return { ...state, items: state.items.map((item) => (byPreview.has(item.url) ? { url: byPreview.get(item.url)! } : item)) }
    }
  }
}

/** Validates files picked in the browser (images up to 10MB); returns the valid ones and error messages */
export function validateImageFiles(files: File[]): { valid: File[]; errors: string[] } {
  const valid: File[] = []
  const errors: string[] = []
  for (const file of files) {
    if (!file.type.startsWith('image/')) errors.push(`ไฟล์ ${file.name} ไม่ใช่รูปภาพ`)
    else if (file.size > 10 * 1024 * 1024) errors.push(`ไฟล์ ${file.name} มีขนาดใหญ่เกินไป (สูงสุด 10MB)`)
    else valid.push(file)
  }
  return { valid, errors }
}
