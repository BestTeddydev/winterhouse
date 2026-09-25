import { describe, expect, it } from 'vitest'
import { imageListReducer, validateImageFiles, type ImageListState } from './imageList'

const file = (name: string, type = 'image/png', size = 10) => new File([new Uint8Array(size)], name, { type })
const state = (urls: string[], cover = 0): ImageListState => ({ items: urls.map((url) => ({ url })), cover })

describe('imageListReducer', () => {
  it('keeps already uploaded images when a second batch is uploaded', () => {
    let s = state(['a.jpg'])
    s = imageListReducer(s, { type: 'add', items: [{ url: 'blob:1', file: file('1.png') }, { url: 'blob:2', file: file('2.png') }] })
    s = imageListReducer(s, { type: 'uploaded', uploads: [{ preview: 'blob:1', url: 'b.jpg' }, { preview: 'blob:2', url: 'c.jpg' }] })
    expect(s.items).toEqual([{ url: 'a.jpg' }, { url: 'b.jpg' }, { url: 'c.jpg' }])
  })

  it('removes exactly the clicked image, uploaded or pending', () => {
    let s: ImageListState = { items: [{ url: 'a.jpg' }, { url: 'blob:1', file: file('1.png') }, { url: 'b.jpg' }], cover: 0 }
    s = imageListReducer(s, { type: 'remove', index: 1 })
    expect(s.items.map((i) => i.url)).toEqual(['a.jpg', 'b.jpg'])
  })

  it('keeps the cover on the same image when an earlier one is removed', () => {
    const s = imageListReducer(state(['a', 'b', 'c'], 2), { type: 'remove', index: 0 })
    expect(s.items[s.cover].url).toBe('c')
  })

  it('moves the cover to a remaining image when the cover is removed', () => {
    expect(imageListReducer(state(['a', 'b'], 1), { type: 'remove', index: 1 }).cover).toBe(0)
  })

  it('loads existing images and finds the cover', () => {
    const s = imageListReducer(state([]), { type: 'reset', urls: ['a', '', '/placeholder.jpg', 'b'], cover: 'b' })
    expect(s).toEqual({ items: [{ url: 'a' }, { url: 'b' }], cover: 1 })
  })
})

describe('validateImageFiles', () => {
  it('accepts images up to 10MB only', () => {
    const { valid, errors } = validateImageFiles([file('ok.png'), file('doc.pdf', 'application/pdf'), file('big.png', 'image/png', 11 * 1024 * 1024)])
    expect(valid.map((f) => f.name)).toEqual(['ok.png'])
    expect(errors).toHaveLength(2)
  })
})
