import { NextRequest, NextResponse } from 'next/server'
import { deleteFile } from '@/lib/fileUtils'

export async function DELETE(request: NextRequest) {
  try {
    const { filename } = await request.json()

    if (!filename) {
      return NextResponse.json(
        { error: 'ไม่พบชื่อไฟล์' },
        { status: 400 }
      )
    }

    // Delete file using utility function
    await deleteFile(filename)

    return NextResponse.json({ 
      message: 'ลบไฟล์สำเร็จ',
      filename 
    })

  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'เกิดข้อผิดพลาดในการลบไฟล์' },
      { status: 500 }
    )
  }
}
