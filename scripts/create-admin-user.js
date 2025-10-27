#!/usr/bin/env node

/**
 * Script สำหรับสร้าง Admin User
 * 
 * ใช้งาน:
 *   node scripts/create-admin-user.js
 * 
 * หรือ:
 *   node scripts/create-admin-user.js --email user@example.com --name "Admin User"
 */

const mongoose = require('mongoose')
const readline = require('readline')

// Get MongoDB URI from environment
const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI

if (!MONGODB_URI) {
  console.error('❌ Error: DATABASE_URL or MONGODB_URI environment variable is not set')
  process.exit(1)
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// Function to ask question
function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer)
    })
  })
}

// Parse command line arguments
const args = process.argv.slice(2)
let email = ''
let name = ''

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--email' && args[i + 1]) {
    email = args[i + 1]
    i++
  } else if (args[i] === '--name' && args[i + 1]) {
    name = args[i + 1]
    i++
  }
}

async function createAdminUser() {
  try {
    console.log('🚀 Connecting to MongoDB...')
    await mongoose.connect(MONGODB_URI)
    console.log('✅ Connected to MongoDB successfully')

    // Import User model
    const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
      name: String,
      email: String,
      emailVerified: Date,
      image: String,
      lineUserId: String,
      role: { type: String, enum: ['ADMIN', 'CUSTOMER'], default: 'CUSTOMER' }
    }, { timestamps: true }))

    // Get user input
    let userEmail = email
    let userName = name

    if (!userEmail) {
      userEmail = await askQuestion('📧 Enter email: ')
    }

    if (!userName) {
      userName = await askQuestion('👤 Enter name: ')
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: userEmail })

    if (existingUser) {
      console.log('\n⚠️  User already exists!')
      console.log('📋 Current user info:')
      console.log('  - Name:', existingUser.name)
      console.log('  - Email:', existingUser.email)
      console.log('  - Role:', existingUser.role)
      console.log('  - LINE User ID:', existingUser.lineUserId || 'N/A')

      if (existingUser.role === 'ADMIN') {
        console.log('\n✅ User is already an ADMIN')
      } else {
        const confirm = await askQuestion(`\n❓ Do you want to promote this user to ADMIN? (yes/no): `)
        
        if (confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'y') {
          existingUser.role = 'ADMIN'
          await existingUser.save()
          console.log('\n✅ User promoted to ADMIN successfully!')
        } else {
          console.log('\n❌ Operation cancelled')
        }
      }
    } else {
      // Create new user
      console.log('\n📝 Creating new admin user...')
      
      const newUser = new User({
        name: userName,
        email: userEmail,
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date()
      })

      await newUser.save()

      console.log('\n✅ Admin user created successfully!')
      console.log('📋 User details:')
      console.log('  - ID:', newUser._id)
      console.log('  - Name:', newUser.name)
      console.log('  - Email:', newUser.email)
      console.log('  - Role:', newUser.role)
    }

    // Show all admin users
    console.log('\n👥 All ADMIN users:')
    const adminUsers = await User.find({ role: 'ADMIN' })
    adminUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.name}`)
      console.log('   Email:', user.email)
      console.log('   ID:', user._id)
    })

    console.log('\n✅ Done!')
    
  } catch (error) {
    console.error('\n❌ Error:', error.message)
    if (error.stack) {
      console.error('\nStack trace:', error.stack)
    }
    process.exit(1)
  } finally {
    await mongoose.disconnect()
    rl.close()
  }
}

// Run the script
createAdminUser()

