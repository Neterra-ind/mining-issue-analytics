import { useMemo, useState } from 'react'
import { useData } from '@/lib/store'
import { PageHeader } from '@/components/PageHeader'
import { FilterBar } from '@/components/FilterBar'
import { Card, CardBody } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { MediaDetailDrawer } from '@/components/MediaDetailDrawer'
import { emptyFilters, filterNews, mediaRanking, type MediaAgg } from '@/lib/aggregations'
import { percentage } from '@/lib/utils'
import type { GlobalFilters, MediaOutlet } from '@/types'

export default function MediaMonitoring() {
  const { data } = useData()
  const [filters, setFilters] = useState<GlobalFilters>(emptyFilters())
  const [selected, setSelected] = useState<MediaOutlet | null>(null)

  const news = useMemo(() => filterNews(data.news, filters), [data.news, filters])
  const rows = useMemo(() => mediaRanking(news, data.media, 30), [news, data.media])

  function open(row: MediaAgg) {
    const media = data.media.find((m) => m.id === row.mediaId)
    if (media) setSelected(media)
  }

  const columns: Column<MediaAgg>[] = [
    { key: 'name', header: 'Media', sortValue: (r) => r.name, render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
    { key: 'type', header: 'Media Type', render: (r) => <Badge>{r.type}</Badge> },
    { key: 'count', header: 'Number of Articles', sortValue: (r) => r.count, render: (r) => r.count },
    { key: 'share', header: 'Share %', sortValue: (r) => r.share, render: (r) => `${r.share}%` },
    {
      key: 'sentiment',
      header: 'Sentiment',
      render: (r) => (
        <span className="text-xs text-slate-500">
          {percentage(r.sentiment.positive, r.count)}% pos · {percentage(r.sentiment.neutral, r.count)}% neu · {percentage(r.sentiment.negative, r.count)}% neg
        </span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader configKey="media.title" title="Media Monitoring" subtitleKey="media.subtitle" subtitle="Peringkat media berdasarkan volume pemberitaan dan share of coverage." />

      <div className="mb-4">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      <Card>
        <CardBody>
          <Table columns={columns} rows={rows} rowKey={(r) => r.mediaId} onRowClick={open} defaultSortKey="count" />
        </CardBody>
      </Card>

      <MediaDetailDrawer media={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
