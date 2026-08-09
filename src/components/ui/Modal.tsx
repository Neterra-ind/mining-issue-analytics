import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Modal({ open, onClose, title, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; size?: 'sm' | 'md' | 'lg' }) {
  if (!open) return null
  const width = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl' }[size]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="animate-fade-in absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className={cn('animate-fade-in relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-xl bg-white shadow-2xl', width)}>
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-3.5">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="sticky bottom-0 flex items-center justify-end gap-2 border-t border-slate-100 bg-white px-5 py-3.5">{footer}</div>}
      </div>
    </div>
  )
}
