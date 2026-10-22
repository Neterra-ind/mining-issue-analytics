import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Newspaper, Radio, Layers, Filter, ExternalLink, Search } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { INDUSTRY_ISSUES, INDUSTRY_OUTSIDE, INDUSTRY_STATS, industryFeed, industryMedia } from '@/data/industryFeed'
import { formatNumber } from '@/lib/utils'

const BLUE = '#16547A'
const GREY = '#94a3b8'

function weekStart(iso: string): string {
  const d = new Date(iso + 'T00:00:00Z')
  const day = (d.getUTCDay() + 6) % 7
  d.setUTCDate(d.getUTCDate() - day)
  return d.toISOString().slice(0, 10)
}
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
function shortDate(iso: string) {
  return `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`
}

const PAGE = 25

export default function IndustryIntelligence() {
  const [issueFilter, setIssueFilter] = useState<number>(-1)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const total = industryFeed.length

  const byIssue = useMemo(() => {
    const counts = INDUSTRY_ISSUES.map(() => 0)
    for (const r of industryFeed) counts[r[2]]++
    return INDUSTRY_ISSUES.map((label, i) => ({ label, count: counts[i], outside: INDUSTRY_OUTSIDE.includes(label) }))
      .sort((a, b) => b.count - a.count)
  }, [])

  const weekly = useMemo(() => {
    const weeks = Array.from(new Set(industryFeed.map((r) => weekStart(r[0])))).sort()
    const grid: Record<string, Record<string, number>> = {}
    for (const r of industryFeed) {
      const issue = INDUSTRY_ISSUES[r[2]]
      const w = weekStart(r[0])
      grid[issue] ??= {}
      grid[issue][w] = (grid[issue][w] ?? 0) + 1
    }
    return { weeks, grid }
  }, [])

  const daily = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of industryFeed) m.set(r[0], (m.get(r[0]) ?? 0) + 1)
    return Array.from(m.entries())
      .sort((a, b) => (a[0] < b[0] ? -1 : 1))
      .map(([date, count]) => ({ date, label: shortDate(date), count }))
  }, [])

  const media = useMemo(() => {
    const m = new Map<number, number>()
    for (const r of industryFeed) m.set(r[1], (m.get(r[1]) ?? 0) + 1)
    const sorted = Array.from(m.entries()).sort((a, b) => b[1] - a[1])
    return { total: sorted.length, top: sorted.slice(0, 10).map(([i, count]) => ({ name: industryMedia[i], count })) }
  }, [])
  const topShare = media.top.reduce((s, r) => s + r.count, 0) / total
  const biggest = byIssue.filter((b) => !b.outside)[0]
  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return industryFeed.filter((r) => (issueFilter < 0 || r[2] === issueFilter) && (!q || r[3].toLowerCase().includes(q) || industryMedia[r[1]].toLowerCase().includes(q)))
  }, [issueFilter, query])
  const pages = Math.max(1, Math.ceil(list.length / PAGE))
  const shown = list.slice(page * PAGE, page * PAGE + PAGE)
  const lastDay = daily[daily.length - 1]?.date ?? ''

  return (
    <div>
      <PageHeader configKey="industry.title" title="Mining Industry" subtitleKey="industry.subtitle" subtitle="Isu dan pemberitaan yang perlu diperhatikan industri pertambangan, khususnya emas." />

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
        <KpiCard label="Berita isu tambang emas" value={formatNumber(total)} icon={Newspaper} tone="blue" hint={`dari ${formatNumber(INDUSTRY_STATS.miningAll)} berita tambang semua komoditas`} />
        <KpiCard label="Isu terbesar" value={biggest.label} icon={Layers} tone="slate" hint={`${formatNumber(biggest.count)} berita (${Math.round((biggest.count / total) * 100)}%)`} />
        <KpiCard label="Media" value={formatNumber(media.total)} icon={Radio} tone="slate" hint={`10 teratas hanya ${Math.round(topShare * 100)}% berita`} />
        <KpiCard label="Porsi emas" value={`${Math.round((total / INDUSTRY_STATS.miningAll) * 100)}%`} icon={Filter} tone="amber" hint="sisanya batu bara, nikel, timah, dan lain-lain" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader title="Pemberitaan Isu Industri per Kategori" subtitle={`${formatNumber(total)} berita unik, 22 Sep – ${shortDate(lastDay)} 2026. Abu-abu: belum ada di taksonomi Industry`} />
          <CardBody className="flex-1">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={byIssue} layout="vertical" margin={{ left: 8, right: 56 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`${formatNumber(v)} berita`, 'Jumlah']} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {byIssue.map((b) => (
                    <Cell key={b.label} fill={b.outside ? GREY : BLUE} />
                  ))}
                  <LabelList dataKey="count" position="right" fontSize={11} fill="#475569" formatter={(v: number) => formatNumber(v)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="flex flex-col">
          <CardHeader title="Isu per minggu" subtitle="Jumlah berita per isu; warna lebih pekat = lebih ramai dibanding minggu lain pada isu yang sama" />
          <CardBody className="flex-1">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="text-[11px] font-medium text-slate-500">
                  <th className="w-[34%] py-1.5 pr-2 text-left">Isu</th>
                  {weekly.weeks.map((w, i) => (
                    <th key={w} className="px-1 py-1.5 text-center">
                      {shortDate(w)}
                      {i === weekly.weeks.length - 1 && <span className="block text-[9px] font-normal text-slate-400">s/d {shortDate(lastDay)}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byIssue.map((b) => {
                  const row = weekly.grid[b.label] ?? {}
                  const max = Math.max(1, ...weekly.weeks.map((w) => row[w] ?? 0))
                  return (
                    <tr key={b.label}>
                      <td className="py-1 pr-2 text-xs text-slate-700">{b.label}</td>
                      {weekly.weeks.map((w) => {
                        const v = row[w] ?? 0
                        const a = v / max
                        return (
                          <td key={w} className="p-0.5">
                            <div
                              className="rounded py-1.5 text-center text-xs font-medium"
                              style={{ backgroundColor: b.outside ? `rgba(148,163,184,${0.12 + a * 0.55})` : `rgba(22,84,122,${0.08 + a * 0.8})`, color: a > 0.55 ? '#fff' : '#334155' }}
                            >
                              {v}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader title="Volume harian" subtitle="Jumlah berita isu tambang emas per hari (satu judul dihitung sekali)" />
          <CardBody className="flex-1">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={daily} margin={{ left: -8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={4} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`${v} berita`, 'Jumlah']} />
                <Line type="monotone" dataKey="count" stroke={BLUE} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>

        <Card className="flex flex-col">
          <CardHeader title="Media Share" subtitle={`10 media teratas dari ${formatNumber(media.total)} media; pemberitaan tersebar luas`} />
          <CardBody className="flex-1">
            <ul className="space-y-2">
              {media.top.map((m) => (
                <li key={m.name} className="text-xs">
                  <div className="mb-0.5 flex justify-between text-slate-700">
                    <span className="font-medium">{m.name}</span>
                    <span className="text-slate-500">
                      {m.count} · {((m.count / total) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded bg-slate-100">
                    <div className="h-1.5 rounded" style={{ width: `${(m.count / media.top[0].count) * 100}%`, backgroundColor: BLUE }} />
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>


      <Card className="mt-4">
        <CardHeader title="Daftar Berita" subtitle={`${formatNumber(list.length)} berita, terbaru di atas. Klik judul untuk membuka sumber`} />
        <CardBody>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0) }}
                placeholder="Cari judul atau media"
                className="w-64 rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <select
              value={issueFilter}
              onChange={(e) => { setIssueFilter(Number(e.target.value)); setPage(0) }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700"
            >
              <option value={-1}>Semua isu</option>
              {INDUSTRY_ISSUES.map((n, i) => (
                <option key={n} value={i}>{n}</option>
              ))}
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-medium uppercase tracking-wide text-slate-500">
                  <th className="w-24 py-2 pr-3">Tanggal</th>
                  <th className="py-2 pr-3">Judul</th>
                  <th className="w-40 py-2 pr-3">Media</th>
                  <th className="w-40 py-2">Isu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map((r, i) => (
                  <tr key={i} className="align-top">
                    <td className="whitespace-nowrap py-2 pr-3 text-xs text-slate-500">{shortDate(r[0])} {r[0].slice(0, 4)}</td>
                    <td className="py-2 pr-3 text-slate-800">
                      {r[4] ? (
                        <a href={r[4]} target="_blank" rel="noopener noreferrer" className="hover:text-blue-700 hover:underline">
                          {r[3]} <ExternalLink className="inline h-3 w-3 text-slate-400" />
                        </a>
                      ) : (
                        r[3]
                      )}
                    </td>
                    <td className="py-2 pr-3 text-xs text-slate-600">{industryMedia[r[1]]}</td>
                    <td className="py-2 text-xs">
                      <span className={INDUSTRY_OUTSIDE.includes(INDUSTRY_ISSUES[r[2]]) ? 'rounded-full bg-slate-100 px-2 py-0.5 text-slate-600' : 'rounded-full bg-blue-50 px-2 py-0.5 text-blue-800'}>{INDUSTRY_ISSUES[r[2]]}</span>
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-sm text-slate-400">Tidak ada berita yang cocok</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Halaman {page + 1} dari {pages}</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(page - 1)} className="rounded border border-slate-200 px-3 py-1 disabled:opacity-40">Sebelumnya</button>
              <button disabled={page >= pages - 1} onClick={() => setPage(page + 1)} className="rounded border border-slate-200 px-3 py-1 disabled:opacity-40">Berikutnya</button>
            </div>
          </div>
        </CardBody>
      </Card>

      <p className="mt-4 text-xs text-slate-400">
        Catatan: sentimen dari file sumber tidak dipakai. Berita disaring ke tambang emas (judul memuat emas, PETI, atau perusahaan emas) lalu dikelompokkan dengan aturan kata kunci; hasilnya perkiraan, masih bisa ada berita yang salah kategori.
      </p>
    </div>
  )
}
