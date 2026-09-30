import { describe, expect, it, vi } from 'vitest'
import * as videoRoute from '@/app/api/upload/video/route'
import * as roomsRoute from '@/app/api/rooms/route'
import * as roomRoute from '@/app/api/rooms/[id]/route'
import { createUser } from '../support/factories'
import { call } from '../support/http'
import { signInAs } from '../support/mocks'

// Signing needs real storage credentials; the route's own rules are what is tested here
const createDirectUpload = vi.hoisted(() =>
  vi.fn(async (filename: string, contentType: string, maxBytes: number) => ({
    uploadUrl: `https://storage.test/${filename}?signed`,
    headers: { 'Content-Type': contentType, 'x-goog-content-length-range': `0,${maxBytes}` },
    url: `https://firebasestorage.test/${filename}`,
  }))
)
vi.mock('@/lib/storage', async (importOriginal) => ({ ...(await importOriginal<typeof import('@/lib/storage')>()), createDirectUpload }))

const start = (body: Record<string, unknown>) => call(videoRoute.POST, 'POST', { body })
const clip = { fileName: 'ห้อง A tour.mp4', contentType: 'video/mp4', size: 50 * 1024 * 1024 }

describe('POST /api/upload/video', () => {
  it('is for staff only', async () => {
    expect((await start(clip)).status).toBe(401)
    signInAs(await createUser())
    expect((await start(clip)).status).toBe(403)
  })

  it('hands out a signed upload for a video, limited to 200MB', async () => {
    signInAs(await createUser({ role: 'OWNER' }))
    const res = await start(clip)
    expect(res.status).toBe(200)
    expect(res.body.uploadUrl).toContain('uploads/videos/')
    expect(res.body.url).toMatch(/^https:\/\/firebasestorage\.test\/uploads\/videos\/\d+-.*tour\.mp4$/)
    expect(createDirectUpload).toHaveBeenCalledWith(expect.stringMatching(/^uploads\/videos\//), 'video/mp4', 200 * 1024 * 1024)
  })

  it('refuses other files and videos over 200MB', async () => {
    signInAs(await createUser({ role: 'ADMIN' }))
    expect((await start({ ...clip, contentType: 'application/pdf' })).status).toBe(400)
    expect((await start({ ...clip, size: 201 * 1024 * 1024 })).status).toBe(400)
    expect(createDirectUpload).not.toHaveBeenCalled()
  })
})

describe('room videos', () => {
  it('are saved with the room and listed for the rooms page', async () => {
    signInAs(await createUser({ role: 'ADMIN' }))
    const videoUrls = ['https://firebasestorage.test/uploads/videos/1-tour.mp4']
    const created = await call(roomsRoute.POST, 'POST', {
      body: { name: 'R', description: 'd', imageUrls: ['u'], price: 1000, capacity: 2, videoUrls },
    })
    expect(created.status).toBe(201)
    expect((await call(roomsRoute.GET, 'GET')).body[0].videoUrls).toEqual(videoUrls)

    // Removing every clip
    const cleared = await call(roomRoute.PUT, 'PUT', { params: { id: created.body._id }, body: { videoUrls: [] } })
    expect(cleared.body.videoUrls).toEqual([])
    expect((await call(roomRoute.PUT, 'PUT', { params: { id: created.body._id }, body: { videoUrls: ['not a url'] } })).status).toBe(400)
  })
})
