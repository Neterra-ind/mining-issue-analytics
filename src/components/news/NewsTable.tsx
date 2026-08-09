import { Pencil, Trash2 } from 'lucide-react'
import type { NewsItem } from '@/types'
import { useData } from '@/lib/store'
import { Table, type Column } from '@/components/ui/Table'
import { SentimentBadge, RiskBadge } from '@/components/ui/Badge'
import { formatDate, formatRupiah } from '@/lib/utils'

export function NewsTable({
  rows,
  onRowClick,
  editable = false,
  onEdit,
  onDelete,
}: {
  rows: NewsItem[]
  onRowClick: (row: NewsItem) => void
  editable?: boolean
  onEdit?: (row: NewsItem) => void
  onDelete?: (row: NewsItem) => void
}) {
  const { data } = useData()
  const mediaMap = new Map(data.media.map((m) => [m.id, m]))
  const companyMap = new Map(data.companies.map((c) => [c.id, c]))

  const columns: Column<NewsItem>[] = [
    { key: 'date', header: 'Tanggal', sortValue: (r) => r.date, render: (r) => <span className="whitespace-nowrap text-xs text-slate-500">{formatDate(r.date)}</span> },
    { key: 'media', header: 'Media', sortValue: (r) => mediaMap.get(r.mediaId)?.name ?? '', render: (r) => <span className="whitespace-nowrap">{mediaMap.get(r.mediaId)?.name ?? '—'}</span> },
    {
      key: 'title',
      header: 'Judul',
      render: (r) => (
        <div className="min-w-[220px] max-w-sm">
          <p className="font-medium text-slate-800">{r.title}</p>
          <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">{r.topics.join(', ')}</p>
        </div>
      ),
    },
    { key: 'company', header: 'Company', render: (r) => <span className="whitespace-nowrap">{r.companyId ? companyMap.get(r.companyId)?.shortName ?? '—' : '—'}</span> },
    { key: 'location', header: 'Lokasi', render: (r) => <span className="whitespace-nowrap">{r.location}</span> },
    { key: 'actor', header: 'Actor', render: (r) => <span className="whitespace-nowrap">{r.actor}</span> },
    { key: 'sentiment', header: 'Sentiment', sortValue: (r) => r.sentiment, render: (r) => <SentimentBadge sentiment={r.sentiment} /> },
    { key: 'risk', header: 'Risk', sortValue: (r) => r.risk, render: (r) => <RiskBadge risk={r.risk} /> },
    { key: 'prValue', header: 'PR Value', sortValue: (r) => r.prValue, render: (r) => <span className="whitespace-nowrap">{formatRupiah(r.prValue)}</span> },
  ]

  if (editable) {
    columns.push({
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit?.(r)
            }}
            className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"
            title="Edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete?.(r)
            }}
            className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
            title="Hapus"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ),
    })
  }

  return <Table columns={columns} rows={rows} rowKey={(r) => r.id} onRowClick={onRowClick} defaultSortKey="date" />
}
