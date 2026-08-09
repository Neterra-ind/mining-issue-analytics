import { useMemo, useState } from 'react'
import { useData } from '@/lib/store'
import { PageHeader } from '@/components/PageHeader'
import { FilterBar } from '@/components/FilterBar'
import { Card, CardBody } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { SentimentBadge, Badge } from '@/components/ui/Badge'
import { InfluencerDetailDrawer } from '@/components/InfluencerDetailDrawer'
import { emptyFilters, filterNews, influencerRanking, type InfluencerAgg } from '@/lib/aggregations'
import type { GlobalFilters, Influencer } from '@/types'

export default function StakeholderList() {
  const { data } = useData()
  const [filters, setFilters] = useState<GlobalFilters>(emptyFilters())
  const [selected, setSelected] = useState<Influencer | null>(null)

  const news = useMemo(() => filterNews(data.news, filters), [data.news, filters])
  const rows = useMemo(() => influencerRanking(news, data.influencers, data.issues, 50), [news, data.influencers, data.issues])

  function open(row: InfluencerAgg) {
    setSelected(
      row.matched ?? {
        id: `stub-${row.name}`,
        name: row.name,
        position: 'Narasumber / Aktor Media',
        organization: '—',
        scope: 'External',
        category: 'Unclassified',
      },
    )
  }

  const columns: Column<InfluencerAgg>[] = [
    { key: 'name', header: 'Name', sortValue: (r) => r.name, render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
    { key: 'position', header: 'Position', render: (r) => r.matched?.position ?? '—' },
    { key: 'organization', header: 'Organization', render: (r) => r.matched?.organization ?? '—' },
    { key: 'scope', header: 'Scope', render: (r) => (r.matched ? <Badge tone={r.matched.scope === 'Internal' ? 'blue' : 'teal'}>{r.matched.scope}</Badge> : <Badge>External</Badge>) },
    { key: 'count', header: 'Statements', sortValue: (r) => r.count, render: (r) => r.count },
    { key: 'issue', header: 'Main Issue', render: (r) => r.mainIssue },
    { key: 'sentiment', header: 'Sentiment', render: (r) => <SentimentBadge sentiment={r.sentimentLean} /> },
  ]

  return (
    <div>
      <PageHeader configKey="stakeholders.title" title="Stakeholder / Influencer" subtitleKey="stakeholders.subtitle" subtitle="Aktor yang membentuk narasi isu — diurutkan berdasarkan frekuensi pernyataan." />

      <div className="mb-4">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      <Card>
        <CardBody>
          <Table columns={columns} rows={rows} rowKey={(r) => r.name} onRowClick={open} defaultSortKey="count" />
        </CardBody>
      </Card>

      <InfluencerDetailDrawer influencer={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
