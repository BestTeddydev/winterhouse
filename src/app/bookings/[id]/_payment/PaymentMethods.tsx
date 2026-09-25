const ArrowOut = () => (
  <div className="text-gray-400">
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  </div>
)

function MethodButton({ onClick, disabled, icon, title, detail, hint, hintColor }: {
  onClick: () => void
  disabled: boolean
  icon: React.ReactNode
  title: string
  detail: string
  hint: string
  hintColor: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-primary-500 transition-colors text-left disabled:opacity-50"
    >
      <div className="flex items-center gap-4">
        {icon}
        <div className="flex-1">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-gray-600 text-sm">{detail}</p>
          <p className={`${hintColor} text-xs mt-1`}>{hint}</p>
        </div>
        <ArrowOut />
      </div>
    </button>
  )
}

interface Props {
  title: string
  processing: boolean
  onPay: (method: 'qr_code' | 'credit_card') => void
  /** e.g. "ส่วนที่เหลือ" */
  forWhat?: string
}

/** Stripe QR code or card checkout */
export default function PaymentMethods({ title, processing, onPay, forWhat = '' }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-6">{title}</h2>

      <div className="space-y-4">
        <MethodButton
          onClick={() => onPay('qr_code')}
          disabled={processing}
          icon={
            <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-10 h-10 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="3" width="5" height="5" strokeWidth="2" />
                <rect x="16" y="3" width="5" height="5" strokeWidth="2" />
                <rect x="3" y="16" width="5" height="5" strokeWidth="2" />
                <rect x="16" y="16" width="5" height="5" strokeWidth="2" />
                <rect x="10" y="10" width="4" height="4" strokeWidth="2" />
              </svg>
            </div>
          }
          title="QR Code (Stripe)"
          detail={`สแกน QR Code เพื่อชำระเงิน${forWhat}ผ่าน Stripe`}
          hint="จะเปิดหน้า QR Code สำหรับชำระเงิน"
          hintColor="text-purple-600"
        />
        <MethodButton
          onClick={() => onPay('credit_card')}
          disabled={processing}
          icon={
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-10 h-10 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2" />
                <line x1="2" y1="10" x2="22" y2="10" strokeWidth="2" />
              </svg>
            </div>
          }
          title="บัตรเครดิต/เดบิต"
          detail="Visa, Mastercard, JCB, American Express"
          hint={`จะเปิดหน้า Stripe Checkout สำหรับชำระเงิน${forWhat}`}
          hintColor="text-blue-600"
        />
      </div>

      {processing && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800 text-center">กำลังดำเนินการชำระเงิน...</p>
        </div>
      )}
    </div>
  )
}
