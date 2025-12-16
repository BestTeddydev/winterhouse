import { IRoom } from '@/models/Room'

/**
 * Holiday dates for Thailand (2024-2030)
 * วันหยุดนักขัตฤกษ์ของประเทศไทย
 * Updated to include comprehensive holidays for multiple years
 */
const THAI_HOLIDAYS: string[] = [
  // 2024
  '2024-01-01', // New Year (วันขึ้นปีใหม่)
  '2024-01-02', // New Year (extended)
  '2024-02-10', // Chinese New Year (วันตรุษจีน)
  '2024-02-24', // Makha Bucha Day (วันมาฆบูชา)
  '2024-04-06', // Chakri Memorial Day (วันจักรี)
  '2024-04-13', // Songkran Day 1 (วันสงกรานต์)
  '2024-04-14', // Songkran Day 2 (วันสงกรานต์)
  '2024-04-15', // Songkran Day 3 (วันสงกรานต์)
  '2024-05-01', // Labor Day (วันแรงงานแห่งชาติ)
  '2024-05-04', // Coronation Day (วันฉัตรมงคล)
  '2024-05-22', // Visakha Bucha Day (วันวิสาขบูชา)
  '2024-06-03', // Her Majesty The Queen's Birthday (วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี)
  '2024-07-20', // Asarnha Bucha Day (วันอาสาฬหบูชา)
  '2024-07-21', // Buddhist Lent Day (วันเข้าพรรษา)
  '2024-07-28', // Birthday of King Rama X (วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว)
  '2024-08-12', // Her Majesty The Queen's Birthday / Mother's Day (วันแม่แห่งชาติ)
  '2024-10-13', // King Bhumibol Memorial Day (วันคล้ายวันสวรรคตพระบาทสมเด็จพระบรมชนกาธิเบศร)
  '2024-10-23', // Chulalongkorn Day (วันปิยมหาราช)
  '2024-12-05', // King Bhumibol's Birthday / Father's Day (วันคล้ายวันพระบรมราชสมภพ, วันชาติ, วันพ่อแห่งชาติ)
  '2024-12-10', // Constitution Day (วันรัฐธรรมนูญ)
  '2024-12-31', // New Year's Eve (วันสิ้นปี)
  
  // 2025
  '2025-01-01', // New Year (วันขึ้นปีใหม่)
  '2025-01-02', // New Year (extended)
  '2025-01-29', // Chinese New Year (วันตรุษจีน)
  '2025-02-12', // Makha Bucha Day (วันมาฆบูชา)
  '2025-04-06', // Chakri Memorial Day (วันจักรี)
  '2025-04-13', // Songkran Day 1 (วันสงกรานต์)
  '2025-04-14', // Songkran Day 2 (วันสงกรานต์)
  '2025-04-15', // Songkran Day 3 (วันสงกรานต์)
  '2025-05-01', // Labor Day (วันแรงงานแห่งชาติ)
  '2025-05-05', // Coronation Day (วันฉัตรมงคล)
  '2025-05-12', // Visakha Bucha Day (วันวิสาขบูชา)
  '2025-06-03', // Her Majesty The Queen's Birthday (วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี)
  '2025-07-10', // Asarnha Bucha Day (วันอาสาฬหบูชา)
  '2025-07-11', // Buddhist Lent Day (วันเข้าพรรษา)
  '2025-07-28', // Birthday of King Rama X (วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว)
  '2025-08-12', // Her Majesty The Queen's Birthday / Mother's Day (วันแม่แห่งชาติ)
  '2025-10-13', // King Bhumibol Memorial Day (วันคล้ายวันสวรรคตพระบาทสมเด็จพระบรมชนกาธิเบศร)
  '2025-10-23', // Chulalongkorn Day (วันปิยมหาราช)
  '2025-12-05', // King Bhumibol's Birthday / Father's Day (วันคล้ายวันพระบรมราชสมภพ, วันชาติ, วันพ่อแห่งชาติ)
  '2025-12-10', // Constitution Day (วันรัฐธรรมนูญ)
  '2025-12-31', // New Year's Eve (วันสิ้นปี)
  
  // 2026
  '2026-01-01', // New Year (วันขึ้นปีใหม่)
  '2026-01-02', // New Year (extended)
  '2026-02-17', // Chinese New Year (วันตรุษจีน)
  '2026-03-03', // Makha Bucha Day (วันมาฆบูชา)
  '2026-04-06', // Chakri Memorial Day (วันจักรี)
  '2026-04-13', // Songkran Day 1 (วันสงกรานต์)
  '2026-04-14', // Songkran Day 2 (วันสงกรานต์)
  '2026-04-15', // Songkran Day 3 (วันสงกรานต์)
  '2026-05-01', // Labor Day (วันแรงงานแห่งชาติ)
  '2026-05-05', // Coronation Day (วันฉัตรมงคล)
  '2026-05-31', // Visakha Bucha Day (วันวิสาขบูชา)
  '2026-06-03', // Her Majesty The Queen's Birthday (วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี)
  '2026-07-29', // Asarnha Bucha Day (วันอาสาฬหบูชา)
  '2026-07-30', // Buddhist Lent Day (วันเข้าพรรษา)
  '2026-07-28', // Birthday of King Rama X (วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว)
  '2026-08-12', // Her Majesty The Queen's Birthday / Mother's Day (วันแม่แห่งชาติ)
  '2026-10-13', // King Bhumibol Memorial Day (วันคล้ายวันสวรรคตพระบาทสมเด็จพระบรมชนกาธิเบศร)
  '2026-10-23', // Chulalongkorn Day (วันปิยมหาราช)
  '2026-12-05', // King Bhumibol's Birthday / Father's Day (วันคล้ายวันพระบรมราชสมภพ, วันชาติ, วันพ่อแห่งชาติ)
  '2026-12-10', // Constitution Day (วันรัฐธรรมนูญ)
  '2026-12-31', // New Year's Eve (วันสิ้นปี)
  
  // 2027
  '2027-01-01', // New Year (วันขึ้นปีใหม่)
  '2027-01-02', // New Year (extended)
  '2027-02-06', // Chinese New Year (วันตรุษจีน)
  '2027-02-21', // Makha Bucha Day (วันมาฆบูชา)
  '2027-04-06', // Chakri Memorial Day (วันจักรี)
  '2027-04-13', // Songkran Day 1 (วันสงกรานต์)
  '2027-04-14', // Songkran Day 2 (วันสงกรานต์)
  '2027-04-15', // Songkran Day 3 (วันสงกรานต์)
  '2027-05-01', // Labor Day (วันแรงงานแห่งชาติ)
  '2027-05-05', // Coronation Day (วันฉัตรมงคล)
  '2027-05-19', // Visakha Bucha Day (วันวิสาขบูชา)
  '2027-06-03', // Her Majesty The Queen's Birthday (วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี)
  '2027-07-18', // Asarnha Bucha Day (วันอาสาฬหบูชา)
  '2027-07-19', // Buddhist Lent Day (วันเข้าพรรษา)
  '2027-07-28', // Birthday of King Rama X (วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว)
  '2027-08-12', // Her Majesty The Queen's Birthday / Mother's Day (วันแม่แห่งชาติ)
  '2027-10-13', // King Bhumibol Memorial Day (วันคล้ายวันสวรรคตพระบาทสมเด็จพระบรมชนกาธิเบศร)
  '2027-10-23', // Chulalongkorn Day (วันปิยมหาราช)
  '2027-12-05', // King Bhumibol's Birthday / Father's Day (วันคล้ายวันพระบรมราชสมภพ, วันชาติ, วันพ่อแห่งชาติ)
  '2027-12-10', // Constitution Day (วันรัฐธรรมนูญ)
  '2027-12-31', // New Year's Eve (วันสิ้นปี)
  
  // 2028
  '2028-01-01', // New Year (วันขึ้นปีใหม่)
  '2028-01-02', // New Year (extended)
  '2028-01-26', // Chinese New Year (วันตรุษจีน)
  '2028-02-10', // Makha Bucha Day (วันมาฆบูชา)
  '2028-04-06', // Chakri Memorial Day (วันจักรี)
  '2028-04-13', // Songkran Day 1 (วันสงกรานต์)
  '2028-04-14', // Songkran Day 2 (วันสงกรานต์)
  '2028-04-15', // Songkran Day 3 (วันสงกรานต์)
  '2028-05-01', // Labor Day (วันแรงงานแห่งชาติ)
  '2028-05-05', // Coronation Day (วันฉัตรมงคล)
  '2028-05-07', // Visakha Bucha Day (วันวิสาขบูชา)
  '2028-06-03', // Her Majesty The Queen's Birthday (วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี)
  '2028-07-05', // Asarnha Bucha Day (วันอาสาฬหบูชา)
  '2028-07-06', // Buddhist Lent Day (วันเข้าพรรษา)
  '2028-07-28', // Birthday of King Rama X (วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว)
  '2028-08-12', // Her Majesty The Queen's Birthday / Mother's Day (วันแม่แห่งชาติ)
  '2028-10-13', // King Bhumibol Memorial Day (วันคล้ายวันสวรรคตพระบาทสมเด็จพระบรมชนกาธิเบศร)
  '2028-10-23', // Chulalongkorn Day (วันปิยมหาราช)
  '2028-12-05', // King Bhumibol's Birthday / Father's Day (วันคล้ายวันพระบรมราชสมภพ, วันชาติ, วันพ่อแห่งชาติ)
  '2028-12-10', // Constitution Day (วันรัฐธรรมนูญ)
  '2028-12-31', // New Year's Eve (วันสิ้นปี)
  
  // 2029
  '2029-01-01', // New Year (วันขึ้นปีใหม่)
  '2029-01-02', // New Year (extended)
  '2029-02-13', // Chinese New Year (วันตรุษจีน)
  '2029-02-28', // Makha Bucha Day (วันมาฆบูชา)
  '2029-04-06', // Chakri Memorial Day (วันจักรี)
  '2029-04-13', // Songkran Day 1 (วันสงกรานต์)
  '2029-04-14', // Songkran Day 2 (วันสงกรานต์)
  '2029-04-15', // Songkran Day 3 (วันสงกรานต์)
  '2029-05-01', // Labor Day (วันแรงงานแห่งชาติ)
  '2029-05-05', // Coronation Day (วันฉัตรมงคล)
  '2029-05-25', // Visakha Bucha Day (วันวิสาขบูชา)
  '2029-06-03', // Her Majesty The Queen's Birthday (วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี)
  '2029-06-24', // Asarnha Bucha Day (วันอาสาฬหบูชา)
  '2029-06-25', // Buddhist Lent Day (วันเข้าพรรษา)
  '2029-07-28', // Birthday of King Rama X (วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว)
  '2029-08-12', // Her Majesty The Queen's Birthday / Mother's Day (วันแม่แห่งชาติ)
  '2029-10-13', // King Bhumibol Memorial Day (วันคล้ายวันสวรรคตพระบาทสมเด็จพระบรมชนกาธิเบศร)
  '2029-10-23', // Chulalongkorn Day (วันปิยมหาราช)
  '2029-12-05', // King Bhumibol's Birthday / Father's Day (วันคล้ายวันพระบรมราชสมภพ, วันชาติ, วันพ่อแห่งชาติ)
  '2029-12-10', // Constitution Day (วันรัฐธรรมนูญ)
  '2029-12-31', // New Year's Eve (วันสิ้นปี)
  
  // 2030
  '2030-01-01', // New Year (วันขึ้นปีใหม่)
  '2030-01-02', // New Year (extended)
  '2030-02-03', // Chinese New Year (วันตรุษจีน)
  '2030-02-18', // Makha Bucha Day (วันมาฆบูชา)
  '2030-04-06', // Chakri Memorial Day (วันจักรี)
  '2030-04-13', // Songkran Day 1 (วันสงกรานต์)
  '2030-04-14', // Songkran Day 2 (วันสงกรานต์)
  '2030-04-15', // Songkran Day 3 (วันสงกรานต์)
  '2030-05-01', // Labor Day (วันแรงงานแห่งชาติ)
  '2030-05-05', // Coronation Day (วันฉัตรมงคล)
  '2030-05-14', // Visakha Bucha Day (วันวิสาขบูชา)
  '2030-06-03', // Her Majesty The Queen's Birthday (วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ พระบรมราชินี)
  '2030-07-13', // Asarnha Bucha Day (วันอาสาฬหบูชา)
  '2030-07-14', // Buddhist Lent Day (วันเข้าพรรษา)
  '2030-07-28', // Birthday of King Rama X (วันเฉลิมพระชนมพรรษาพระบาทสมเด็จพระเจ้าอยู่หัว)
  '2030-08-12', // Her Majesty The Queen's Birthday / Mother's Day (วันแม่แห่งชาติ)
  '2030-10-13', // King Bhumibol Memorial Day (วันคล้ายวันสวรรคตพระบาทสมเด็จพระบรมชนกาธิเบศร)
  '2030-10-23', // Chulalongkorn Day (วันปิยมหาราช)
  '2030-12-05', // King Bhumibol's Birthday / Father's Day (วันคล้ายวันพระบรมราชสมภพ, วันชาติ, วันพ่อแห่งชาติ)
  '2030-12-10', // Constitution Day (วันรัฐธรรมนูญ)
  '2030-12-31', // New Year's Eve (วันสิ้นปี)
]

/**
 * Create a Date object from a date string (YYYY-MM-DD) in local time
 * Avoids timezone issues when parsing date strings
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  // Create date in local timezone (month is 0-indexed)
  return new Date(year, month - 1, day)
}

/**
 * Check if a date is a holiday
 * Uses local date string to avoid timezone issues
 */
export function isHoliday(date: Date): boolean {
  // Use local date to avoid timezone conversion issues
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const dateStr = `${year}-${month}-${day}`
  const isHolidayDate = THAI_HOLIDAYS.includes(dateStr)
  
  return isHolidayDate
}

/**
 * Check if a date is weekend (Friday, Saturday, Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay()
  // 0 = Sunday, 6 = Saturday, 5 = Friday
  return day === 0 || day === 5 || day === 6
}

/**
 * Get day type for a date
 */
export type DayType = 'weekday' | 'weekend' | 'holiday'

export function getDayType(date: Date): DayType {
  // Check holiday first (holidays take priority over weekends)
  if (isHoliday(date)) {
    return 'holiday'
  }
  if (isWeekend(date)) {
    return 'weekend'
  }
  return 'weekday'
}

/**
 * Get price for a room on a specific date
 */
export function getRoomPriceForDate(room: IRoom, date: Date): number {
  const dayType = getDayType(date)
  // ถ้ามี pricing object ใช้ pricing
  if (room.pricing) {
    return room.pricing[dayType] || room.price
  }
  
  // ถ้าไม่มี pricing ใช้ base price
  return room.price
}

/**
 * Calculate total price for a room over a date range
 */
export function calculateRoomPriceRange(
  room: IRoom,
  checkIn: Date,
  checkOut: Date
): { totalPrice: number; dailyPrices: Array<{ date: Date; price: number }> } {
  const dailyPrices: Array<{ date: Date; price: number }> = []
  let totalPrice = 0
  
  const currentDate = new Date(checkIn)
  const checkoutDate = new Date(checkOut)
  
  while (currentDate < checkoutDate) {
    const price = getRoomPriceForDate(room, currentDate)
    totalPrice += price
    dailyPrices.push({
      date: new Date(currentDate),
      price
    })
    
    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  return { totalPrice, dailyPrices }
}

/**
 * Calculate total price for multiple rooms
 */
export function calculateMultipleRoomsPrice(
  rooms: Array<{ room: IRoom; checkIn: Date; checkOut: Date }>
): number {
  return rooms.reduce((total, { room, checkIn, checkOut }) => {
    const result = calculateRoomPriceRange(room, checkIn, checkOut)
    return total + result.totalPrice
  }, 0)
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    minimumFractionDigits: 0
  }).format(price)
}

/**
 * Get daily breakdown for display
 */
export function getPriceBreakdown(
  room: IRoom,
  checkIn: Date,
  checkOut: Date
): Array<{
  date: Date
  dayType: DayType
  price: number
  formattedDate: string
}> {
  const { dailyPrices } = calculateRoomPriceRange(room, checkIn, checkOut)
  
  return dailyPrices.map(({ date, price }) => ({
    date,
    dayType: getDayType(date),
    price,
    formattedDate: formatDate(date)
  }))
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('th-TH', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Get day type label in Thai
 */
export function getDayTypeLabel(dayType: DayType): string {
  const labels = {
    weekday: 'วันธรรมดา',
    weekend: 'วันหยุดสุดสัปดาห์',
    holiday: 'วันหยุดนักขัตฤกษ์'
  }
  return labels[dayType]
}
