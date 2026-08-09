import { useMemo, useState } from 'react'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useData } from '@/lib/store'
import { PageHeader } from '@/components/PageHeader'
import { FilterBar } from '@/components/FilterBar'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { emptyFilters, filterNews, industryPlayers, sentimentBreakdown, trendByDay } from '@/lib/aggregations'
import type { GlobalFilters } from '@/types'

const SENTIMENT_COLORS = { Positive: '#1a8f5a', Neutral: '#94a3b8', Negative: '#c0392b' }

export default function AnalysisSentiment() {
  const { data } = useData()
  const [filters, setFilters] = useState<GlobalFilters>(emptyFilters())

  const news = useMemo(() => filterNews(data.news, filters), [data.news, filters])
  const sb = sentimentBreakdown(news)
  const trend = trendByDay(news)
  const pieData = [
    { name: 'Positive', value: sb.positive },
    { name: 'Neutral', value: sb.neutral },
    { name: 'Negative', value: sb.negative },
  ]

  const byPillar = (['Industry', 'ESG', 'Corporate'] as const).map((p) => {
    const items = news.filter((n) => n.pillar === p)
    const s = sentimentBreakdown(items)
    return { pillar: p, Positive: s.positive, Neutral: s.neutral, Negative: s.negative }
  })

  const companyRows = industryPlayers(news, data.companies)

  return (
    <div>
      <PageHeader configKey="sentiment.title" title="Sentiment Analysis" subtitleKey="sentiment.subtitle" subtitle="Bagaimana pemberitaan tersebut — analisis sentimen lintas pilar dan perusahaan." />

      <div className="mb-5">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Distribusi Sentimen" subtitle={`${news.length} total berita`} />
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                  {pieData.map((d) => (
                    <Cell key={d.name} fill={SENTIMENT_COLORS[d.name as keyof typeof SENTIMENT_COLORS]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Tren Sentimen Harian" subtitle="Positive / Neutral / Negative berdasarkan waktu" />
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Area type="monotone" dataKey="positive" stroke="#1a8f5a" fill="#1a8f5a" fillOpacity={0.15} />
                <Area type="monotone" dataKey="neutral" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} />
                <Area type="monotone" dataKey="negative" stroke="#c0392b" fill="#c0392b" fillOpacity={0.15} />
              </AreaChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Sentimen per Pilar" subtitle="Perbandingan Industry, ESG, dan Corporate" />
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byPillar}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="pillar" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="Positive" stackId="a" fill="#1a8f5a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="Neutral" stackId="a" fill="#94a3b8" />
                <Bar dataKey="Negative" stackId="a" fill="#c0392b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Sentimen per Perusahaan" subtitle="Perbandingan proporsi sentimen antar perusahaan" />
          <CardBody>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={companyRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="shortName" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="positive" name="Positive" stackId="a" fill="#1a8f5a" />
                <Bar dataKey="neutral" name="Neutral" stackId="a" fill="#94a3b8" />
                <Bar dataKey="negative" name="Negative" stackId="a" fill="#c0392b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
