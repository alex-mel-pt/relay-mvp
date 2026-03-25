interface StatCardProps {
  label: string
  value: string
  sub?: string
  color?: 'blue' | 'green' | 'amber' | 'red' | 'default'
}

const colorMap = {
  blue: 'bg-peel-blue-light text-peel-blue',
  green: 'bg-peel-green-light text-peel-green',
  amber: 'bg-peel-amber-light text-peel-amber',
  red: 'bg-peel-red-light text-peel-red',
  default: 'bg-peel-gray-100 text-peel-gray-700',
}

export default function StatCard({ label, value, sub, color = 'default' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-peel-gray-200 p-5">
      <div className="text-xs font-medium text-peel-gray-400 uppercase tracking-wider mb-2">{label}</div>
      <div className="flex items-end gap-2">
        <span className={`text-2xl font-heading font-bold ${colorMap[color].split(' ')[1]}`}>
          {value}
        </span>
        {sub && <span className="text-xs text-peel-gray-400 mb-1">{sub}</span>}
      </div>
    </div>
  )
}
