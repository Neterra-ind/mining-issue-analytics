import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '@/lib/store'
import { PageHeader } from '@/components/PageHeader'
import { FilterBar } from '@/components/FilterBar'
import { Card, CardBody } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { PillarBadge, RiskBadge, SentimentBadge } from '@/components/ui/Badge'
import { emptyFilters, filterNews, sentimentBreakdown } from '@/lib/aggregations'
import { groupBy } from '@/lib/utils'
import type { GlobalFilters, Issue } from '@/types'

interface IssueRow {
  issue: Issue
  count: number
  sentiment: 'Positive' | 'Neutral' | 'Negative'
}

export default function IssueMonitoring() {
  const { data } = useData()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<GlobalFilters>(emptyFilters())

  const news = useMemo(() => filterNews(data.news, filters), [data.news, filters])

  const rows = useMemo<IssueRow[]>(() => {
    const byIssue = groupBy(news, (n) => n.issueId)
    return data.issues.map((issue) => {
      const items = byIssue.get(issue.id) ?? []
      const sb = sentimentBreakdown(items)
      const sentiment = sb.negative >= sb.positive && sb.negative >= sb.neutral ? 'Negative' : sb.positive >= sb.neutral ? 'Positive' : 'Neutral'
      return { issue, count: items.length, sentiment: items.length ? sentiment : 'Neutral' }
    })
  }, [data.issues, news])

  const columns: Column<IssueRow>[] = [
    { key: 'name', header: 'Issue', sortValue: (r) => r.issue.name, render: (r) => <span className="font-medium text-slate-800">{r.issue.name}</span> },
    { key: 'pillar', header: 'Pillar', render: (r) => <PillarBadge pillar={r.issue.pillar} /> },
    { key: 'category', header: 'Category', render: (r) => r.issue.category },
    { key: 'volume', header: 'Volume', sortValue: (r) => r.count, render: (r) => r.count },
    { key: 'sentiment', header: 'Sentiment', render: (r) => <SentimentBadge sentiment={r.sentiment} /> },
    { key: 'risk', header: 'Risk', sortValue: (r) => r.issue.riskLevel, render: (r) => <RiskBadge risk={r.issue.riskLevel} /> },
    { key: 'trend', header: 'Trend', render: (r) => (r.issue.trend === 'up' ? '↑ Naik' : r.issue.trend === 'down' ? '↓ Turun' : '→ Stabil') },
  ]

  return (
    <div>
      <PageHeader configKey="issues.title" title="Issue Monitoring" subtitleKey="issues.subtitle" subtitle="Seluruh isu yang terpantau lintas Industry, ESG, dan Corporate. Klik baris untuk melihat detail." />

      <div className="mb-4">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      <Card>
        <CardBody>
          <Table columns={columns} rows={rows} rowKey={(r) => r.issue.id} onRowClick={(r) => navigate(`/issues/${r.issue.id}`)} defaultSortKey="volume" />
        </CardBody>
      </Card>
    </div>
  )
}
