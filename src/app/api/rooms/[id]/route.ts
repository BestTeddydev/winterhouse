import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Room from '@/models/Room'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    const room = await Room.findById(params.id)

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error fetching room:', error)
    return NextResponse.json({ error: 'Failed to fetch room' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, description, imageUrl, imageUrls, price, 
      capacity, amenities, hotspots, isActive, pricing 
    } = body

    await connectDB()
    
    const updateData: any = {
      name,
      description,
      price,
      capacity,
      amenities,
      hotspots,
      isActive,
    }

    // Handle imageUrls - allow empty array to clear all images
    if (imageUrls !== undefined) {
      // Filter out empty strings and invalid URLs
      const validUrls = Array.isArray(imageUrls) 
        ? imageUrls.filter((url: string) => url && url.trim() !== '' && !url.includes('placeholder'))
        : []
      updateData.imageUrls = validUrls
      // Set imageUrl to first valid URL or empty string
      updateData.imageUrl = validUrls.length > 0 ? validUrls[0] : ''
    } else if (imageUrl) {
      updateData.imageUrls = [imageUrl]
      updateData.imageUrl = imageUrl
    }

    // Add pricing if provided
    if (pricing && (pricing.weekday || pricing.weekend || pricing.holiday)) {
      updateData.pricing = {
        weekday: pricing.weekday || price,
        weekend: pricing.weekend || pricing.weekday || price,
        holiday: pricing.holiday || pricing.weekday || price
      }
    }

    const room = await Room.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    )

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    return NextResponse.json(room)
  } catch (error) {
    console.error('Error updating room:', error)
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()
    await Room.findByIdAndDelete(params.id)

    return NextResponse.json({ message: 'Room deleted successfully' })
  } catch (error) {
    console.error('Error deleting room:', error)
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 })
  }
}

