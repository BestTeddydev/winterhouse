import { Save } from 'lucide-react'

interface Props {
  label: string
  busy: boolean
  disabled?: boolean
  onCancel: () => void
}

/** Cancel / submit buttons at the bottom of the booking forms */
export default function FormActions({ label, busy, disabled = false, onCancel }: Props) {
  return (
    <div className="flex gap-4">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
      >
        ยกเลิก
      </button>
      <button
        type="submit"
        disabled={busy || disabled}
        className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        {busy ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          <>
            <Save size={20} />
            {label}
          </>
        )}
      </button>
    </div>
  )
}
