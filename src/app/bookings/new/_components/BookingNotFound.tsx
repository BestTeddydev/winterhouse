import Link from 'next/link'

export default function BookingNotFound() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto text-center">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">ไม่พบข้อมูลการจอง</h2>
          <p className="text-gray-700 mb-6">กรุณาเลือกห้องพักหรือบล็อคกางเต๊นท์และวันที่เข้าพักใหม่</p>
          <Link
            href="/rooms"
            className="block w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
          >
            เลือกห้องพักใหม่
          </Link>
        </div>
      </div>
    </div>
  )
}
