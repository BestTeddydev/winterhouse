import type { z } from 'zod'
import User from '@/models/User'
import { badRequest, conflict, findOr404 } from '../errors'
import type { createUserSchema, updateUserSchema } from '../schemas/users'

const NOT_FOUND = 'ไม่พบผู้ใช้'

/** All users, or only those with `role` */
export const listUsers = (role?: string | null) => User.find(role ? { role } : {}).lean()

export const getUser = (id: string) => findOr404(User.findById(id), NOT_FOUND)

/** Email and LINE id must be unique */
export async function createUser(input: z.infer<typeof createUserSchema>) {
  const duplicates = [{ email: input.email }, ...(input.lineUserId ? [{ lineUserId: input.lineUserId }] : [])]
  if (await User.findOne({ $or: duplicates })) throw conflict('มีผู้ใช้อีเมลหรือ LINE ID นี้อยู่แล้ว')
  return User.create(input)
}

export const updateUser = (id: string, input: z.infer<typeof updateUserSchema>) =>
  findOr404(User.findByIdAndUpdate(id, input, { new: true, runValidators: true }), NOT_FOUND)

/** Admins can't delete their own account */
export async function deleteUser(id: string, currentUserId: string) {
  if (currentUserId === id) throw badRequest('ไม่สามารถลบบัญชีของตัวเองได้')
  await findOr404(User.findByIdAndDelete(id), NOT_FOUND)
}
