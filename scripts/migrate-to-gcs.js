import { readdir, readFile, unlink } from 'fs/promises'
import { join } from 'path'
import { uploadToGCS } from './src/lib/gcs'

async function migrateLocalFilesToGCS() {
  try {
    console.log('Starting migration of local files to Google Cloud Storage...')
    
    const uploadsDir = join(process.cwd(), 'public', 'uploads')
    
    // Read all files in uploads directory
    const files = await readdir(uploadsDir)
    
    console.log(`Found ${files.length} files to migrate`)
    
    for (const filename of files) {
      try {
        console.log(`Migrating ${filename}...`)
        
        // Read file
        const filePath = join(uploadsDir, filename)
        const fileBuffer = await readFile(filePath)
        
        // Determine content type
        const extension = filename.split('.').pop()?.toLowerCase()
        let contentType = 'application/octet-stream'
        
        switch (extension) {
          case 'jpg':
          case 'jpeg':
            contentType = 'image/jpeg'
            break
          case 'png':
            contentType = 'image/png'
            break
          case 'gif':
            contentType = 'image/gif'
            break
          case 'webp':
            contentType = 'image/webp'
            break
        }
        
        // Upload to GCS
        const gcsFilename = `uploads/${filename}`
        const url = await uploadToGCS(fileBuffer, gcsFilename, contentType)
        
        console.log(`✅ Migrated ${filename} -> ${url}`)
        
        // Delete local file (optional - comment out if you want to keep backup)
        // await unlink(filePath)
        // console.log(`🗑️ Deleted local file ${filename}`)
        
      } catch (error) {
        console.error(`❌ Failed to migrate ${filename}:`, error)
      }
    }
    
    console.log('Migration completed!')
    
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateLocalFilesToGCS()
}

export { migrateLocalFilesToGCS }
