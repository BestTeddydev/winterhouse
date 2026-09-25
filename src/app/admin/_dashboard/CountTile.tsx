import type { LucideIcon } from 'lucide-react'

/** Grey tile with an icon label and a big number */
export default function CountTile({ icon: Icon, iconColor, label, value, valueColor }: { icon: LucideIcon; iconColor: string; label: string; value: number; valueColor: string }) {
  return (
    <div className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center justify-center mb-2">
        <Icon className={`${iconColor} mr-2 flex-shrink-0`} size={18} />
        <span className="font-semibold text-gray-900 text-sm sm:text-base">{label}</span>
      </div>
      <p className={`text-xl sm:text-2xl font-bold ${valueColor}`}>{value}</p>
    </div>
  )
}
