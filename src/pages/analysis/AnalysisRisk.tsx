import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CartesianGrid, Cell, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from 'recharts'
import { useData } from '@/lib/store'
import { PageHeader } from '@/components/PageHeader'
import { FilterBar } from '@/components/FilterBar'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { PillarBadge, RiskBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { emptyFilters, filterNews, riskMatrix, type RiskMatrixPoint, type RiskQuadrant } from '@/lib/aggregations'
import type { GlobalFilters } from '@/types'

const QUADRANT_COLOR: Record<RiskQuadrant, string> = {
  Monitor: '#4b9c5f',
  Watch: '#d3a625',
  Attention: '#e07a2b',
  Critical: '#c0392b',
}

const QUADRANT_DESC: Record<RiskQuadrant, string> = {
  Monitor: 'Volume rendah, dampak rendah — cukup dipantau berkala.',
  Watch: 'Volume rendah, dampak tinggi — berpotensi membesar, perlu diawasi.',
  Attention: 'Volume tinggi, dampak rendah — ramai diberitakan namun dampak terbatas.',
  Critical: 'Volume tinggi, dampak tinggi — perlu perhatian dan mitigasi segera.',
}

export default function AnalysisRisk() {
  const { data } = useData()
  const navigate = useNavigate()
  const [filters, setFilters] = useState<GlobalFilters>(emptyFilters())
  const [activeQuadrant, setActiveQuadrant] = useState<RiskQuadrant | 'All'>('All')

  const news = useMemo(() => filterNews(data.news, filters), [data.news, filters])
  const matrix = useMemo(() => riskMatrix(news, data.issues), [news, data.issues])
  const filtered = activeQuadrant === 'All' ? matrix : matrix.filter((m) => m.quadrant === activeQuadrant)

  return (
    <div>
      <PageHeader configKey="risk.title" title="Risk Intelligence" subtitleKey="risk.subtitle" subtitle="Matrix Media Volume × Potential Impact untuk memprioritaskan penanganan isu." />

      <div className="mb-5">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      <Card className="mb-5">
        <CardHeader title="Risk Matrix" subtitle="Klik bubble untuk membuka detail isu" />
        <CardBody>
          <ResponsiveContainer width="100%" height={360}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis type="number" dataKey="volume" name="Media Volume" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} label={{ value: 'Media Volume', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#94a3b8' }} />
              <YAxis type="number" dataKey="impact" name="Potential Impact" domain={[0, 4]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} label={{ value: 'Potential Impact', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#94a3b8' }} />
              <ZAxis type="number" dataKey="volume" range={[120, 600]} />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const p = payload[0].payload as RiskMatrixPoint
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
                      <p className="font-semibold text-slate-800">{p.issue.name}</p>
                      <p className="text-slate-500">Volume: {p.volume} · Impact: {p.impact.toFixed(1)} · {p.quadrant}</p>
                    </div>
                  )
                }}
              />
              <Scatter data={matrix} onClick={(p: unknown) => navigate(`/issues/${(p as RiskMatrixPoint).issue.id}`)} cursor="pointer">
                {matrix.map((p) => (
                  <Cell key={p.issue.id} fill={QUADRANT_COLOR[p.quadrant]} fillOpacity={activeQuadrant === 'All' || activeQuadrant === p.quadrant ? 0.85 : 0.15} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {(['All', 'Monitor', 'Watch', 'Attention', 'Critical'] as const).map((q) => (
          <button
            key={q}
            onClick={() => setActiveQuadrant(q)}
            className={cn(
              'rounded-xl border p-3 text-left transition-colors',
              activeQuadrant === q ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white hover:bg-slate-50',
            )}
          >
            <div className="flex items-center gap-2">
              {q !== 'All' && <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: QUADRANT_COLOR[q] }} />}
              <span className="text-sm font-semibold text-slate-800">{q}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">{q === 'All' ? 'Semua isu' : QUADRANT_DESC[q]}</p>
          </button>
        ))}
      </div>

      <Card>
        <CardHeader title={`Daftar Isu — ${activeQuadrant}`} subtitle={`${filtered.length} isu`} />
        <CardBody className="space-y-2">
          {filtered
            .sort((a, b) => b.volume - a.volume)
            .map((row) => (
              <button
                key={row.issue.id}
                onClick={() => navigate(`/issues/${row.issue.id}`)}
                className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 text-left hover:border-blue-200 hover:bg-blue-50/40"
              >
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2">
                    <PillarBadge pillar={row.issue.pillar} />
                    <span className="text-xs text-slate-400">{row.issue.category}</span>
                  </div>
                  <p className="truncate text-sm font-medium text-slate-800">{row.issue.name}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                  <span>{row.volume} berita</span>
                  <RiskBadge risk={row.issue.riskLevel} />
                </div>
              </button>
            ))}
          {filtered.length === 0 && <p className="text-sm text-slate-400">Tidak ada isu pada kuadran ini.</p>}
        </CardBody>
      </Card>
    </div>
  )
}
