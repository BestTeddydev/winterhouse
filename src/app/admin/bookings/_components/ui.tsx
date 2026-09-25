import type { ReactNode } from 'react'
import { CheckCircle, type LucideIcon } from 'lucide-react'

export const INPUT_CLASS =
  'w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 placeholder-gray-500'

/** A white card with an icon heading, one per form section */
export function FormSection({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Icon size={20} />
        {title}
      </h2>
      {children}
    </div>
  )
}

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-2">
      {children}
    </label>
  )
}

/** The round check button in the corner of a selectable card */
export function SelectCheckbox({ selected, onToggle, label }: { selected: boolean; onToggle: () => void; label: string }) {
  return (
    <div className="absolute top-2 right-2 z-10">
      <button
        type="button"
        aria-pressed={selected}
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
          selected ? 'bg-green-600 border-green-600' : 'border-gray-300 hover:border-primary-500 bg-white'
        }`}
      >
        {selected && <CheckCircle size={18} className="text-white" />}
      </button>
    </div>
  )
}
