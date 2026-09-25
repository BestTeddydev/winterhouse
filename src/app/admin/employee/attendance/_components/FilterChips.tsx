/** "การกรอง: [a] [b] ล้างทั้งหมด" row; hidden without chips */
export default function FilterChips({ chips, onClear }: { chips: Array<string | false | null | undefined>; onClear: () => void }) {
  const shown = chips.filter(Boolean) as string[]
  if (shown.length === 0) return null
  return (
    <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 flex-wrap">
      <span className="text-sm text-gray-600">การกรอง:</span>
      {shown.map((chip) => (
        <span key={chip} className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
          {chip}
        </span>
      ))}
      <button onClick={onClear} className="text-xs text-primary-700 hover:text-primary-800 font-medium">
        ล้างทั้งหมด
      </button>
    </div>
  )
}
