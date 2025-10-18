/**
 * Migration Script: อัปเดตข้อมูลเก่าให้รองรับ Building schema ใหม่
 * 
 * วิธีการใช้งาน:
 * 1. เรียกใช้ script นี้ใน MongoDB shell หรือ Node.js
 * 2. Script จะสร้าง Building จาก hotspots ใน SiteMap
 * 3. อัปเดต Room documents ให้มี buildingId
 */

const mongoose = require('mongoose');

// Schema definitions (ต้องตรงกับ models ใหม่)
const BuildingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  buildingType: {
    type: String,
    enum: ['accommodation', 'cafe', 'restaurant', 'facility', 'parking', 'garden'],
    default: 'accommodation'
  },
  facilities: [{ type: String }],
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  price: { type: Number, required: true },
  capacity: { type: Number, required: true },
  amenities: [{ type: String }],
  buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Building' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const SiteMapSchema = new mongoose.Schema({
  name: { type: String, required: true, default: 'แผนผังหลัก' },
  description: { type: String, default: '' },
  imageUrl: { type: String, required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

async function migrateData() {
  try {
    console.log('🚀 เริ่มการ Migration...');
    
    // เชื่อมต่อ MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/winterhouse');
    console.log('✅ เชื่อมต่อ MongoDB สำเร็จ');

    // สร้าง collections ใหม่
    const Building = mongoose.model('Building', BuildingSchema);
    const Room = mongoose.model('Room', RoomSchema);
    const SiteMap = mongoose.model('SiteMap', SiteMapSchema);

    // 1. ดึงข้อมูล SiteMap เก่า
    const oldSiteMap = await mongoose.connection.db.collection('sitemaps').findOne();
    
    if (!oldSiteMap) {
      console.log('⚠️  ไม่พบข้อมูล SiteMap เก่า');
      return;
    }

    console.log(`📋 พบ SiteMap เก่าที่มี ${oldSiteMap.hotspots?.length || 0} hotspots`);

    // 2. สร้าง Building จาก hotspots เก่า
    if (oldSiteMap.hotspots && oldSiteMap.hotspots.length > 0) {
      for (const hotspot of oldSiteMap.hotspots) {
        // สร้าง Building ใหม่
        const building = new Building({
          name: hotspot.buildingName || 'อาคารใหม่',
          description: hotspot.description || '',
          buildingType: hotspot.buildingType || 'accommodation',
          facilities: hotspot.facilities || [],
          x: hotspot.x || 50,
          y: hotspot.y || 50,
          isActive: true
        });

        const savedBuilding = await building.save();
        console.log(`✅ สร้าง Building: ${savedBuilding.name} (ID: ${savedBuilding._id})`);

        // 3. อัปเดต Room ที่เกี่ยวข้อง
        if (hotspot.rooms && hotspot.rooms.length > 0) {
          for (const roomId of hotspot.rooms) {
            try {
              await mongoose.connection.db.collection('rooms').updateOne(
                { _id: new mongoose.Types.ObjectId(roomId) },
                { 
                  $set: { 
                    buildingId: savedBuilding._id,
                    isActive: true // อัปเดต status เป็น isActive
                  }
                }
              );
              console.log(`  ✅ อัปเดต Room: ${roomId}`);
            } catch (error) {
              console.log(`  ⚠️  ไม่พบ Room: ${roomId}`);
            }
          }
        }
      }
    }

    // 4. สร้าง SiteMap ใหม่
    const newSiteMap = new SiteMap({
      name: 'แผนผังหลัก',
      description: 'แผนผังหลักของสถานที่',
      imageUrl: oldSiteMap.imageUrl || '/placeholder-map.jpg',
      isActive: true
    });

    await newSiteMap.save();
    console.log('✅ สร้าง SiteMap ใหม่สำเร็จ');

    // 5. อัปเดต Room ที่ไม่มี buildingId (สำหรับ Room ที่ไม่ได้อยู่ใน hotspot)
    const roomsWithoutBuilding = await mongoose.connection.db.collection('rooms').find({
      buildingId: { $exists: false }
    }).toArray();

    if (roomsWithoutBuilding.length > 0) {
      // สร้าง Building default สำหรับ Room ที่ไม่มี building
      const defaultBuilding = new Building({
        name: 'อาคารทั่วไป',
        description: 'อาคารสำหรับห้องพักทั่วไป',
        buildingType: 'accommodation',
        facilities: [],
        x: 50,
        y: 50,
        isActive: true
      });

      const savedDefaultBuilding = await defaultBuilding.save();
      console.log(`✅ สร้าง Building เริ่มต้น: ${savedDefaultBuilding.name}`);

      // อัปเดต Room ทั้งหมดให้อยู่ใน Building เริ่มต้น
      await mongoose.connection.db.collection('rooms').updateMany(
        { buildingId: { $exists: false } },
        { 
          $set: { 
            buildingId: savedDefaultBuilding._id,
            isActive: true
          }
        }
      );
      console.log(`✅ อัปเดต ${roomsWithoutBuilding.length} Room ให้อยู่ใน Building เริ่มต้น`);
    }

    console.log('🎉 Migration เสร็จสิ้น!');
    console.log('\n📊 สรุปการ Migration:');
    console.log(`- สร้าง Building ใหม่: ${oldSiteMap.hotspots?.length || 0} อาคาร`);
    console.log(`- อัปเดต Room ทั้งหมดให้มี buildingId`);
    console.log(`- สร้าง SiteMap ใหม่`);

  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาดในการ Migration:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 ปิดการเชื่อมต่อ MongoDB');
  }
}

// รัน migration
if (require.main === module) {
  migrateData();
}

module.exports = { migrateData };
