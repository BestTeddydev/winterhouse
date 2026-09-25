import { formatCurrency, formatDate } from '@/lib/utils'

// Plain-text report of bookings grouped by check-in date (admin "download" button)
export function buildBookingsReport(bookings: any[]): string {
  // Sort bookings by check-in date for grouping
  const sortedBookings = [...bookings].sort((a: any, b: any) => {
    const dateA = a.checkIn ? new Date(a.checkIn).getTime() : 0
    const dateB = b.checkIn ? new Date(b.checkIn).getTime() : 0
    return dateA - dateB
  })

  // Group bookings by check-in date
  const groupedBookings = new Map<string, any[]>()
  sortedBookings.forEach((booking: any) => {
    const checkInDate = booking.checkIn 
      ? new Date(booking.checkIn).toISOString().split('T')[0]
      : 'N/A'
    
    if (!groupedBookings.has(checkInDate)) {
      groupedBookings.set(checkInDate, [])
    }
    groupedBookings.get(checkInDate)!.push(booking)
  })

  // Format bookings data as text
  let textContent = 'รายละเอียดการจองทั้งหมด\n'
  textContent += '='.repeat(80) + '\n'
  textContent += `จำนวนทั้งหมด: ${bookings.length} รายการ\n`
  textContent += `วันที่ดาวน์โหลด: ${formatDate(new Date())}\n`
  textContent += '='.repeat(80) + '\n\n'

  let globalIndex = 1
  let totalRevenue = 0
  let totalDiscount = 0

  // Iterate through grouped bookings
  Array.from(groupedBookings.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .forEach(([checkInDateStr, groupBookings]) => {
      // Group header
      const checkInDateFormatted = checkInDateStr !== 'N/A'
        ? formatDate(new Date(checkInDateStr))
        : 'วันที่ไม่ระบุ'
      
      textContent += `\n${'='.repeat(80)}\n`
      textContent += `วันที่เช็คอิน: ${checkInDateFormatted}\n`
      textContent += `จำนวนการจอง: ${groupBookings.length} รายการ\n`
      textContent += `${'='.repeat(80)}\n\n`

      // Group totals
      let groupTotalRevenue = 0
      let groupTotalDiscount = 0

      // Display bookings in this group
      groupBookings.forEach((booking: any) => {
        // Get room name(s)
        const roomNames = booking.rooms && booking.rooms.length > 0
          ? booking.rooms.map((r: any) => r?.name || 'N/A').join(', ')
          : booking.room?.name || 'N/A'
        
        // Get camping block name(s) with guest counts
        let campingBlockNames = ''
        if (booking.campingBlocks && booking.campingBlocks.length > 0) {
          const blockNames = booking.campingBlocks.map((block: any, index: number) => {
            const guestCount = booking.guestCounts && booking.guestCounts[index] 
              ? booking.guestCounts[index] 
              : booking.guestCount || block.minCapacity || 1
            return `${block?.name || 'N/A'} (${guestCount} คน)`
          })
          campingBlockNames = blockNames.join(', ')
        } else if (booking.campingBlock) {
          const guestCount = booking.guestCount || booking.campingBlock.minCapacity || 1
          campingBlockNames = `${booking.campingBlock?.name || 'N/A'} (${guestCount} คน)`
        }
        
        // Format dates
        const checkInDate = booking.checkIn ? formatDate(booking.checkIn) : 'N/A'
        const checkOutDate = booking.checkOut ? formatDate(booking.checkOut) : 'N/A'
        
        // Get guest information
        const guestName = booking.guestName || 'N/A'
        const guestEmail = booking.guestEmail || 'N/A'
        const guestPhone = booking.guestPhone || 'N/A'

        // Get payment type
        const paymentType = booking.paymentType || booking.payment?.paymentType || 'FULL'
        const paymentTypeText = paymentType === 'PARTIAL' ? 'จ่ายบางส่วน' : 'จ่ายเต็มจำนวน'

        // Get paid amount
        const paidAmount = booking.payment?.paidAmount || 0

        // Calculate discount and prices
        const totalPrice = booking.totalPrice || 0
        const discountPercent = booking.discount || 0
        const discountAmount = booking.discountAmount || 0
        
        // Calculate original price before discount
        let originalPrice = totalPrice
        if (discountAmount > 0) {
          originalPrice = totalPrice + discountAmount
        } else if (discountPercent > 0) {
          originalPrice = Math.round(totalPrice / (1 - discountPercent / 100))
        }
        
        const totalDiscountForBooking = originalPrice - totalPrice

        // Update totals
        groupTotalRevenue += totalPrice
        groupTotalDiscount += totalDiscountForBooking
        totalRevenue += totalPrice
        totalDiscount += totalDiscountForBooking

        textContent += `การจองที่ ${globalIndex}\n`
        textContent += '-'.repeat(80) + '\n'
        if (roomNames !== 'N/A' && campingBlockNames) {
        textContent += `ห้องพัก: ${roomNames}\n`
          textContent += `บล็อคกางเต๊นท์: ${campingBlockNames}\n`
        } else if (roomNames !== 'N/A') {
          textContent += `ห้องพัก: ${roomNames}\n`
        } else if (campingBlockNames) {
          textContent += `บล็อคกางเต๊นท์: ${campingBlockNames}\n`
        }
        textContent += `ชื่อลูกค้า: ${guestName}\n`
        textContent += `เบอร์ติดต่อ: ${guestPhone}\n`
        textContent += `อีเมล: ${guestEmail}\n`
        textContent += `วันที่เช็คอิน: ${checkInDate}\n`
        textContent += `วันที่เช็คเอ้าท์: ${checkOutDate}\n`
        textContent += `ประเภทการจ่าย: ${paymentTypeText}\n`
        
        // Display pricing information
        if (totalDiscountForBooking > 0) {
          textContent += `ยอดก่อนส่วนลด: ${formatCurrency(originalPrice)}\n`
          if (discountPercent > 0) {
            textContent += `ส่วนลด: ${discountPercent}% (${formatCurrency(totalDiscountForBooking)})\n`
          } else if (discountAmount > 0) {
            textContent += `ส่วนลด: ${formatCurrency(discountAmount)}\n`
          }
        }
        textContent += `ยอดทั้งหมด: ${formatCurrency(totalPrice)}\n`
        textContent += `เงินที่ชำระมาแล้ว: ${formatCurrency(paidAmount)}\n`
        textContent += '\n'

        globalIndex++
      })

      // Group summary
      textContent += `${'-'.repeat(80)}\n`
      textContent += `สรุปรวมสำหรับวันที่เช็คอิน ${checkInDateFormatted}:\n`
      if (groupTotalDiscount > 0) {
        textContent += `ยอดรวมก่อนส่วนลด: ${formatCurrency(groupTotalRevenue + groupTotalDiscount)}\n`
        textContent += `ส่วนลดรวม: ${formatCurrency(groupTotalDiscount)}\n`
      }
      textContent += `ยอดรวมทั้งหมด: ${formatCurrency(groupTotalRevenue)}\n`
      textContent += `${'-'.repeat(80)}\n\n`
    })

  // Overall summary
  textContent += `\n${'='.repeat(80)}\n`
  textContent += 'สรุปรวมทั้งหมด\n'
  textContent += `${'='.repeat(80)}\n`
  if (totalDiscount > 0) {
    textContent += `ยอดรวมก่อนส่วนลด: ${formatCurrency(totalRevenue + totalDiscount)}\n`
    textContent += `ส่วนลดรวมทั้งหมด: ${formatCurrency(totalDiscount)}\n`
  }
  textContent += `ยอดรวมทั้งหมด: ${formatCurrency(totalRevenue)}\n`
  textContent += `${'='.repeat(80)}\n`

  return textContent
}

export function downloadTextFile(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
