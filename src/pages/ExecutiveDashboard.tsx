import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle, Flame, Newspaper, ShieldAlert, ThumbsDown, ThumbsUp, TrendingUp, Wallet } from 'lucide-react'
import { useData } from '@/lib/store'
import { PageHeader } from '@/components/PageHeader'
import { FilterBar } from '@/components/FilterBar'
import { KpiCard } from '@/components/ui/KpiCard'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { SentimentBadge, RiskBadge } from '@/components/ui/Badge'
import { NewsDetailDrawer } from '@/components/news/NewsDetailDrawer'
import {
  computeExecutiveKpis,
  emptyFilters,
  filterNews,
  influencerRanking,
  mediaRanking,
  topIssues,
  trendByDay,
} from '@/lib/aggregations'
import { formatNumber, formatRupiah } from '@/lib/utils'
import type { NewsItem } from '@/types'

export default function ExecutiveDashboard() {
  const { data } = useData()
  const navigate = useNavigate()
  const [filters, setFilters] = useState(emptyFilters())
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)

  const news = useMemo(() => filterNews(data.news, filters), [data.news, filters])
  const kpis = useMemo(() => computeExecutiveKpis(news, data.issues), [news, data.issues])
  const trend = useMemo(() => trendByDay(news), [news])
  const issues = useMemo(() => topIssues(news, data.issues, 5), [news, data.issues])
  const media = useMemo(() => mediaRanking(news, data.media, 5), [news, data.media])
  const influencers = useMemo(() => influencerRanking(news, data.influencers, data.issues, 5), [news, data.influencers, data.issues])
  const recentNews = useMemo(() => [...news].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6), [news])

  return (
    <div>
      <PageHeader
        configKey="exec.title"
        title="Executive Overview"
        subtitleKey="exec.subtitle"
        subtitle="Ringkasan lintas Industry, ESG, dan Corporate Reputation Intelligence."
      />

      <div className="mb-5">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-4">
        <KpiCard label="Total News" value={formatNumber(kpis.totalNews)} icon={Newspaper} tone="blue" />
        <KpiCard label="Positive News" value={formatNumber(kpis.positive)} icon={ThumbsUp} tone="emerald" />
        <KpiCard label="Neutral News" value={formatNumber(kpis.neutral)} icon={TrendingUp} tone="slate" />
        <KpiCard label="Negative News" value={formatNumber(kpis.negative)} icon={ThumbsDown} tone="red" />
        <KpiCard label="Potential Risk" value={formatNumber(kpis.potentialRisk)} icon={AlertTriangle} tone="amber" hint="Berita risiko High & Critical" />
        <KpiCard label="Critical Issues" value={formatNumber(kpis.criticalIssues)} icon={ShieldAlert} tone="red" />
        <KpiCard label="Top Issue" value={kpis.topIssueName} icon={Flame} tone="amber" />
        <KpiCard label="PR Value" value={formatRupiah(kpis.prValue)} icon={Wallet} tone="blue" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Tren Pemberitaan & Sentimen" subtitle="Volume berita harian berdasarkan sentimen" />
          <CardBody>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gPos" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1a8f5a" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1a8f5a" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gNeu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gNeg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c0392b" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#c0392b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="positive" stackId="1" stroke="#1a8f5a" fill="url(#gPos)" name="Positive" />
                <Area type="monotone" dataKey="neutral" stackId="1" stroke="#94a3b8" fill="url(#gNeu)" name="Neutral" />
                <Area type="monotone" dataKey="negative" stackId="1" stroke="#c0392b" fill="url(#gNeg)" name="Negative" />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Top Issues" subtitle="Isu dengan volume pemberitaan tertinggi" />
          <CardBody className="space-y-3">
            {issues.map((row) => (
              <button
                key={row.issue.id}
                onClick={() => navigate(`/issues/${row.issue.id}`)}
                className="flex w-full items-start justify-between gap-2 rounded-lg border border-slate-100 p-2.5 text-left hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{row.issue.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{row.issue.category} · {row.count} berita</p>
                </div>
                <RiskBadge risk={row.issue.riskLevel} />
              </button>
            ))}
            {issues.length === 0 && <p className="text-sm text-slate-400">Belum ada data untuk filter ini.</p>}
          </CardBody>
        </Card>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Top Media" subtitle="Media dengan jumlah pemberitaan terbanyak" />
          <CardBody className="space-y-2.5">
            {media.map((m) => (
              <div key={m.mediaId} className="flex items-center justify-between text-sm">
                <span className="truncate text-slate-700">{m.name}</span>
                <span className="ml-2 shrink-0 font-medium text-slate-500">{m.count} · {m.share}%</span>
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Top Influencer" subtitle="Aktor paling sering dikutip media" />
          <CardBody className="space-y-2.5">
            {influencers.map((inf) => (
              <div key={inf.name} className="flex items-center justify-between gap-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-700">{inf.name}</p>
                  <p className="truncate text-xs text-slate-400">{inf.matched?.position ?? inf.mainIssue}</p>
                </div>
                <SentimentBadge sentiment={inf.sentimentLean} className="shrink-0" />
              </div>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Berita Terbaru" subtitle="Klik untuk membuka detail" />
          <CardBody className="space-y-2.5">
            {recentNews.map((n) => (
              <button key={n.id} onClick={() => setSelectedNews(n)} className="block w-full text-left">
                <p className="line-clamp-2 text-sm font-medium text-slate-700 hover:text-blue-600">{n.title}</p>
                <p className="mt-0.5 text-xs text-slate-400">{n.location}</p>
              </button>
            ))}
          </CardBody>
        </Card>
      </div>

      <NewsDetailDrawer news={selectedNews} onClose={() => setSelectedNews(null)} />
    </div>
  )
}
