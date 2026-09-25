import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export default function Card({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Icon className="text-primary-600" />
        {title}
      </h3>
      {children}
    </div>
  )
}
