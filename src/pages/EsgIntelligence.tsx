import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts'
import { Leaf, Turtle, Droplets } from 'lucide-react'
import { useData } from '@/lib/store'
import { PageHeader } from '@/components/PageHeader'
import { FilterBar } from '@/components/FilterBar'
import { KpiCard } from '@/components/ui/KpiCard'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { EsgFrameBadge, RiskBadge, SentimentBadge } from '@/components/ui/Badge'
import { ESG_FRAMES, ESG_FRAME_DEFINITIONS, esgFrameBreakdown } from '@/lib/boundaries'
import { emptyFilters, filterNews, riskMatrix, sentimentBreakdown, type RiskMatrixPoint } from '@/lib/aggregations'
import { formatNumber, groupBy } from '@/lib/utils'
import type { GlobalFilters } from '@/types'

const QUADRANT_COLOR: Record<RiskMatrixPoint['quadrant'], string> = {
  Monitor: '#4b9c5f',
  Watch: '#d3a625',
  Attention: '#e07a2b',
  Critical: '#c0392b',
}

function TopicChart({ title, subtitle, items, color }: { title: string; subtitle: string; items: { label: string; count: number }[]; color: string }) {
  return (
    <Card>
      <CardHeader title={title} subtitle={subtitle} />
      <CardBody>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={items} layout="vertical" margin={{ left: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            <Bar dataKey="count" fill={color} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardBody>
    </Card>
  )
}

export default function EsgIntelligence() {
  const { data } = useData()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<GlobalFilters>({ ...emptyFilters(), pillar: 'ESG' })

  const news = useMemo(() => filterNews(data.news, { ...filters, pillar: 'ESG' }), [data.news, filters])
  const esgIssues = useMemo(() => data.issues.filter((i) => i.pillar === 'ESG'), [data.issues])
  const taxonomy = data.taxonomy.filter((t) => t.pillar === 'ESG')

  const biodiversity = taxonomy.filter((t) => t.group === 'Biodiversity').sort((a, b) => a.order - b.order)
  const environmental = taxonomy.filter((t) => t.group === 'Environmental Issues').sort((a, b) => a.order - b.order)
  const esgMonitoring = taxonomy.filter((t) => t.group === 'ESG').sort((a, b) => a.order - b.order)

  const biodiversityDist = biodiversity.map((t) => ({ label: t.label, count: news.filter((n) => n.topics.includes(t.label)).length }))
  const environmentalDist = environmental.map((t) => ({ label: t.label, count: news.filter((n) => n.topics.includes(t.label)).length }))
  const esgDist = esgMonitoring.map((t) => ({ label: t.label, count: news.filter((n) => n.topics.includes(t.label)).length }))

  const matrix = useMemo(() => riskMatrix(news, esgIssues), [news, esgIssues])
  const frames = useMemo(() => esgFrameBreakdown(news), [news])

  const riskMapRows = useMemo(() => {
    const byIssue = groupBy(news, (n) => n.issueId)
    return esgIssues
      .map((issue) => {
        const items = byIssue.get(issue.id) ?? []
        if (items.length === 0) return null
        const locationCounts = groupBy(items, (n) => n.location)
        const [topLocation] = [...locationCounts.entries()].sort((a, b) => b[1].length - a[1].length)[0] ?? ['—']
        const sb = sentimentBreakdown(items)
        const dominant = sb.negative >= sb.positive && sb.negative >= sb.neutral ? 'Negative' : sb.positive >= sb.neutral ? 'Positive' : 'Neutral'
        return { issue, count: items.length, location: topLocation, actor: items[0].actor, sentiment: dominant as 'Positive' | 'Neutral' | 'Negative' }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.count - a.count)
  }, [esgIssues, news])

  const riskMapColumns: Column<(typeof riskMapRows)[number]>[] = [
    { key: 'issue', header: 'Issue', render: (r) => <button onClick={() => navigate(`/issues/${r.issue.id}`)} className="text-left font-medium text-blue-700 hover:underline">{r.issue.name}</button> },
    { key: 'location', header: 'Location', render: (r) => r.location },
    { key: 'actor', header: 'Actor', render: (r) => r.actor },
    { key: 'impact', header: 'Impact', render: (r) => <span className="line-clamp-2 max-w-xs text-xs text-slate-500">{r.issue.description}</span> },
    { key: 'sentiment', header: 'Sentiment', render: (r) => <SentimentBadge sentiment={r.sentiment} /> },
    { key: 'severity', header: 'Severity', render: (r) => <RiskBadge risk={r.issue.riskLevel} /> },
    { key: 'trend', header: 'Trend', render: (r) => (r.issue.trend === 'up' ? '↑ Naik' : r.issue.trend === 'down' ? '↓ Turun' : '→ Stabil') },
  ]

  return (
    <div>
      <PageHeader configKey="esg.title" title="ESG & Environmental" subtitleKey="esg.subtitle" subtitle="Memantau perkembangan biodiversity, lingkungan, dampak pertambangan, dan ESG." />

      <div className="mb-5">
        <FilterBar filters={filters} onChange={setFilters} showPillar={false} />
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <KpiCard label="Total ESG Coverage" value={formatNumber(news.length)} icon={Leaf} tone="blue" />
        <KpiCard label="Biodiversity News" value={formatNumber(biodiversityDist.reduce((s, d) => s + d.count, 0))} icon={Turtle} tone="emerald" />
        <KpiCard label="Environmental Issues" value={formatNumber(environmentalDist.reduce((s, d) => s + d.count, 0))} icon={Droplets} tone="amber" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <TopicChart title="Biodiversity" subtitle="Wildlife, habitat, konservasi, deforestasi, restorasi" items={biodiversityDist} color="#0e7c86" />
        <TopicChart title="Environmental Issues" subtitle="Pencemaran air, udara, kerusakan lahan & sungai" items={environmentalDist} color="#c98a1f" />
        <TopicChart title="ESG Monitoring" subtitle="Implementasi, sustainability, award, greenwashing" items={esgDist} color="#1a4d8f" />
      </div>

      <Card className="mb-5">
        <CardHeader title="Bingkai Pemberitaan ESG" subtitle="Cara media membingkai PT AR pada berita berpilar utama ESG" />
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {ESG_FRAMES.map((frame) => (
            <div key={frame} className="rounded-lg border border-slate-100 p-3">
              <div className="flex items-center justify-between gap-2">
                <EsgFrameBadge frame={frame} />
                <span className="text-xl font-semibold text-slate-800">{frames[frame]}</span>
              </div>
              <p className="mt-2 text-xs text-slate-500">{ESG_FRAME_DEFINITIONS[frame]}</p>
            </div>
          ))}
        </CardBody>
      </Card>

      <Card className="mb-5">
        <CardHeader title="Environmental Risk Map" subtitle="Issue, lokasi, aktor, dampak, sentimen, dan tingkat risiko" />
        <CardBody>
          <Table columns={riskMapColumns} rows={riskMapRows} rowKey={(r) => r.issue.id} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="ESG Risk Matrix" subtitle="Impact × Media Volume — klik bubble untuk membuka detail isu" />
        <CardBody>
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis type="number" dataKey="volume" name="Media Volume" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} label={{ value: 'Media Volume', position: 'insideBottom', offset: -5, fontSize: 11, fill: '#94a3b8' }} />
              <YAxis type="number" dataKey="impact" name="Potential Impact" domain={[0, 4]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} label={{ value: 'Potential Impact', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }} />
              <ZAxis type="number" dataKey="volume" range={[100, 500]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(value: number, name: string) => [value, name]} labelFormatter={() => ''} content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const p = payload[0].payload as RiskMatrixPoint
                return (
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                    <p className="font-semibold text-slate-800">{p.issue.name}</p>
                    <p className="text-slate-500">Volume: {p.volume} · Impact: {p.impact.toFixed(1)} · {p.quadrant}</p>
                  </div>
                )
              }} />
              <Scatter data={matrix} onClick={(p: unknown) => navigate(`/issues/${(p as RiskMatrixPoint).issue.id}`)} cursor="pointer">
                {matrix.map((p) => (
                  <Cell key={p.issue.id} fill={QUADRANT_COLOR[p.quadrant]} fillOpacity={0.8} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
            {(Object.keys(QUADRANT_COLOR) as RiskMatrixPoint['quadrant'][]).map((q) => (
              <span key={q} className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: QUADRANT_COLOR[q] }} />
                {q}
              </span>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
