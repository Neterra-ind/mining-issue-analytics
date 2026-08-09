import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertOctagon, Newspaper, PieChart, ThumbsDown, ThumbsUp, Wallet } from 'lucide-react'
import { useData } from '@/lib/store'
import { PageHeader } from '@/components/PageHeader'
import { FilterBar } from '@/components/FilterBar'
import { KpiCard } from '@/components/ui/KpiCard'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Badge, RiskBadge, SentimentBadge } from '@/components/ui/Badge'
import { emptyFilters, filterNews, sentimentBreakdown, trendByDay } from '@/lib/aggregations'
import { formatNumber, formatRupiah, groupBy, percentage } from '@/lib/utils'
import type { GlobalFilters } from '@/types'

export default function CorporateReputation() {
  const { data } = useData()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [companyId, setCompanyId] = useState(searchParams.get('company') ?? 'co-ptar')
  const [filters, setFilters] = useState<GlobalFilters>({ ...emptyFilters(), pillar: 'Corporate', companyId: searchParams.get('company') ?? 'co-ptar' })

  useEffect(() => {
    const fromUrl = searchParams.get('company')
    if (fromUrl && fromUrl !== companyId) {
      setCompanyId(fromUrl)
      setFilters((f) => ({ ...f, companyId: fromUrl }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const company = data.companies.find((c) => c.id === companyId) ?? data.companies[0]
  const allCorporateNews = useMemo(() => data.news.filter((n) => n.pillar === 'Corporate'), [data.news])
  const news = useMemo(() => filterNews(data.news, { ...filters, pillar: 'Corporate', companyId }), [data.news, filters, companyId])

  const sb = sentimentBreakdown(news)
  const potentialNegative = news.filter((n) => n.sentiment !== 'Positive' && (n.risk === 'High' || n.risk === 'Critical')).length
  const prValue = news.reduce((s, n) => s + n.prValue, 0)
  const mediaShare = percentage(news.length, allCorporateNews.length || 1)

  const topics = data.taxonomy.filter((t) => t.pillar === 'Corporate').sort((a, b) => a.order - b.order)
  const topicDist = topics.map((t) => ({ label: t.label, count: news.filter((n) => n.topics.includes(t.label)).length }))

  const trend = trendByDay(news)

  const reputationTopicLabels = useMemo(() => new Set(topics.map((t) => t.label)), [topics])

  const reputationIssueRows = useMemo(() => {
    const byIssue = groupBy(news, (n) => n.issueId)
    return [...byIssue.entries()]
      .map(([issueId, items]) => {
        const issue = data.issues.find((i) => i.id === issueId)
        if (!issue) return null
        const isb = sentimentBreakdown(items)
        const dominant = isb.negative >= isb.positive && isb.negative >= isb.neutral ? 'Negative' : isb.positive >= isb.neutral ? 'Positive' : 'Neutral'
        const stakeholders = Array.from(new Set(items.flatMap((n) => n.stakeholders)))
        const media = Array.from(new Set(items.map((n) => data.media.find((m) => m.id === n.mediaId)?.name).filter(Boolean)))
        const categories = Array.from(new Set(items.flatMap((n) => n.topics))).filter((t) => reputationTopicLabels.has(t))
        return { issue, volume: items.length, sentiment: dominant as 'Positive' | 'Neutral' | 'Negative', stakeholders, media, categories }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.volume - a.volume)
  }, [news, data.issues, data.media, reputationTopicLabels])

  const issueColumns: Column<(typeof reputationIssueRows)[number]>[] = [
    { key: 'issue', header: 'Issue', render: (r) => <button onClick={() => navigate(`/issues/${r.issue.id}`)} className="text-left font-medium text-blue-700 hover:underline">{r.issue.name}</button> },
    {
      key: 'category',
      header: 'Category',
      render: (r) => (
        <div className="flex max-w-[220px] flex-wrap gap-1">
          {r.categories.length > 0 ? r.categories.map((c) => <Badge key={c} tone="blue">{c}</Badge>) : <span className="text-xs text-slate-400">—</span>}
        </div>
      ),
    },
    { key: 'volume', header: 'Volume', sortValue: (r) => r.volume, render: (r) => r.volume },
    { key: 'sentiment', header: 'Sentiment', render: (r) => <SentimentBadge sentiment={r.sentiment} /> },
    { key: 'stakeholder', header: 'Stakeholder', render: (r) => <span className="text-xs">{r.stakeholders.join(', ') || '—'}</span> },
    { key: 'media', header: 'Media', render: (r) => <span className="text-xs">{r.media.join(', ') || '—'}</span> },
    { key: 'risk', header: 'Risk', render: (r) => <RiskBadge risk={r.issue.riskLevel} /> },
  ]

  return (
    <div>
      <PageHeader configKey="corporate.title" title="Corporate Reputation" subtitleKey="corporate.subtitle" subtitle="Mengukur bagaimana perusahaan dipersepsikan oleh media dan stakeholder." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-500">Perusahaan:</span>
        {data.companies.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setCompanyId(c.id)
              setFilters((f) => ({ ...f, companyId: c.id }))
            }}
            className={`rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
              c.id === companyId ? 'bg-blue-600 text-white ring-blue-600' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {c.shortName}
          </button>
        ))}
      </div>

      <div className="mb-5">
        <FilterBar filters={filters} onChange={(f) => { setFilters(f); setCompanyId(f.companyId === 'All' ? companyId : f.companyId) }} showPillar={false} showCompany={false} />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Total News" value={formatNumber(news.length)} icon={Newspaper} tone="blue" hint={company.name} />
        <KpiCard label="Positive News" value={formatNumber(sb.positive)} icon={ThumbsUp} tone="emerald" />
        <KpiCard label="Neutral News" value={formatNumber(sb.neutral)} icon={PieChart} tone="slate" />
        <KpiCard label="Negative News" value={formatNumber(sb.negative)} icon={ThumbsDown} tone="red" />
        <KpiCard label="Potential Negative" value={formatNumber(potentialNegative)} icon={AlertOctagon} tone="amber" />
        <KpiCard label="PR Value" value={formatRupiah(prValue)} icon={Wallet} tone="blue" />
        <KpiCard label="Media Share" value={`${mediaShare}%`} icon={PieChart} tone="slate" hint="dari total pemberitaan Corporate" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Sentiment Trend" subtitle={`Tren sentimen pemberitaan ${company.shortName} dari waktu ke waktu`} />
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="positive" stroke="#1a8f5a" fill="#1a8f5a" fillOpacity={0.15} name="Positive" />
                <Area type="monotone" dataKey="neutral" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} name="Neutral" />
                <Area type="monotone" dataKey="negative" stroke="#c0392b" fill="#c0392b" fillOpacity={0.15} name="Negative" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Reputation Topics" subtitle="Distribusi topik reputasi" />
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={topicDist} layout="vertical" margin={{ left: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Bar dataKey="count" fill="#7c3aed" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Reputation Issue" subtitle="Isu reputasi beserta kategori, volume, sentimen, stakeholder, dan media terkait" />
        <CardBody>
          <Table columns={issueColumns} rows={reputationIssueRows} rowKey={(r) => r.issue.id} defaultSortKey="volume" />
        </CardBody>
      </Card>
    </div>
  )
}
