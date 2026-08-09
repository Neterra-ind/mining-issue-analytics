import { useData } from '@/lib/store'
import { cn } from '@/lib/utils'
import { type ElementType, useRef } from 'react'

export function EditableText({
  configKey,
  defaultValue,
  as = 'span',
  className,
}: {
  configKey: string
  defaultValue: string
  as?: ElementType
  className?: string
}) {
  const { editMode, getConfig, setConfig } = useData()
  const ref = useRef<HTMLElement>(null)
  const Tag = as as ElementType
  const value = getConfig(configKey, defaultValue)

  function handleBlur() {
    const text = ref.current?.textContent?.trim() ?? ''
    if (text && text !== value) setConfig(configKey, text)
    else if (!text) setConfig(configKey, defaultValue)
  }

  return (
    <Tag
      ref={ref}
      className={cn(className, editMode && 'cursor-text')}
      contentEditable={editMode}
      suppressContentEditableWarning
      onBlur={editMode ? handleBlur : undefined}
    >
      {value}
    </Tag>
  )
}
