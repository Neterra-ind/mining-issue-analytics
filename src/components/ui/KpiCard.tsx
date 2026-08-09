import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'slate',
  hint,
}: {
  label: string
  value: string
  icon: LucideIcon
  tone?: 'slate' | 'emerald' | 'red' | 'amber' | 'blue'
  hint?: string
}) {
  const toneClass = {
    slate: 'bg-slate-50 text-slate-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    blue: 'bg-blue-50 text-blue-600',
  }[tone]

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', toneClass)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}
