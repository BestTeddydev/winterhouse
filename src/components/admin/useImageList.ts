'use client'

import { useCallback, useEffect, useReducer, useRef, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { imageListReducer, isPending, validateImageFiles } from './imageList'

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  const response = await axios.post('/api/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
  return response.data.url
}

/**
 * Image list for admin forms: add local files (shown as previews), upload them, remove,
 * pick the cover. `uploadPending()` returns the final URL list, so a form can upload on save.
 */
export function useImageList(initialUrls: string[] = [], initialCover?: string) {
  const [state, dispatch] = useReducer(imageListReducer, { items: [], cover: 0 })
  const [uploading, setUploading] = useState(false)
  const stateRef = useRef(state)
  stateRef.current = state

  const reset = useCallback((urls: string[], cover?: string) => dispatch({ type: 'reset', urls, cover }), [])

  useEffect(() => {
    if (initialUrls.length) reset(initialUrls, initialCover)
    // Only the initial values: later changes come from the user
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Free preview URLs when the form goes away
  useEffect(
    () => () => stateRef.current.items.filter(isPending).forEach((item) => URL.revokeObjectURL(item.url)),
    []
  )

  const addFiles = (files: File[]) => {
    const { valid, errors } = validateImageFiles(files)
    errors.forEach((message) => toast.error(message))
    if (valid.length) dispatch({ type: 'add', items: valid.map((file) => ({ url: URL.createObjectURL(file), file })) })
  }

  const remove = (index: number) => {
    const item = stateRef.current.items[index]
    if (item && isPending(item)) URL.revokeObjectURL(item.url)
    dispatch({ type: 'remove', index })
  }

  const clear = () => {
    stateRef.current.items.filter(isPending).forEach((item) => URL.revokeObjectURL(item.url))
    dispatch({ type: 'clear' })
  }

  /** Uploads pending files and returns all URLs (in order) and the cover URL */
  const uploadPending = async (): Promise<{ urls: string[]; cover: string | undefined }> => {
    const { items, cover } = stateRef.current
    const pending = items.filter(isPending)
    if (pending.length === 0) return { urls: items.map((i) => i.url), cover: items[cover]?.url }

    setUploading(true)
    try {
      const uploaded = await Promise.all(pending.map(async (item) => ({ preview: item.url, url: await uploadImage(item.file!) })))
      pending.forEach((item) => URL.revokeObjectURL(item.url))
      dispatch({ type: 'uploaded', uploads: uploaded })
      toast.success(`อัปโหลดรูปภาพ ${uploaded.length} รูปสำเร็จ`)
      const byPreview = new Map(uploaded.map((u) => [u.preview, u.url]))
      const urls = items.map((i) => byPreview.get(i.url) ?? i.url)
      return { urls, cover: urls[cover] }
    } finally {
      setUploading(false)
    }
  }

  return {
    items: state.items,
    cover: state.cover,
    pendingCount: state.items.filter(isPending).length,
    uploading,
    addFiles,
    remove,
    clear,
    setCover: (index: number) => dispatch({ type: 'setCover', index }),
    reset,
    uploadPending,
  }
}

export type ImageListController = ReturnType<typeof useImageList>
