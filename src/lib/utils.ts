import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRupiah(value: number): string {
  if (value >= 1_000_000_000) return `Rp ${(value / 1_000_000_000).toFixed(2)} M`
  if (value >= 1_000_000) return `Rp ${(value / 1_000_000).toFixed(1)} Jt`
  return `Rp ${value.toLocaleString('id-ID')}`
}

export function formatNumber(value: number): string {
  return value.toLocaleString('id-ID')
}

export function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateShort(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })
}

export function percentage(part: number, total: number): number {
  if (total === 0) return 0
  return Math.round((part / total) * 1000) / 10
}

export function groupBy<T, K extends string | number>(items: T[], keyFn: (item: T) => K): Map<K, T[]> {
  const map = new Map<K, T[]>()
  for (const item of items) {
    const key = keyFn(item)
    const bucket = map.get(key)
    if (bucket) bucket.push(item)
    else map.set(key, [item])
  }
  return map
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}
