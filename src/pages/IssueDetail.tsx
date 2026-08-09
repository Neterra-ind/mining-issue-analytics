import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowLeft, Building2 } from 'lucide-react'
import { useData } from '@/lib/store'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { PillarBadge, RiskBadge, SentimentBadge } from '@/components/ui/Badge'
import { NewsTable } from '@/components/news/NewsTable'
import { NewsDetailDrawer } from '@/components/news/NewsDetailDrawer'
import { InfluencerDetailDrawer } from '@/components/InfluencerDetailDrawer'
import { MediaDetailDrawer } from '@/components/MediaDetailDrawer'
import { Table, type Column } from '@/components/ui/Table'
import { issueDetail } from '@/lib/aggregations'
import { formatNumber } from '@/lib/utils'
import type { Influencer, MediaOutlet, NewsItem } from '@/types'
import type { InfluencerAgg, MediaAgg } from '@/lib/aggregations'

export default function IssueDetail() {
  const { issueId } = useParams()
  const { data } = useData()
  const navigate = useNavigate()
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null)
  const [selectedMedia, setSelectedMedia] = useState<MediaOutlet | null>(null)

  const detail = useMemo(
    () => issueDetail(issueId ?? '', data.news, data.issues, data.media, data.influencers, data.companies),
    [issueId, data.news, data.issues, data.media, data.influencers, data.companies],
  )

  if (!detail.issue) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-slate-500">Isu tidak ditemukan.</p>
        <Link to="/issues" className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline">
          Kembali ke Issue Monitoring
        </Link>
      </div>
    )
  }

  const { issue, relatedNews, timeline, mediaAgg, influencerAgg, relatedCompanies } = detail
  const sb = { positive: relatedNews.filter((n) => n.sentiment === 'Positive').length, neutral: relatedNews.filter((n) => n.sentiment === 'Neutral').length, negative: relatedNews.filter((n) => n.sentiment === 'Negative').length }

  const mediaColumns: Column<MediaAgg>[] = [
    { key: 'name', header: 'Media', render: (r) => r.name },
    { key: 'count', header: 'Berita', sortValue: (r) => r.count, render: (r) => r.count },
    { key: 'share', header: 'Share', render: (r) => `${r.share}%` },
  ]

  const influencerColumns: Column<InfluencerAgg>[] = [
    { key: 'name', header: 'Actor', render: (r) => <span className="font-medium">{r.name}</span> },
    { key: 'position', header: 'Position', render: (r) => r.matched?.position ?? '—' },
    { key: 'count', header: 'Statements', sortValue: (r) => r.count, render: (r) => r.count },
    { key: 'sentiment', header: 'Sentiment', render: (r) => <SentimentBadge sentiment={r.sentimentLean} /> },
  ]

  return (
    <div>
      <button onClick={() => navigate(-1)} className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-3.5 w-3.5" /> Kembali
      </button>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <PillarBadge pillar={issue.pillar} />
            <span className="text-xs text-slate-400">{issue.category}</span>
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">{issue.name}</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{issue.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <RiskBadge risk={issue.riskLevel} />
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            Trend {issue.trend === 'up' ? '↑ Naik' : issue.trend === 'down' ? '↓ Turun' : '→ Stabil'}
          </span>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card>
          <CardBody>
            <p className="text-xs text-slate-500">Volume</p>
            <p className="mt-1 text-2xl font-semibold text-slate-900">{formatNumber(relatedNews.length)}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-slate-500">Positive News</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-600">{sb.positive}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-slate-500">Neutral News</p>
            <p className="mt-1 text-2xl font-semibold text-slate-500">{sb.neutral}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-slate-500">Negative News</p>
            <p className="mt-1 text-2xl font-semibold text-red-600">{sb.negative}</p>
          </CardBody>
        </Card>
      </div>

      <Card className="mb-5">
        <CardHeader title="Timeline" subtitle="Perkembangan volume pemberitaan isu ini dari waktu ke waktu" />
        <CardBody>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={timeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Line type="monotone" dataKey="total" stroke="#1a4d8f" strokeWidth={2} dot={{ r: 3 }} name="Total Berita" />
            </LineChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Media" subtitle="Media yang memberitakan isu ini" />
          <CardBody>
            <Table
              columns={mediaColumns}
              rows={mediaAgg}
              rowKey={(r) => r.mediaId}
              onRowClick={(r) => setSelectedMedia(data.media.find((m) => m.id === r.mediaId) ?? null)}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Influencers" subtitle="Aktor yang berbicara mengenai isu ini" />
          <CardBody>
            <Table
              columns={influencerColumns}
              rows={influencerAgg}
              rowKey={(r) => r.name}
              onRowClick={(r) =>
                setSelectedInfluencer(r.matched ?? { id: `stub-${r.name}`, name: r.name, position: 'Narasumber / Aktor Media', organization: '—', scope: 'External', category: 'Unclassified' })
              }
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Companies" subtitle="Perusahaan yang terkait dengan isu ini" />
          <CardBody className="space-y-2">
            {relatedCompanies.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/corporate?company=${c.id}`)}
                className="flex w-full items-center gap-2.5 rounded-lg border border-slate-100 p-2.5 text-left hover:border-blue-200 hover:bg-blue-50/40"
              >
                <Building2 className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{c.name}</p>
                  <p className="text-xs text-slate-400">{c.sector}</p>
                </div>
              </button>
            ))}
            {relatedCompanies.length === 0 && <p className="text-sm text-slate-400">Tidak ada perusahaan spesifik terkait isu ini.</p>}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Related News" subtitle="Seluruh berita yang membentuk isu ini" />
        <CardBody>
          <NewsTable rows={relatedNews} onRowClick={setSelectedNews} />
        </CardBody>
      </Card>

      <NewsDetailDrawer news={selectedNews} onClose={() => setSelectedNews(null)} />
      <InfluencerDetailDrawer influencer={selectedInfluencer} onClose={() => setSelectedInfluencer(null)} />
      <MediaDetailDrawer media={selectedMedia} onClose={() => setSelectedMedia(null)} />
    </div>
  )
}
