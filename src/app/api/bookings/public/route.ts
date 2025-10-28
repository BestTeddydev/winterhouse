import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Booking from '@/models/Booking'
import mongoose from 'mongoose'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    
    // Set strictPopulate to false to avoid schema validation errors
    mongoose.set('strictPopulate', false)
    
    // Ensure models are registered
    if (!mongoose.models.Room) {
      require('@/models/Room')
    }
    if (!mongoose.models.Booking) {
      require('@/models/Booking')
    }

    // Fetch only confirmed and pending bookings
    const bookings = await Booking.find({
      status: { $in: ['PENDING', 'CONFIRMED'] }
    }).select('roomId roomIds rooms checkIn checkOut status').lean()

    // Transform the data to match frontend expectations
    const transformedBookings = bookings.map(booking => ({
      ...booking,
      id: (booking._id as mongoose.Types.ObjectId).toString()
    }))

    return NextResponse.json(transformedBookings)
  } catch (error) {
    console.error('Error fetching public bookings:', error)
    
    // Handle specific error types
    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json({ 
        error: `รูปแบบ ID ไม่ถูกต้อง: ${error.path}` 
      }, { status: 400 })
    }
    
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ 
        error: 'ข้อมูลไม่ถูกต้อง', 
        details: Object.values(error.errors).map(err => err.message)
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลการจองได้' }, { status: 500 })
  }
}

