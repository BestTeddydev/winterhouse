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

const path = require('path')
const { randomBytes } = require('crypto')
const { initializeApp, cert, applicationDefault } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')

// Firebase credentials: FIREBASE_SERVICE_ACCOUNT_KEY (JSON), GOOGLE_APPLICATION_CREDENTIALS, or secrets/baanlomnow-firebase.json
const keyFile = path.join(__dirname, '..', 'secrets', 'baanlomnow-firebase.json')
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
  : !process.env.GOOGLE_APPLICATION_CREDENTIALS && require('fs').existsSync(keyFile)
    ? require(keyFile)
    : null
initializeApp({
  credential: serviceAccount ? cert(serviceAccount) : applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount?.project_id,
})
const users = getFirestore().collection('users')

// Same 24-hex id format the app uses (ObjectId compatible)
function newId() {
  return Math.floor(Date.now() / 1000).toString(16).padStart(8, '0') + randomBytes(8).toString('hex')
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

    console.log('✅ Connected to MongoDB successfully')

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
    const snapshot = await users.where('email', '==', userEmail).limit(1).get()
    const existingUser = snapshot.empty ? null : { _id: snapshot.docs[0].id, ...snapshot.docs[0].data() }

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
          await users.doc(existingUser._id).update({ role: 'ADMIN', updatedAt: new Date() })
          console.log('\n✅ User promoted to ADMIN successfully!')
        } else {
          console.log('\n❌ Operation cancelled')
        }
      }
    } else {
      // Create new user
      console.log('\n📝 Creating new admin user...')
      
      const { _id, ...data } = {
        _id: newId(),
        name: userName,
        email: userEmail,
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      const newUser = { _id, ...data }

      await users.doc(_id).set(data)

      console.log('\n✅ Admin user created successfully!')
      console.log('📋 User details:')
      console.log('  - ID:', newUser._id)
      console.log('  - Name:', newUser.name)
      console.log('  - Email:', newUser.email)
      console.log('  - Role:', newUser.role)
    }

    // Show all admin users
    console.log('\n👥 All ADMIN users:')
    const adminUsers = (await users.where('role', '==', 'ADMIN').get()).docs.map((doc) => ({ _id: doc.id, ...doc.data() }))
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
    rl.close()
  }
}

// Run the script
createAdminUser()

