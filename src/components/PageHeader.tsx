import type { ReactNode } from 'react'
import { EditableText } from '@/components/ui/EditableText'

export function PageHeader({
  configKey,
  title,
  subtitleKey,
  subtitle,
  action,
}: {
  configKey: string
  title: string
  subtitleKey: string
  subtitle: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <EditableText as="h1" configKey={configKey} defaultValue={title} className="text-xl font-semibold tracking-tight text-slate-900" />
        <EditableText as="p" configKey={subtitleKey} defaultValue={subtitle} className="mt-1 text-sm text-slate-500" />
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  )
}
