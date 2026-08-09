import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  sortValue?: (row: T) => string | number
  className?: string
  headerClassName?: string
}

export function Table<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyLabel = 'Tidak ada data untuk filter yang dipilih.',
  defaultSortKey,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  onRowClick?: (row: T) => void
  emptyLabel?: string
  defaultSortKey?: string
}) {
  const [sortKey, setSortKey] = useState<string | undefined>(defaultSortKey)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows
    const col = columns.find((c) => c.key === sortKey)
    if (!col?.sortValue) return rows
    const copy = [...rows]
    copy.sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return copy
  }, [rows, sortKey, sortDir, columns])

  function toggleSort(col: Column<T>) {
    if (!col.sortValue) return
    if (sortKey === col.key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(col.key)
      setSortDir('desc')
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs font-medium uppercase tracking-wide text-slate-500">
            {columns.map((col) => (
              <th key={col.key} className={cn('whitespace-nowrap px-3 py-2.5', col.headerClassName)}>
                {col.sortValue ? (
                  <button className="inline-flex items-center gap-1 hover:text-slate-800" onClick={() => toggleSort(col)}>
                    {col.header}
                    {sortKey === col.key ? sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {sortedRows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn('align-top', onRowClick && 'cursor-pointer hover:bg-slate-50')}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('px-3 py-2.5 text-slate-700', col.className)}>
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
          {sortedRows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-3 py-10 text-center text-sm text-slate-400">
                {emptyLabel}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
