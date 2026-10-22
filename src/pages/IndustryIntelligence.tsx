import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Newspaper, Radio, Layers, Filter, ExternalLink, Search, AlertTriangle, ShieldAlert } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { INDUSTRY_ISSUES, INDUSTRY_OUTSIDE, INDUSTRY_STATS, alertFeed, industryFeed, industryMedia, industrySubs } from '@/data/industryFeed'
import { formatNumber } from '@/lib/utils'

const BLUE = '#16547A'
const GREY = '#94a3b8'
const ORANGE = '#E28A2B'
const SLICES = ['#16547A', '#2E7DB0', '#6FA8CF', '#A9C8E0', '#94a3b8', '#E28A2B', '#C5CED8']

/** Kartu alert untuk PT AR. Batas: berapa berita dalam 7 hari terakhir yang memicu status. */
const ALERT_CARDS = [
  { title: 'Menyebut PT AR / Martabe langsung', desc: 'Berita yang memuat Agincourt, PTAR, Martabe atau Batang Toru: operasi, lingkungan, hubungan dengan warga.', rule: 'Tinggi bila ≥1 berita dalam 7 hari terakhir', high: 1, warn: 1 },
  { title: 'Kebijakan nasional untuk produsen emas', desc: 'HPE/harga patokan emas, royalti, PNBP minerba, DHE, bea keluar, Satgas PKH, izin tambang prioritas, Permen ESDM.', rule: 'Waspada bila ≥3 berita dalam 7 hari; Tinggi bila ≥10', high: 10, warn: 3 },
  { title: 'PETI & tekanan sosial di sekitar wilayah', desc: 'Peti, penertiban, korban, dan aksi warga di Tapsel, Madina, dan Sumatera Utara (sekitar wilayah operasi).', rule: 'Waspada bila ≥3 berita dalam 7 hari; Tinggi bila ≥8', high: 8, warn: 3 },
  { title: 'Pelajaran dari perusahaan sejenis', desc: 'Pemulihan Grasberg (Freeport) dan PETI di konsesi Amman: pembanding risiko operasional.', rule: 'Waspada bila ≥1 berita dalam 7 hari', high: 99, warn: 1 },
] as const
const LEVEL_STYLE = {
  Tinggi: 'bg-orange-500 text-white',
  Waspada: 'bg-orange-100 text-orange-800',
  Normal: 'bg-slate-100 text-slate-600',
} as const

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
  const [selected, setSelected] = useState(0)
  const [openAlert, setOpenAlert] = useState<number | null>(null)
  const total = industryFeed.length

  const byIssue = useMemo(() => {
    const counts = INDUSTRY_ISSUES.map(() => 0)
    for (const r of industryFeed) counts[r[2]]++
    return INDUSTRY_ISSUES.map((label, i) => ({ label, idx: i, count: counts[i], outside: INDUSTRY_OUTSIDE.includes(label) }))
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
  const detail = useMemo(() => {
    const rows = industryFeed.filter((r) => r[2] === selected)
    const m = new Map<number, number>()
    for (const r of rows) if (r[5] >= 0) m.set(r[5], (m.get(r[5]) ?? 0) + 1)
    const slices = Array.from(m.entries()).sort((a, b) => b[1] - a[1]).map(([i, count]) => ({ name: industrySubs[i], count }))
    return { total: rows.length, slices, latest: rows.slice(0, 6) }
  }, [selected])

  const alerts = useMemo(() => {
    const last = alertFeed.reduce((mx, r) => (r[0] > mx ? r[0] : mx), '')
    const cut = new Date(last + 'T00:00:00Z')
    cut.setUTCDate(cut.getUTCDate() - 6)
    const from = cut.toISOString().slice(0, 10)
    return ALERT_CARDS.map((c, i) => {
      const items = alertFeed.filter((r) => r[4] === i)
      const n7 = items.filter((r) => r[0] >= from).length
      const level: keyof typeof LEVEL_STYLE = n7 >= c.high ? 'Tinggi' : n7 >= c.warn ? 'Waspada' : 'Normal'
      return { ...c, items, n7, level }
    })
  }, [])
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

      <div className="mb-5">
        <div className="mb-2 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-orange-600" />
          <h2 className="text-sm font-semibold text-slate-800">Alert untuk PT AR</h2>
          <span className="text-xs text-slate-400">Berita yang perlu diperhatikan; status dihitung dari berita 7 hari terakhir</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {alerts.map((a, i) => (
            <Card key={a.title} className="flex flex-col">
              <CardBody className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-snug text-slate-800">{a.title}</p>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${LEVEL_STYLE[a.level]}`}>{a.level}</span>
                </div>
                <p className="text-xs text-slate-500">{a.desc}</p>
                <p className="text-xs text-slate-700">
                  <span className="text-lg font-semibold text-slate-900">{a.n7}</span> berita 7 hari terakhir · {a.items.length} berita total
                </p>
                <ul className="space-y-1.5">
                  {a.items.slice(0, openAlert === i ? 12 : 2).map((r, k) => (
                    <li key={k} className="text-xs leading-snug">
                      {r[3] ? (
                        <a href={r[3]} target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-blue-700 hover:underline">{r[2]}</a>
                      ) : (
                        <span className="text-slate-700">{r[2]}</span>
                      )}
                      <span className="block text-[11px] text-slate-400">{shortDate(r[0])} · {industryMedia[r[1]]}</span>
                    </li>
                  ))}
                </ul>
                {a.items.length > 2 && (
                  <button onClick={() => setOpenAlert(openAlert === i ? null : i)} className="self-start text-xs font-medium text-blue-700 hover:underline">
                    {openAlert === i ? 'Ringkas' : 'Lihat lebih banyak'}
                  </button>
                )}
                <p className="mt-auto flex items-center gap-1 border-t border-slate-100 pt-2 text-[11px] text-slate-400">
                  <AlertTriangle className="h-3 w-3" /> Batas: {a.rule}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader title="Pemberitaan Isu Industri per Kategori" subtitle={`${formatNumber(total)} berita unik, 22 Sep – ${shortDate(lastDay)} 2026. Abu-abu: usulan tema baru. Klik batang untuk rincian`} />
          <CardBody className="flex-1">
            <ResponsiveContainer width="100%" height={430}>
              <BarChart data={byIssue} layout="vertical" margin={{ left: 8, right: 56 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`${formatNumber(v)} berita`, 'Jumlah']} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(d: { idx?: number }) => typeof d.idx === 'number' && setSelected(d.idx)}>
                  {byIssue.map((b) => (
                    <Cell key={b.label} fill={b.outside ? GREY : BLUE} fillOpacity={b.idx === selected ? 1 : 0.55} />
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

      <Card className="mb-5">
        <CardHeader title={`Rincian tema: ${INDUSTRY_ISSUES[selected]}`} subtitle={`${formatNumber(detail.total)} berita. Pilih tema lain dengan mengklik batang di grafik kategori`} />
        <CardBody>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div>
              {detail.slices.length >= 2 ? (
                <div className="flex flex-col items-center gap-4 md:flex-row">
                  <div className="relative h-52 w-52 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={detail.slices} dataKey="count" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={1} stroke="none">
                          {detail.slices.map((_, i) => (
                            <Cell key={i} fill={SLICES[i % SLICES.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number, n: string) => [`${formatNumber(v)} berita`, n]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-xl font-semibold text-slate-800">{formatNumber(detail.total)}</span>
                      <span className="text-[11px] text-slate-400">berita</span>
                    </div>
                  </div>
                  <ul className="w-full space-y-2 text-xs">
                    {detail.slices.map((sl, i) => (
                      <li key={sl.name} className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2 text-slate-700">
                          <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: SLICES[i % SLICES.length] }} />
                          {sl.name}
                        </span>
                        <span className="whitespace-nowrap text-slate-500">{formatNumber(sl.count)} · {Math.round((sl.count / detail.total) * 100)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Tema ini terlalu kecil untuk dipecah lagi. Berita terbarunya ada di sebelah kanan.</p>
              )}
            </div>
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Berita terbaru pada tema ini</p>
              <ul className="divide-y divide-slate-100">
                {detail.latest.map((r, k) => (
                  <li key={k} className="py-1.5 text-xs leading-snug">
                    {r[4] ? (
                      <a href={r[4]} target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-blue-700 hover:underline">{r[3]}</a>
                    ) : (
                      <span className="text-slate-700">{r[3]}</span>
                    )}
                    <span className="block text-[11px] text-slate-400">{shortDate(r[0])} · {industryMedia[r[1]]}{r[5] >= 0 ? ` · ${industrySubs[r[5]]}` : ''}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

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
        Catatan: sentimen dari file sumber tidak dipakai. Tema abu-abu dan sub-tema adalah nama usulan, dibuat dengan aturan kata kunci. Kartu alert memakai seluruh berita tambang (tidak hanya yang berjudul emas). Berita disaring ke tambang emas (judul memuat emas, PETI, atau perusahaan emas) lalu dikelompokkan dengan aturan kata kunci; hasilnya perkiraan, masih bisa ada berita yang salah kategori.
      </p>
    </div>
  )
}
