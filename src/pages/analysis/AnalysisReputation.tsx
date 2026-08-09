import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useData } from '@/lib/store'
import { PageHeader } from '@/components/PageHeader'
import { FilterBar } from '@/components/FilterBar'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { SentimentBadge } from '@/components/ui/Badge'
import { emptyFilters, filterNews, industryPlayers, topIssues } from '@/lib/aggregations'
import type { GlobalFilters } from '@/types'

export default function AnalysisReputation() {
  const { data } = useData()
  const [filters, setFilters] = useState<GlobalFilters>(emptyFilters())

  const news = useMemo(() => filterNews(data.news, filters), [data.news, filters])
  const players = useMemo(() => industryPlayers(news, data.companies), [news, data.companies])
  const issues = useMemo(() => topIssues(news, data.issues, 30), [news, data.issues])

  const positiveIssues = issues.filter((i) => i.sentiment.positive >= i.sentiment.negative).sort((a, b) => b.sentiment.positive - a.sentiment.positive).slice(0, 6)
  const negativeIssues = issues.filter((i) => i.sentiment.negative > i.sentiment.positive).sort((a, b) => b.sentiment.negative - a.sentiment.negative).slice(0, 6)

  const columns: Column<(typeof players)[number]>[] = [
    { key: 'name', header: 'Company', render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
    { key: 'volume', header: 'Volume', sortValue: (r) => r.volume, render: (r) => r.volume },
    { key: 'score', header: 'Reputation Score', sortValue: (r) => r.reputationScore, render: (r) => `${r.reputationScore} / 100` },
  ]

  return (
    <div>
      <PageHeader configKey="reputation.title" title="Reputation Analysis" subtitleKey="reputation.subtitle" subtitle="Skor reputasi perusahaan dan sorotan isu positif / negatif." />

      <div className="mb-5">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Reputation Score per Perusahaan" subtitle="Skor 0–100 berdasarkan proporsi sentimen positif vs negatif" />
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={players}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="shortName" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="reputationScore" fill="#1a4d8f" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Tabel Reputasi" />
          <CardBody>
            <Table columns={columns} rows={players} rowKey={(r) => r.companyId} defaultSortKey="score" />
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Positive Issues" subtitle="Isu dengan sorotan positif terbanyak" />
          <CardBody className="space-y-2">
            {positiveIssues.map((row) => (
              <div key={row.issue.id} className="flex items-center justify-between gap-2 rounded-lg border border-emerald-100 bg-emerald-50/50 p-2.5">
                <p className="truncate text-sm font-medium text-slate-800">{row.issue.name}</p>
                <SentimentBadge sentiment="Positive" />
              </div>
            ))}
            {positiveIssues.length === 0 && <p className="text-sm text-slate-400">Belum ada sorotan positif pada periode ini.</p>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Negative Issues" subtitle="Isu dengan sorotan negatif terbanyak" />
          <CardBody className="space-y-2">
            {negativeIssues.map((row) => (
              <div key={row.issue.id} className="flex items-center justify-between gap-2 rounded-lg border border-red-100 bg-red-50/50 p-2.5">
                <p className="truncate text-sm font-medium text-slate-800">{row.issue.name}</p>
                <SentimentBadge sentiment="Negative" />
              </div>
            ))}
            {negativeIssues.length === 0 && <p className="text-sm text-slate-400">Belum ada sorotan negatif pada periode ini.</p>}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
