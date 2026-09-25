import { MapPin, X } from 'lucide-react'

/** Booking steps, stay policies and location, shown when the rooms page opens */
export default function BookingInfoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">ข้อมูลสำคัญสำหรับการจอง</h2>
            <button
              onClick={() => onClose()}
              className="text-gray-500 hover:text-gray-700 p-2"
            >
              <X size={24} />
            </button>
          </div>

          {/* Mobile Browser Instructions */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              สำหรับการจองผ่านมือถือ
            </h3>
            <div className="space-y-2 text-blue-800">
              <p><strong>iOS:</strong> เลือกเปิดลิงก์จองใน Safari</p>
              <p><strong>Android:</strong> เลือกเปิดลิงก์จองใน Chrome(ตั้งค่าChrome เป็นบราวเซอร์เริ่มต้น)</p>
            </div>
          </div>

          {/* Booking Process */}
          <div className="mb-8 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center gap-2">
              💳 ขั้นตอนการจอง
            </h3>
            <div className="space-y-4 text-yellow-800">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">1</div>
                  <div>
                    <p className="font-medium">เลือกห้องพักและวันที่</p>
                    <p className="text-sm">เลือกห้องพักที่ต้องการและระบุวันเช็คอิน-และเลือกคืนที่ต้องการพัก</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">2</div>
                  <div>
                    <p className="font-medium">กรอกข้อมูลการจอง</p>
                    <p className="text-sm">กรอกชื่อ อีเมล เบอร์โทรศัพท์ และความต้องการพิเศษ (ถ้ามี)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <p className="font-medium">เลือกประเภทการชำระเงิน</p>
                    <p className="text-sm">เลือกชำระเต็มจำนวน หรือ ชำระมัดจำ 50% (ส่วนที่เหลือชำระเมื่อเช็คอิน)</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-yellow-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">4</div>
                  <div>
                    <p className="font-medium">ชำระเงิน</p>
                    <p className="text-sm">เลือกวิธีชำระเงิน: บัตรเครดิต/เดบิต, PromptPay, หรือ QR Code ผ่าน Stripe</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">5</div>
                  <div>
                    <p className="font-medium">รับการยืนยัน</p>
                    <p className="text-sm">ระบบจะส่งอีเมลยืนยันการจองและ LINE notification (ถ้ามี)</p>
                  </div>
                </div>
              </div>

              <div className="pl-4 border-l-4 border-red-300 mt-4">
                <p className="font-medium text-red-700">⚠️ สำคัญ:</p>
                <p className="text-red-700 text-sm">การจองจะสมบูรณ์เมื่อชำระเงินสำเร็จเท่านั้น</p>
                <p className="text-red-700 text-sm">หากชำระมัดจำ จะต้องชำระส่วนที่เหลือเมื่อเช็คอิน</p>
              </div>

              <div className="pl-4 border-l-4 border-blue-300">
                <p className="font-medium">การติดตามสถานะการจอง:</p>
                <p className="text-sm">สามารถดูสถานะการจองได้ที่เมนู "การจองของฉัน"</p>
               
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              📋 เงื่อนไขต่างๆ และนโยบายการเข้าพัก
            </h3>
            <div className="space-y-3 text-gray-700">
              <div>
                <p><strong>เวลาเช็คอิน:</strong> 14:00 น.</p>
                <p><strong>เวลาเช็คเอาท์:</strong> 12:00 น.</p>
              </div>

              <div className="flex items-start gap-2">
                <MapPin className="text-blue-600 mt-1 flex-shrink-0" size={16} />
                <div>
                  <p><strong>พิกัด:</strong> บ้านลมหนาว คาเฟ่ แอนด์ แคมป์ปิ้ง</p>
                  <a 
                    href="https://maps.app.goo.gl/kTWYLrEuYiy9oecj6" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    https://maps.app.goo.gl/kTWYLrEuYiy9oecj6
                  </a>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">กฎระเบียบและข้อปฏิบัติของที่พัก:</h4>
                
                {/* Basic Rules */}
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-800">📋 กฎพื้นฐาน:</h5>
                  <ul className="list-disc list-inside space-y-1 pl-4 text-sm">
                    <li>จองห้องพักโดยชำระค่าห้องพักขั้นต่ำ 50%</li>
                    <li>ทางที่พักจะดำเนินการจองห้องพักให้เมื่อได้หลักฐานการโอนตามขั้นตอนที่ถูกต้อง</li>
                    <li>เช็คอิน: 14.00 น.- 20.00 น. (ต้องรบกวนเช็คอินตามเวลาที่กำหนด หากเกินกว่าเวลาที่กำหนดกรุณาแจ้งล่วงหน้า)</li>
                    <li>เช็คเอาท์: 12.00 น.</li>
                  </ul>
                </div>

                {/* Child Policies */}
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-800">👶 นโยบายเด็ก:</h5>
                  <ul className="list-disc list-inside space-y-1 pl-4 text-sm">
                    <li><strong>เด็ก 0-7 ขวบ:</strong> พักรวมกับผู้ปกครองฟรี ไม่มีอุปกรณ์เสริมใดๆ ให้</li>
                    <li><strong>กรณีขอเตียงเสริม:</strong> คิดค่าบริการ 500 บาท/คืน รวมอาหารเช้าพร้อมหมอน+ผ้าห่ม+ผ้าเช็ดตัว เสริมได้สูงสุด 1 ท่าน/หลัง</li>
                  </ul>
                </div>

                {/* Accommodation Rules */}
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-800">🏠 กฎการเข้าพัก:</h5>
                  <ul className="list-disc list-inside space-y-1 pl-4 text-sm">
                    <li>อนุญาตให้เข้าพักตามจำนวนที่แจ้งในรายการจองมาเท่านั้น หากเข้าพักเกินจํานวนที่แจ้งหรือนําบุคคลภายนอกเข้ามาพักโดยมิแจ้งให้ทราบ ทางที่พักคิดค่าปรับท่านละ 1,000 บาท</li>
                  </ul>
                </div>

                {/* Prohibited Activities */}
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-800">🚫 สิ่งต้องห้าม:</h5>
                  <ul className="list-disc list-inside space-y-1 pl-4 text-sm">
                    <li>ไม่อนุญาตให้เล่นการพนันหรือนำสิ่งผิดกฎหมายทุกชนิดเข้ามาในบริเวณที่พักเด็ดขาด</li>
                  </ul>
                </div>

                {/* Cancellation Policy */}
                <div className="space-y-2">
                  <h5 className="font-medium text-gray-800">📅 :</h5>
                  <div className="pl-4 space-y-2 text-sm">
                    <p><strong>การเปลี่ยนวันเข้าพัก:</strong></p>
                    <p className="pl-4">• ต้องแจ้งล่วงหน้าก่อนอย่างน้อย 15 วัน เพื่อขอเปลี่ยนวันเข้าพัก (สามารถเปลี่ยนได้เพียง 1 ครั้ง)</p>
                    
                    <p><strong>การยกเลิกห้องพัก:</strong></p>
                    <ul className="list-disc list-inside pl-4 space-y-1">
                      <li>หัก 15% เมื่อแจ้งก่อน 1 เดือนก่อนถึงวันเข้าพัก</li>
                      <li>หัก 30% เมื่อแจ้งหลัง 1 เดือน แต่ไม่เกิน 15 วัน ก่อนถึงวันเข้าพัก</li>
                      <li>หัก 50% เมื่อแจ้งหลัง 7 วัน หรือ 1 อาทิตย์ ก่อนถึงวันเข้าพัก</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="flex justify-center">
            <button
              onClick={() => onClose()}
              className="px-8 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
            >
              ตรวจสอบห้องว่าง
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
