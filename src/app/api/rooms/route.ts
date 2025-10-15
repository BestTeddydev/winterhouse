import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Room from '@/models/Room'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const rooms = await Room.find({ isActive: true }).sort({ createdAt: -1 })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, imageUrl, price, capacity, amenities, hotspots } = body

    await connectDB()
    const room = new Room({
      name,
      description,
      imageUrl,
      price,
      capacity,
      amenities,
      hotspots,
    })

    await room.save()

    return NextResponse.json(room, { status: 201 })
  } catch (error) {
    console.error('Error creating room:', error)
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 })
  }
}

