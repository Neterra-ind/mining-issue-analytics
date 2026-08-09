import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts'
import { AlertTriangle } from 'lucide-react'
import { useData } from '@/lib/store'
import { PageHeader } from '@/components/PageHeader'
import { FilterBar } from '@/components/FilterBar'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { competitorBenchmark, emptyFilters, filterNews } from '@/lib/aggregations'
import { formatRupiah } from '@/lib/utils'
import type { GlobalFilters } from '@/types'

export default function AnalysisCompetitor() {
  const { data } = useData()
  const [filters, setFilters] = useState<GlobalFilters>(emptyFilters())

  const news = useMemo(() => filterNews(data.news, filters), [data.news, filters])
  const rows = useMemo(() => competitorBenchmark(news, data.companies, data.issues), [news, data.companies, data.issues])

  const columns: Column<(typeof rows)[number]>[] = [
    { key: 'name', header: 'Company', render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
    { key: 'volume', header: 'News Volume', sortValue: (r) => r.newsVolume, render: (r) => r.newsVolume },
    { key: 'positive', header: 'Positive %', sortValue: (r) => r.positivePct, render: (r) => `${r.positivePct}%` },
    { key: 'negative', header: 'Negative %', sortValue: (r) => r.negativePct, render: (r) => `${r.negativePct}%` },
    { key: 'esg', header: 'ESG Coverage', sortValue: (r) => r.esgCoverage, render: (r) => r.esgCoverage },
    { key: 'env', header: 'Environment Coverage', sortValue: (r) => r.environmentCoverage, render: (r) => r.environmentCoverage },
    { key: 'pr', header: 'PR Value', sortValue: (r) => r.prValue, render: (r) => formatRupiah(r.prValue) },
    { key: 'top', header: 'Top Issue', render: (r) => <span className="text-xs">{r.topIssue}</span> },
  ]

  return (
    <div>
      <PageHeader configKey="competitor.title" title="Competitor Intelligence" subtitleKey="competitor.subtitle" subtitle="Benchmark eksposur media antar perusahaan tambang." />

      <div className="mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
        DEMO DATA — perbandingan ini menggunakan data contoh dan bukan data aktual perusahaan yang disebutkan.
      </div>

      <div className="mb-5">
        <FilterBar filters={filters} onChange={setFilters} showCompany={false} />
      </div>

      <Card className="mb-5">
        <CardHeader title="News Volume per Perusahaan" />
        <CardBody>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rows}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="shortName" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="newsVolume" name="News Volume" fill="#1a4d8f" radius={[4, 4, 0, 0]} />
              <Bar dataKey="esgCoverage" name="ESG Coverage" fill="#0e7c86" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Tabel Benchmark" />
        <CardBody>
          <Table columns={columns} rows={rows} rowKey={(r) => r.companyId} defaultSortKey="volume" />
        </CardBody>
      </Card>
    </div>
  )
}
