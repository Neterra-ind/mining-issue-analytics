import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, LabelList, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useData } from '@/lib/store'
import { PageHeader } from '@/components/PageHeader'
import { FilterBar } from '@/components/FilterBar'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Badge, RiskBadge, SentimentBadge } from '@/components/ui/Badge'
import { InfluencerDetailDrawer } from '@/components/InfluencerDetailDrawer'
import { ReputationOverview } from '@/components/reputation/ReputationOverview'
import { TopicRadar } from '@/components/reputation/TopicRadar'
import { PtarFeedPanel } from '@/components/reputation/PtarFeedPanel'
import { emptyFilters, filterNews, influencerRanking, sentimentBreakdown } from '@/lib/aggregations'
import { formatRupiah, groupBy, percentage } from '@/lib/utils'
import type { GlobalFilters, Influencer, MediaTier } from '@/types'

const MEDIA_TIERS: MediaTier[] = ['Tier 1', 'Tier 2', 'Tier 3', 'Belum dinilai']
const SENTIMENT_COLOR = { Positive: '#1F6F9F', Neutral: '#9AA3AD', Negative: '#E58A2B' } as const

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
  const news = useMemo(() => filterNews(data.news, { ...filters, pillar: 'Corporate', companyId }), [data.news, filters, companyId])

  // Ringkasan reputasi membaca semua pilar untuk perusahaan terpilih, agar isu ESG/lingkungan ikut terlihat.
  const overviewNews = useMemo(() => filterNews(data.news, { ...filters, pillar: 'All', companyId }), [data.news, filters, companyId])

  const topics = data.taxonomy.filter((t) => t.pillar === 'Corporate').sort((a, b) => a.order - b.order)
  const topicDist = topics.map((t) => ({ label: t.label, count: news.filter((n) => n.topics.includes(t.label)).length }))

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
        return { issue, volume: items.length, sentiment: dominant as 'Positive' | 'Neutral' | 'Negative', breakdown: isb, stakeholders, media, categories }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.volume - a.volume)
  }, [news, data.issues, data.media, reputationTopicLabels])

  const tierShare = useMemo(() => {
    const mediaMap = new Map(data.media.map((m) => [m.id, m]))
    const byTier = groupBy(news, (n) => mediaMap.get(n.mediaId)?.tier ?? 'Tanpa tier')
    return MEDIA_TIERS.map((tier) => {
      const items = byTier.get(tier) ?? []
      const outlets = groupBy(items, (n) => mediaMap.get(n.mediaId)?.name ?? '—')
      return {
        tier,
        count: items.length,
        share: percentage(items.length, news.length || 1),
        sentiment: sentimentBreakdown(items),
        prValue: items.reduce((s, n) => s + n.prValue, 0),
        outlets: [...outlets.entries()].map(([name, arr]) => ({ name, count: arr.length })).sort((a, b) => b.count - a.count),
      }
    })
  }, [news, data.media])

  const tierChart = useMemo(
    () =>
      tierShare.map((t) => ({
        tier: t.tier,
        Positive: t.sentiment.positive,
        Neutral: t.sentiment.neutral,
        Negative: t.sentiment.negative,
        shareLabel: t.count > 0 ? `${t.share}%` : '',
      })),
    [tierShare],
  )

  const influencers = useMemo(() => influencerRanking(news, data.influencers, data.issues, 10), [news, data.influencers, data.issues])
  // Grafik influencer di sebelah "Siapa yang terlihat": semua pilar, perusahaan terpilih, 8 aktor teratas.
  const influencerChartRows = useMemo(() => influencerRanking(overviewNews, data.influencers, data.issues, 8), [overviewNews, data.influencers, data.issues])
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null)

  const influencerColumns: Column<(typeof influencers)[number]>[] = [
    {
      key: 'name',
      header: 'Nama',
      sortValue: (r) => r.name,
      render: (r) =>
        r.matched ? (
          <button onClick={() => setSelectedInfluencer(r.matched)} className="text-left font-medium text-blue-700 hover:underline">
            {r.name}
          </button>
        ) : (
          <span className="font-medium text-slate-800">{r.name}</span>
        ),
    },
    {
      key: 'position',
      header: 'Jabatan / Organisasi',
      render: (r) => (r.matched ? <span className="text-xs">{r.matched.position} · {r.matched.organization}</span> : <span className="text-xs text-slate-400">Belum terdaftar</span>),
    },
    {
      key: 'scope',
      header: 'Internal / Eksternal',
      sortValue: (r) => r.matched?.scope ?? '',
      render: (r) => (r.matched ? <Badge tone={r.matched.scope === 'Internal' ? 'blue' : 'slate'}>{r.matched.scope}</Badge> : '—'),
    },
    { key: 'category', header: 'Kategori', render: (r) => r.matched?.category ?? '—' },
    { key: 'count', header: 'Pernyataan', sortValue: (r) => r.count, render: (r) => r.count },
    { key: 'issue', header: 'Isu Utama', render: (r) => <span className="text-xs">{r.mainIssue}</span> },
    { key: 'sentiment', header: 'Sentimen', render: (r) => <SentimentBadge sentiment={r.sentimentLean} /> },
  ]

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

      <ReputationOverview news={overviewNews} issues={data.issues} companyName={company.shortName} onOpenIssue={(id) => navigate(`/issues/${id}`)}
        influencerChart={
          <Card>
            <CardHeader title="Influencers" subtitle="Aktor yang paling sering dikutip; warna batang adalah kecenderungan nada pernyataannya." />
            <CardBody>
              {influencerChartRows.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">Belum ada aktor yang tercatat untuk filter ini.</p>
              ) : (
                <>
                  <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                    {([['Positive', 'Positif'], ['Neutral', 'Netral'], ['Negative', 'Negatif']] as const).map(([k, l]) => (
                      <span key={k} className="inline-flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: SENTIMENT_COLOR[k] }} />
                        {l}
                      </span>
                    ))}
                  </div>
                  <div className="space-y-2.5 text-xs">
                    {influencerChartRows.map((r) => (
                      <div key={r.name} className="grid grid-cols-[170px_minmax(0,1fr)_28px] items-center gap-2.5">
                        <div className="min-w-0">
                          <div className="truncate font-medium text-slate-800" title={r.name}>{r.name}</div>
                          <div className="truncate text-[11px] text-slate-400" title={r.matched ? `${r.matched.position} · ${r.matched.organization}` : 'Belum terdaftar'}>
                            {r.matched ? `${r.matched.scope === 'Internal' ? 'Internal' : 'Eksternal'} · ${r.matched.organization}` : 'Belum terdaftar'}
                          </div>
                        </div>
                        <span className="block h-3.5 rounded-sm" style={{ backgroundColor: SENTIMENT_COLOR[r.sentimentLean], width: `${(r.count / influencerChartRows[0].count) * 100}%` }} />
                        <span className="text-right text-slate-600">{r.count}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-slate-400">Angka = jumlah berita yang mengutip aktor itu. Berita tanpa aktor tercatat tidak dihitung.</p>
                </>
              )}
            </CardBody>
          </Card>
        }
        topicChart={
          <Card>
            <CardHeader title="Reputation Topics" subtitle="Jumlah berita per topik reputasi; makin jauh dari pusat, makin banyak" />
            <CardBody>
              <TopicRadar data={topicDist} />
            </CardBody>
          </Card>
        }
      />

      <div className={`mb-5 grid grid-cols-1 gap-4 ${companyId === 'co-ptar' ? 'xl:grid-cols-2' : ''}`}>
        {companyId === 'co-ptar' && <PtarFeedPanel />}
        <Card>
          <CardHeader title="Media per Tier" subtitle="Jumlah pemberitaan per tier media, dipilah menurut sentimen" />
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={tierChart} margin={{ top: 20, right: 8, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="tier" tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} cursor={{ fill: '#f8fafc' }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Positive" stackId="t" fill={SENTIMENT_COLOR.Positive} maxBarSize={64} />
                <Bar dataKey="Neutral" stackId="t" fill={SENTIMENT_COLOR.Neutral} maxBarSize={64} />
                <Bar dataKey="Negative" stackId="t" fill={SENTIMENT_COLOR.Negative} maxBarSize={64} radius={[4, 4, 0, 0]}>
                  <LabelList dataKey="shareLabel" position="top" style={{ fontSize: 11, fill: '#334155', fontWeight: 600 }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <ul className="mt-3 space-y-1 border-t border-slate-100 pt-3">
              {tierShare.map((t) => (
                <li key={t.tier} className="text-xs text-slate-500">
                  <span className="font-medium text-slate-700">{t.tier}</span> · {t.count} berita · PR {formatRupiah(t.prValue)}
                  {t.outlets.length > 0 && (
                    <span className="text-slate-400">
                      {' '}— {t.outlets.slice(0, 6).map((o) => `${o.name} (${o.count})`).join(', ')}
                      {t.outlets.length > 6 && ` dan ${t.outlets.length - 6} media lain`}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <Card className="mb-5">
        <CardHeader title="Influencers" subtitle={`Aktor internal dan eksternal yang paling sering dikutip dalam pemberitaan ${company.shortName}. Klik nama untuk melihat pernyataannya.`} />
        <CardBody>
          <Table columns={influencerColumns} rows={influencers} rowKey={(r) => r.name} defaultSortKey="count" />
        </CardBody>
      </Card>

      <InfluencerDetailDrawer influencer={selectedInfluencer} onClose={() => setSelectedInfluencer(null)} />

      <Card>
        <CardHeader title="Reputation Issue" subtitle="Isu reputasi beserta kategori, volume, sentimen, stakeholder, dan media terkait" />
        <CardBody>
          <Table columns={issueColumns} rows={reputationIssueRows} rowKey={(r) => r.issue.id} defaultSortKey="volume" />
        </CardBody>
      </Card>
    </div>
  )
}
