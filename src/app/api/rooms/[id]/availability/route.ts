import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import Booking from '@/models/Booking'
import mongoose from 'mongoose'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB()
    
    const roomId = params.id
    
    // Get bookings for the next 30 days
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 30)
    
    const bookings = await Booking.find({
      roomId: new mongoose.Types.ObjectId(roomId),
      status: { $in: ['PENDING', 'CONFIRMED'] },
      $or: [
        {
          checkIn: { $gte: startDate, $lte: endDate }
        },
        {
          checkOut: { $gte: startDate, $lte: endDate }
        },
        {
          $and: [
            { checkIn: { $lte: startDate } },
            { checkOut: { $gte: endDate } }
          ]
        }
      ]
    }).select('checkIn checkOut status')
    
    // Create availability map for the next 30 days
    const availability: { [key: string]: 'available' | 'booked' | 'partial' } = {}
    
    for (let i = 0; i < 30; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      availability[dateStr] = 'available'
    }
    
    // Mark booked dates
    bookings.forEach(booking => {
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)
      
      const current = new Date(checkIn)
      while (current < checkOut) {
        const dateStr = current.toISOString().split('T')[0]
        if (availability[dateStr]) {
          availability[dateStr] = 'booked'
        }
        current.setDate(current.getDate() + 1)
      }
    })
    
    return NextResponse.json({
      roomId,
      availability,
      bookings: bookings.map(booking => ({
        id: booking._id,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        status: booking.status
      }))
    })
  } catch (error) {
    console.error('Error fetching room availability:', error)
    return NextResponse.json({ error: 'ไม่สามารถโหลดข้อมูลการจองได้' }, { status: 500 })
  }
}