#!/usr/bin/env node

/**
 * Migration script สำหรับอัพเดท Room pricing
 * 
 * สคริปต์นี้จะ:
 * 1. อ่าน rooms ทั้งหมดที่มีอยู่
 * 2. สร้าง pricing object จาก price เดิม
 * 3. ตั้งค่า pricing.weekday = pricing.weekend = pricing.holiday = room.price
 * 
 * ใช้งาน:
 *   node scripts/migrate-room-pricing.js
 */

const mongoose = require('mongoose')
require('dotenv').config()

const DATABASE_URL = process.env.DATABASE_URL || process.env.MONGODB_URI

if (!DATABASE_URL) {
  console.error('❌ Error: DATABASE_URL or MONGODB_URI environment variable is not set')
  process.exit(1)
}

async function migrateRoomPricing() {
  try {
    console.log('🚀 Connecting to MongoDB...')
    await mongoose.connect(DATABASE_URL)
    console.log('✅ Connected to MongoDB successfully')

    // Import Room model
    const Room = mongoose.models.Room || mongoose.model('Room', new mongoose.Schema({
      name: String,
      description: String,
      imageUrls: [String],
      price: Number,
      pricing: {
        weekday: Number,
        weekend: Number,
        holiday: Number
      },
      capacity: Number,
      amenities: [String],
      buildingId: mongoose.Schema.Types.ObjectId,
      isActive: Boolean
    }, { timestamps: true }))

    // Find all rooms
    const rooms = await Room.find({})
    console.log(`📦 Found ${rooms.length} rooms`)

    let updated = 0

    for (const room of rooms) {
      // Check if room already has pricing
      if (room.pricing && room.pricing.weekday) {
        console.log(`⏭️  Skipping room ${room.name} (already has pricing)`)
        continue
      }

      // Set pricing from base price
      const basePrice = room.price || 1000 // Default to 1000 if no price

      room.pricing = {
        weekday: basePrice,
        weekend: basePrice * 1.2, // Weekend 20% more expensive
        holiday: basePrice * 1.5  // Holiday 50% more expensive
      }

      await room.save()
      updated++
      console.log(`✅ Updated room: ${room.name}`)
      console.log(`   - Weekday: ${room.pricing.weekday} THB`)
      console.log(`   - Weekend: ${room.pricing.weekend} THB`)
      console.log(`   - Holiday: ${room.pricing.holiday} THB`)
    }

    console.log(`\n✅ Migration completed!`)
    console.log(`   - Total rooms: ${rooms.length}`)
    console.log(`   - Updated: ${updated}`)
    console.log(`   - Skipped: ${rooms.length - updated}`)

  } catch (error) {
    console.error('\n❌ Error:', error.message)
    if (error.stack) {
      console.error('\nStack trace:', error.stack)
    }
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    console.log('\n✅ Database connection closed')
  }
}

// Run the migration
migrateRoomPricing()

