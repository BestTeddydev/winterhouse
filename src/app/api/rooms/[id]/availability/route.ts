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
    
    // Get bookings for the next 90 days (3 months)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 1) // Include past bookings that haven't checked out yet
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + 90)
    
    const bookings = await Booking.find({
      $or: [
        // Single room bookings
        { roomId: new mongoose.Types.ObjectId(roomId) },
        // Multi-room bookings where this room is included
        { roomIds: new mongoose.Types.ObjectId(roomId) },
        // Room details in rooms array
        { 'rooms.roomId': new mongoose.Types.ObjectId(roomId) }
      ],
      status: { $in: ['PENDING', 'CONFIRMED'] },
      // Find bookings that overlap with the date range
      $and: [
        { checkIn: { $lt: endDate } }, // Existing check-in is before end date
        { checkOut: { $gt: startDate } }  // Existing check-out is after start date
      ]
    }).select('checkIn checkOut status')
    
    // Create availability map for the next 90 days
    const availability: { [key: string]: 'available' | 'booked' | 'partial' } = {}
    
    // Include today and next 90 days
    for (let i = -1; i < 90; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      availability[dateStr] = 'available'
    }
    
    // Mark booked dates
    // Mark dates as booked from check-in day to check-out day (exclusive)
    // This allows new guests to check-in on the same day as previous guest's check-out
    bookings.forEach(booking => {
      const checkIn = new Date(booking.checkIn)
      const checkOut = new Date(booking.checkOut)
      
      // Mark dates as booked from check-in day to check-out day (exclusive)
      // Check-out day should be available for new check-ins
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