import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Building2, Newspaper, Radio, Tv } from 'lucide-react'
import { useData } from '@/lib/store'
import { PageHeader } from '@/components/PageHeader'
import { FilterBar } from '@/components/FilterBar'
import { KpiCard } from '@/components/ui/KpiCard'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { SentimentBadge, RiskBadge } from '@/components/ui/Badge'
import { NewsDetailDrawer } from '@/components/news/NewsDetailDrawer'
import { emptyFilters, filterNews, industryPlayers, influencerRanking, mediaRanking, topIssues } from '@/lib/aggregations'
import { formatDate, formatNumber, percentage } from '@/lib/utils'
import type { GlobalFilters, NewsItem } from '@/types'

export default function IndustryIntelligence() {
  const { data } = useData()
  const [filters, setFilters] = useState<GlobalFilters>({ ...emptyFilters(), pillar: 'Industry' })
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)

  const news = useMemo(() => filterNews(data.news, { ...filters, pillar: 'Industry' }), [data.news, filters])
  const online = news.filter((n) => n.mediaType === 'Online').length
  const print = news.filter((n) => n.mediaType === 'Cetak').length
  const tv = news.filter((n) => n.mediaType === 'TV').length

  const taxonomy = useMemo(() => data.taxonomy.filter((t) => t.pillar === 'Industry').sort((a, b) => a.order - b.order), [data.taxonomy])
  const distribution = useMemo(
    () => taxonomy.map((t) => ({ label: t.label, count: news.filter((n) => n.topics.includes(t.label)).length })),
    [taxonomy, news],
  )

  const policyNews = useMemo(() => news.filter((n) => n.topics.includes('Policy & Regulation')).sort((a, b) => (a.date < b.date ? 1 : -1)), [news])
  const players = useMemo(() => industryPlayers(news, data.companies), [news, data.companies])
  const influencers = useMemo(() => influencerRanking(news, data.influencers, data.issues, 8), [news, data.influencers, data.issues])
  const media = useMemo(() => mediaRanking(news, data.media, 8), [news, data.media])
  const issues = useMemo(() => topIssues(news, data.issues, 5), [news, data.issues])

  const policyColumns: Column<NewsItem>[] = [
    { key: 'date', header: 'Date', sortValue: (r) => r.date, render: (r) => <span className="whitespace-nowrap text-xs text-slate-500">{formatDate(r.date)}</span> },
    { key: 'issue', header: 'Issue', render: (r) => data.issues.find((i) => i.id === r.issueId)?.name ?? '—' },
    { key: 'institution', header: 'Institution', render: (r) => r.actor },
    { key: 'statement', header: 'Statement', render: (r) => <span className="line-clamp-2 max-w-sm">{r.title}</span> },
    { key: 'sentiment', header: 'Sentiment', render: (r) => <SentimentBadge sentiment={r.sentiment} /> },
    { key: 'risk', header: 'Risk', render: (r) => <RiskBadge risk={r.risk} /> },
  ]

  const playerColumns: Column<typeof players[number]>[] = [
    { key: 'name', header: 'Company', sortValue: (r) => r.name, render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
    { key: 'volume', header: 'News Volume', sortValue: (r) => r.volume, render: (r) => r.volume },
    { key: 'positive', header: 'Positive', sortValue: (r) => r.positive, render: (r) => <span className="text-emerald-600">{r.positive}</span> },
    { key: 'neutral', header: 'Neutral', sortValue: (r) => r.neutral, render: (r) => <span className="text-slate-500">{r.neutral}</span> },
    { key: 'negative', header: 'Negative', sortValue: (r) => r.negative, render: (r) => <span className="text-red-600">{r.negative}</span> },
    { key: 'reputation', header: 'Reputation', sortValue: (r) => r.reputationScore, render: (r) => `${r.reputationScore}/100` },
  ]

  const influencerColumns: Column<typeof influencers[number]>[] = [
    { key: 'name', header: 'Name', render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
    { key: 'position', header: 'Position', render: (r) => r.matched?.position ?? '—' },
    { key: 'organization', header: 'Organization', render: (r) => r.matched?.organization ?? '—' },
    { key: 'count', header: 'Statements', sortValue: (r) => r.count, render: (r) => r.count },
    { key: 'issue', header: 'Main Issue', render: (r) => r.mainIssue },
    { key: 'sentiment', header: 'Sentiment', render: (r) => <SentimentBadge sentiment={r.sentimentLean} /> },
  ]

  const mediaColumns: Column<typeof media[number]>[] = [
    { key: 'name', header: 'Media', render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
    { key: 'count', header: 'Articles', sortValue: (r) => r.count, render: (r) => r.count },
    { key: 'share', header: 'Share %', sortValue: (r) => r.share, render: (r) => `${r.share}%` },
    {
      key: 'sentiment',
      header: 'Sentiment',
      render: (r) => (
        <span className="text-xs text-slate-500">
          {percentage(r.sentiment.positive, r.count)}% pos · {percentage(r.sentiment.negative, r.count)}% neg
        </span>
      ),
    },
  ]

  return (
    <div>
      <PageHeader configKey="industry.title" title="Mining Industry" subtitleKey="industry.subtitle" subtitle="Apa yang sedang terjadi di industri pertambangan." />

      <div className="mb-5">
        <FilterBar filters={filters} onChange={setFilters} showPillar={false} />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total Coverage" value={formatNumber(news.length)} icon={Newspaper} tone="blue" />
        <KpiCard label="Online Media" value={formatNumber(online)} icon={Radio} tone="slate" />
        <KpiCard label="Print Media" value={formatNumber(print)} icon={Building2} tone="slate" />
        <KpiCard label="TV" value={formatNumber(tv)} icon={Tv} tone="slate" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Issue Distribution" subtitle="Jumlah berita per kategori isu industri" />
          <CardBody>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={distribution} layout="vertical" margin={{ left: 24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" width={140} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" fill="#1a4d8f" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Top Issue" subtitle="Isu industri dengan volume tertinggi" />
          <CardBody className="space-y-3">
            {issues.map((row) => (
              <div key={row.issue.id} className="rounded-lg border border-slate-100 p-2.5">
                <p className="text-sm font-medium text-slate-800">{row.issue.name}</p>
                <p className="mt-0.5 text-xs text-slate-400">{row.count} berita · {row.issue.category}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card className="mb-5">
        <CardHeader title="Policy & Regulation" subtitle="Kebijakan baru, perubahan regulasi, dan pernyataan pemerintah" />
        <CardBody>
          <Table columns={policyColumns} rows={policyNews} rowKey={(r) => r.id} onRowClick={setSelectedNews} defaultSortKey="date" />
        </CardBody>
      </Card>

      <Card className="mb-5">
        <CardHeader title="Industry Players" subtitle="Ranking perusahaan berdasarkan volume dan sentimen pemberitaan" />
        <CardBody>
          <Table columns={playerColumns} rows={players} rowKey={(r) => r.companyId} defaultSortKey="volume" />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Influencer Mapping" subtitle="Aktor paling sering dikutip dalam pemberitaan industri" />
          <CardBody>
            <Table columns={influencerColumns} rows={influencers} rowKey={(r) => r.name} defaultSortKey="count" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Media Share" subtitle="Distribusi pemberitaan berdasarkan media" />
          <CardBody>
            <Table columns={mediaColumns} rows={media} rowKey={(r) => r.mediaId} defaultSortKey="count" />
          </CardBody>
        </Card>
      </div>

      <NewsDetailDrawer news={selectedNews} onClose={() => setSelectedNews(null)} />
    </div>
  )
}
