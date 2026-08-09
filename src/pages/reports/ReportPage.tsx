import { useMemo, useState } from 'react'
import { Download, FileText, Sparkles } from 'lucide-react'
import { useData } from '@/lib/store'
import { useToast } from '@/lib/toast'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { SentimentBadge, RiskBadge } from '@/components/ui/Badge'
import {
  emptyFilters,
  filterNews,
  industryPlayers,
  influencerRanking,
  mediaRanking,
  prValueBreakdown,
  sentimentBreakdown,
  topIssues,
  type IssueAgg,
} from '@/lib/aggregations'
import { formatDate, formatNumber, formatRupiah, percentage } from '@/lib/utils'
import type { GlobalFilters, NewsItem, Pillar } from '@/types'

type ReportType = 'industry' | 'esg' | 'corporate'

const REPORT_META: Record<ReportType, { title: string; subtitle: string; pillar: Pillar; icon: typeof FileText; accent: string }> = {
  industry: { title: 'Mining Industry Weekly Intelligence', subtitle: 'Report 1 — Industry Intelligence', pillar: 'Industry', icon: FileText, accent: 'blue' },
  esg: { title: 'Biodiversity & Environmental Weekly Intelligence', subtitle: 'Report 2 — ESG & Environmental Intelligence', pillar: 'ESG', icon: FileText, accent: 'teal' },
  corporate: { title: 'PTAR Weekly Media Intelligence', subtitle: 'Report 3 — Corporate Reputation Intelligence', pillar: 'Corporate', icon: FileText, accent: 'violet' },
}

const inputClass = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'
const textareaClass = `${inputClass} leading-relaxed`
const labelClass = 'mb-1 block text-xs font-medium text-slate-500'

function newsListColumns(): Column<NewsItem>[] {
  return [
    { key: 'date', header: 'Tanggal', render: (r) => formatDate(r.date) },
    { key: 'title', header: 'Judul', render: (r) => <span className="line-clamp-2 max-w-md">{r.title}</span> },
    { key: 'sentiment', header: 'Sentiment', render: (r) => <SentimentBadge sentiment={r.sentiment} /> },
  ]
}

export default function ReportPage({ reportType }: { reportType: ReportType }) {
  const { data } = useData()
  const { showToast } = useToast()
  const meta = REPORT_META[reportType]

  const [range, setRange] = useState({ dateFrom: emptyFilters().dateFrom, dateTo: emptyFilters().dateTo })
  const [companyId, setCompanyId] = useState('co-ptar')
  const [issueFilter, setIssueFilter] = useState('All')
  const [mediaType, setMediaType] = useState<'All' | 'Online' | 'Cetak' | 'TV'>('All')
  const [generated, setGenerated] = useState(false)

  const [execSummary, setExecSummary] = useState('')
  const [riskOpportunity, setRiskOpportunity] = useState('')
  const [strategicAttention, setStrategicAttention] = useState('')

  const baseFilters: Partial<GlobalFilters> = {
    dateFrom: range.dateFrom,
    dateTo: range.dateTo,
    pillar: meta.pillar,
    mediaType,
    companyId: reportType === 'corporate' ? companyId : 'All',
  }

  const news = useMemo(() => {
    let rows = filterNews(data.news, baseFilters)
    if (issueFilter !== 'All') rows = rows.filter((n) => n.issueId === issueFilter)
    return rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.news, range, companyId, mediaType, issueFilter, reportType])

  const sb = sentimentBreakdown(news)
  const issues = topIssues(news, data.issues, 8)
  const players = industryPlayers(news, data.companies)
  const influencers = influencerRanking(news, data.influencers, data.issues, 8)
  const media = mediaRanking(news, data.media, 8)
  const pr = prValueBreakdown(news)
  const positiveNews = [...news].filter((n) => n.sentiment === 'Positive').sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6)
  const negativeNews = [...news].filter((n) => n.sentiment === 'Negative').sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6)
  const relevantIssues = data.issues.filter((i) => i.pillar === meta.pillar)
  const online = news.filter((n) => n.mediaType === 'Online').length
  const print = news.filter((n) => n.mediaType === 'Cetak').length
  const tv = news.filter((n) => n.mediaType === 'TV').length

  const companyName = data.companies.find((c) => c.id === companyId)?.name ?? 'perusahaan'

  function autoSummary(): string {
    const topIssue = issues[0]
    const posPct = percentage(sb.positive, news.length || 1)
    const negPct = percentage(sb.negative, news.length || 1)
    const scope = reportType === 'corporate' ? companyName : reportType === 'esg' ? 'isu ESG & lingkungan' : 'industri pertambangan'
    return `Sepanjang periode ${formatDate(range.dateFrom)} – ${formatDate(range.dateTo)}, tercatat ${news.length} pemberitaan terkait ${scope}, dengan komposisi ${posPct}% positif, ${100 - posPct - negPct >= 0 ? 100 - posPct - negPct : 0}% netral, dan ${negPct}% negatif. Isu paling menonjol pada periode ini adalah "${topIssue?.issue.name ?? '—'}" dengan estimasi PR Value keseluruhan sebesar ${formatRupiah(pr.total)}.`
  }

  function autoRiskOpportunity(): string {
    const risk = issues.find((i) => i.sentiment.negative > 0) ?? issues[0]
    const opportunity = [...issues].sort((a, b) => b.sentiment.positive - a.sentiment.positive)[0]
    return `Risk: "${risk?.issue.name ?? '—'}" berpotensi membesar apabila tidak direspons (level risiko ${risk?.issue.riskLevel ?? '—'}).\nOpportunity: momentum positif pada isu "${opportunity?.issue.name ?? '—'}" dapat diperkuat melalui publikasi lanjutan dan kunjungan media.`
  }

  function autoStrategicAttention(): string {
    const risk = issues.find((i) => i.issue.riskLevel === 'Critical' || i.issue.riskLevel === 'High') ?? issues[0]
    return `Disarankan tim Corporate Communication memprioritaskan respons proaktif terhadap isu "${risk?.issue.name ?? '—'}", termasuk menyiapkan pernyataan resmi dan materi klarifikasi bagi media serta stakeholder terkait.`
  }

  function handleGenerate() {
    setExecSummary(autoSummary())
    setRiskOpportunity(autoRiskOpportunity())
    setStrategicAttention(autoStrategicAttention())
    setGenerated(true)
    showToast('Report berhasil digenerate. Geser ke bawah untuk melihat preview.')
  }

  function handleExport() {
    const lines: string[] = []
    lines.push(`# ${meta.title}`)
    lines.push(`_${meta.subtitle} · Periode ${formatDate(range.dateFrom)} – ${formatDate(range.dateTo)}_`)
    lines.push('\n> DEMO / SAMPLE DATA — NOT REAL-TIME DATA\n')
    lines.push('## Executive Summary\n' + execSummary)
    lines.push('\n## Key Issues')
    issues.forEach((i) => lines.push(`- ${i.issue.name} (${i.count} berita, risiko ${i.issue.riskLevel})`))
    lines.push('\n## Media Share')
    media.forEach((m) => lines.push(`- ${m.name}: ${m.count} berita (${m.share}%)`))
    lines.push('\n## Influencer')
    influencers.forEach((i) => lines.push(`- ${i.name} (${i.count} pernyataan) — isu utama: ${i.mainIssue}`))
    lines.push('\n## Positive News')
    positiveNews.forEach((n) => lines.push(`- ${n.title}`))
    lines.push('\n## Negative News')
    negativeNews.forEach((n) => lines.push(`- ${n.title}`))
    lines.push('\n## Risk & Opportunity\n' + riskOpportunity)
    lines.push('\n## Recommended Strategic Attention\n' + strategicAttention)

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${meta.title.replace(/\s+/g, '-').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Report diexport sebagai file Markdown.')
  }

  const issueColumns: Column<IssueAgg>[] = [
    { key: 'name', header: 'Issue', render: (r) => r.issue.name },
    { key: 'count', header: 'Volume', sortValue: (r) => r.count, render: (r) => r.count },
    { key: 'risk', header: 'Risk', render: (r) => <RiskBadge risk={r.issue.riskLevel} /> },
  ]

  return (
    <div>
      <PageHeader configKey={`report.${reportType}.title`} title={meta.title} subtitleKey={`report.${reportType}.subtitle`} subtitle={meta.subtitle} />

      <Card className="mb-5">
        <CardHeader title="Report Builder" subtitle="Pilih periode, perusahaan, isu, dan media, lalu generate laporan" />
        <CardBody>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <label className={labelClass}>Dari</label>
              <input type="date" className={inputClass} value={range.dateFrom} onChange={(e) => setRange((r) => ({ ...r, dateFrom: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Sampai</label>
              <input type="date" className={inputClass} value={range.dateTo} onChange={(e) => setRange((r) => ({ ...r, dateTo: e.target.value }))} />
            </div>
            {reportType === 'corporate' && (
              <div>
                <label className={labelClass}>Perusahaan</label>
                <select className={inputClass} value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
                  {data.companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.shortName}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className={labelClass}>Issue</label>
              <select className={inputClass} value={issueFilter} onChange={(e) => setIssueFilter(e.target.value)}>
                <option value="All">Semua Issue</option>
                {relevantIssues.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Media</label>
              <select className={inputClass} value={mediaType} onChange={(e) => setMediaType(e.target.value as typeof mediaType)}>
                <option value="All">Semua Media</option>
                <option value="Online">Online</option>
                <option value="Cetak">Cetak</option>
                <option value="TV">TV</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={handleGenerate} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <Sparkles className="h-4 w-4" />
              Generate Report
            </button>
            {generated && (
              <button onClick={handleExport} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Download className="h-4 w-4" />
                Export (.md)
              </button>
            )}
          </div>
        </CardBody>
      </Card>

      {!generated && (
        <Card>
          <CardBody className="py-12 text-center text-sm text-slate-400">Atur parameter di atas lalu klik "Generate Report" untuk melihat preview laporan.</CardBody>
        </Card>
      )}

      {generated && (
        <div className="space-y-5">
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
            DEMO / SAMPLE DATA — NOT REAL-TIME DATA. Tabel di bawah bersumber otomatis dari data monitoring saat ini; narasi dapat diedit bebas.
          </div>

          <Card>
            <CardHeader title="Executive Summary" subtitle="Editable" />
            <CardBody>
              <textarea className={textareaClass} rows={3} value={execSummary} onChange={(e) => setExecSummary(e.target.value)} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Key Issues" subtitle={reportType === 'industry' ? 'Highlight Issues' : reportType === 'esg' ? 'Isu ESG & Lingkungan Utama' : 'Isu Reputasi Utama'} />
            <CardBody>
              <Table columns={issueColumns} rows={issues} rowKey={(r) => r.issue.id} />
            </CardBody>
          </Card>

          {reportType === 'industry' && (
            <Card>
              <CardHeader title="Industry Players" subtitle="Ranking perusahaan berdasarkan volume dan sentimen" />
              <CardBody>
                <Table
                  columns={[
                    { key: 'name', header: 'Company', render: (r) => r.name },
                    { key: 'volume', header: 'Volume', render: (r) => r.volume },
                    { key: 'score', header: 'Reputation', render: (r) => `${r.reputationScore}/100` },
                  ]}
                  rows={players}
                  rowKey={(r) => r.companyId}
                />
              </CardBody>
            </Card>
          )}

          {reportType === 'esg' && (
            <Card>
              <CardHeader title="Cakupan Lokasi" subtitle="Sumatera Utara & sekitarnya, mengikuti cakupan konsesi tambang pada data demo ini" />
              <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="text-xs text-slate-400">Biodiversity</p>
                  <p className="mt-1 text-xl font-semibold text-slate-800">{news.filter((n) => n.topics.some((t) => ['Wildlife', 'Habitat', 'Conservation', 'Deforestation', 'Restoration'].includes(t))).length}</p>
                </div>
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="text-xs text-slate-400">Environmental Issues</p>
                  <p className="mt-1 text-xl font-semibold text-slate-800">{news.filter((n) => n.topics.some((t) => ['Water Pollution', 'Air Pollution', 'Land Degradation', 'River Damage', 'Ecosystem Damage', 'Mining Impact'].includes(t))).length}</p>
                </div>
                <div className="rounded-lg border border-slate-100 p-3">
                  <p className="text-xs text-slate-400">ESG Implementation</p>
                  <p className="mt-1 text-xl font-semibold text-slate-800">{news.filter((n) => n.topics.some((t) => ['ESG Implementation', 'Sustainability', 'ESG Award', 'ESG Reporting', 'Compliance', 'Greenwashing'].includes(t))).length}</p>
                </div>
              </CardBody>
            </Card>
          )}

          {reportType === 'corporate' && (
            <>
              <Card>
                <CardHeader title="Sentiment" />
                <CardBody className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-semibold text-emerald-600">{sb.positive}</p>
                    <p className="text-xs text-slate-400">Positive News</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-slate-500">{sb.neutral}</p>
                    <p className="text-xs text-slate-400">Neutral News</p>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-red-600">{sb.negative}</p>
                    <p className="text-xs text-slate-400">Negative News</p>
                  </div>
                </CardBody>
              </Card>
              <Card>
                <CardHeader title="PR Value" subtitle="Berdasarkan tipe media" />
                <CardBody className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border border-slate-100 p-3"><p className="text-xs text-slate-400">Online</p><p className="mt-1 font-semibold">{formatRupiah(pr.online)}</p></div>
                  <div className="rounded-lg border border-slate-100 p-3"><p className="text-xs text-slate-400">Print</p><p className="mt-1 font-semibold">{formatRupiah(pr.print)}</p></div>
                  <div className="rounded-lg border border-slate-100 p-3"><p className="text-xs text-slate-400">TV</p><p className="mt-1 font-semibold">{formatRupiah(pr.tv)}</p></div>
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-3"><p className="text-xs text-blue-500">Total</p><p className="mt-1 font-semibold text-blue-700">{formatRupiah(pr.total)}</p></div>
                </CardBody>
              </Card>
            </>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Influencer" />
              <CardBody>
                <Table
                  columns={[
                    { key: 'name', header: 'Name', render: (r) => r.name },
                    { key: 'count', header: 'Statements', render: (r) => r.count },
                    { key: 'issue', header: 'Main Issue', render: (r) => r.mainIssue },
                  ]}
                  rows={influencers}
                  rowKey={(r) => r.name}
                />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Media Share" />
              <CardBody>
                <Table
                  columns={[
                    { key: 'name', header: 'Media', render: (r) => r.name },
                    { key: 'count', header: 'Articles', render: (r) => r.count },
                    { key: 'share', header: 'Share %', render: (r) => `${r.share}%` },
                  ]}
                  rows={media}
                  rowKey={(r) => r.mediaId}
                />
              </CardBody>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title={reportType === 'industry' ? 'Positive News' : 'Positive Issue'} />
              <CardBody>
                <Table columns={newsListColumns()} rows={positiveNews} rowKey={(r) => r.id} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title={reportType === 'industry' ? 'Negative News' : 'Negative Issue'} />
              <CardBody>
                <Table columns={newsListColumns()} rows={negativeNews} rowKey={(r) => r.id} />
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader title="Risk & Opportunity" subtitle="Editable" />
            <CardBody>
              <textarea className={textareaClass} rows={3} value={riskOpportunity} onChange={(e) => setRiskOpportunity(e.target.value)} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Recommended Strategic Attention" subtitle="Editable" />
            <CardBody>
              <textarea className={textareaClass} rows={2} value={strategicAttention} onChange={(e) => setStrategicAttention(e.target.value)} />
            </CardBody>
          </Card>

          <p className="text-center text-xs text-slate-400">Total {formatNumber(news.length)} berita dianalisis untuk laporan ini · Online {online} · Cetak {print} · TV {tv}</p>
        </div>
      )}
    </div>
  )
}
