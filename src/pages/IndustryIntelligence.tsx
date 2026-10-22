import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Newspaper, Radio, Layers, AlertOctagon, ExternalLink, Search, AlertTriangle, ShieldAlert } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { KpiCard } from '@/components/ui/KpiCard'
import { formatNumber } from '@/lib/utils'

type Feed = typeof import('@/data/industryFeed')

const BLUE = '#16547A'
const SLICES = ['#16547A', '#2E7DB0', '#6FA8CF', '#A9C8E0', '#94a3b8', '#E28A2B', '#F4B183', '#C5CED8', '#64748b', '#B45309', '#CBD5E1', '#475569']

/** Kartu alert untuk PT AR. Batas: jumlah berita dalam 7 hari terakhir yang memicu status. */
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

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
function shortDate(iso: string) {
  return `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]}`
}
const PAGE = 25

export default function IndustryIntelligence() {
  const [feed, setFeed] = useState<Feed | null>(null)
  useEffect(() => {
    import('@/data/industryFeed').then(setFeed)
  }, [])
  if (!feed) {
    return (
      <div>
        <PageHeader configKey="industry.title" title="Mining Industry" subtitleKey="industry.subtitle" subtitle="Memuat data berita…" />
      </div>
    )
  }
  return <IndustryView d={feed} />
}

function IndustryView({ d }: { d: Feed }) {
  const { COVERAGES, COVERAGE_HINT, INDUSTRY_THEMES, INDUSTRY_STATS, industryFeed, industryMedia, alertFeed } = d
  const total = industryFeed.length

  const [selected, setSelected] = useState(0)
  const [theme, setTheme] = useState<number | null>(null)
  useEffect(() => setTheme(null), [selected])
  const [openAlert, setOpenAlert] = useState<number | null>(null)
  const [covFilter, setCovFilter] = useState(-1)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)

  const byCoverage = useMemo(() => {
    const rows = COVERAGES.map((label, i) => ({ label, idx: i, total: 0 }))
    for (const r of industryFeed) rows[r[2]].total++
    return rows
  }, [COVERAGES, industryFeed])

  const lastDay = useMemo(() => industryFeed.reduce((m, r) => (r[0] > m ? r[0] : m), ''), [industryFeed])
  const recent = useMemo(() => {
    const day = (n: number) => {
      const c = new Date(lastDay + 'T00:00:00Z')
      c.setUTCDate(c.getUTCDate() - n)
      return c.toISOString().slice(0, 10)
    }
    const from7 = day(6)
    const from14 = day(13)
    let cur = 0
    let prev = 0
    for (const r of industryFeed) {
      if (r[0] >= from7) cur++
      else if (r[0] >= from14) prev++
    }
    return { cur, prev }
  }, [industryFeed, lastDay])

  const media = useMemo(() => {
    const m = new Map<number, number>()
    for (const r of industryFeed) m.set(r[1], (m.get(r[1]) ?? 0) + 1)
    const sorted = Array.from(m.entries()).sort((a, b) => b[1] - a[1])
    return { total: sorted.length, top: sorted.slice(0, 10).map(([i, count]) => ({ name: industryMedia[i], count })) }
  }, [industryFeed, industryMedia])
  const topShare = media.top.reduce((s, r) => s + r.count, 0) / total

  const detail = useMemo(() => {
    const rows = industryFeed.filter((r) => r[2] === selected)
    const t = new Map<number, number>()
    for (const r of rows) t.set(r[5], (t.get(r[5]) ?? 0) + 1)
    const slices = Array.from(t.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([i, count]) => ({ idx: i, name: INDUSTRY_THEMES[i], count }))
    return { total: rows.length, slices, rows }
  }, [industryFeed, selected, INDUSTRY_THEMES])

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
  }, [alertFeed])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return industryFeed.filter(
      (r) => (covFilter < 0 || r[2] === covFilter) && (!q || r[3].toLowerCase().includes(q) || industryMedia[r[1]].toLowerCase().includes(q)),
    )
  }, [industryFeed, industryMedia, covFilter, query])
  const pages = Math.max(1, Math.ceil(list.length / PAGE))
  const shown = list.slice(page * PAGE, page * PAGE + PAGE)
  const biggest = [...byCoverage].sort((a, b) => b.total - a.total)[0]

  return (
    <div>
      <PageHeader configKey="industry.title" title="Mining Industry" subtitleKey="industry.subtitle" subtitle="Pemberitaan industri pertambangan yang perlu diperhatikan, dengan fokus pada tambang emas." />

      <div className="mb-5 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Berita mining industry" value={formatNumber(total)} icon={Newspaper} tone="blue" hint={`dari ${formatNumber(INDUSTRY_STATS.miningAll)} berita tambang, tanpa batu bara`} />
        <KpiCard label="Berita 7 hari terakhir" value={formatNumber(recent.cur)} icon={AlertOctagon} tone="amber" hint={`${recent.cur >= recent.prev ? '▲' : '▼'} dibanding ${formatNumber(recent.prev)} pada 7 hari sebelumnya`} />
        <KpiCard label="Cakupan terbesar" value={biggest.label.split(' & ')[0]} icon={Layers} tone="slate" hint={`${formatNumber(biggest.total)} berita (${Math.round((biggest.total / total) * 100)}%)`} />
        <KpiCard label="Media" value={formatNumber(media.total)} icon={Radio} tone="slate" hint={`10 teratas hanya ${Math.round(topShare * 100)}% berita`} />
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
          <CardHeader title="News Coverage" subtitle={`${formatNumber(total)} berita, 22 Sep – ${shortDate(lastDay)} 2026, jumlah berita tiap cakupan. Klik batang untuk rincian`} />
          <CardBody className="flex-1">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart data={byCoverage} layout="vertical" margin={{ left: 8, right: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="label" width={170} tick={{ fontSize: 11, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => [`${formatNumber(v)} berita`, 'Jumlah']} />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} cursor="pointer" onClick={(row: { idx?: number }) => typeof row.idx === 'number' && setSelected(row.idx)}>
                  {byCoverage.map((b) => (
                    <Cell key={b.label} fill={BLUE} fillOpacity={b.idx === selected ? 1 : 0.55} />
                  ))}
                  <LabelList dataKey="total" position="right" fontSize={11} fill="#475569" formatter={(v: number) => formatNumber(v)} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
<Card className="flex flex-col">
        <CardHeader title={`Rincian cakupan: ${COVERAGES[selected]}`} subtitle={`${formatNumber(detail.total)} berita. ${COVERAGE_HINT[selected]} Klik tema untuk melihat beritanya.`} />
        <CardBody>
          <div className="grid grid-cols-1 gap-5">
            <div className="flex flex-col items-center gap-4 md:flex-row">
              <div className="relative h-44 w-44 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={detail.slices} dataKey="count" nameKey="name" innerRadius={46} outerRadius={80} paddingAngle={1} stroke="none" onClick={(_, i) => setTheme((t) => (t === detail.slices[i].idx ? null : detail.slices[i].idx))} style={{ cursor: 'pointer' }}>
                      {detail.slices.map((_, i) => (
                        <Cell key={i} fill={SLICES[i % SLICES.length]} fillOpacity={theme === null || theme === detail.slices[i].idx ? 1 : 0.3} />
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
              <ul className="w-full space-y-1.5 text-xs">
                {detail.slices.map((sl, i) => (
                  <li
                    key={sl.name}
                    onClick={() => setTheme((t) => (t === sl.idx ? null : sl.idx))}
                    className={`-mx-1.5 flex cursor-pointer items-center justify-between gap-3 rounded px-1.5 py-0.5 transition-colors hover:bg-slate-50 ${theme === sl.idx ? 'bg-slate-100 font-semibold' : ''} ${theme !== null && theme !== sl.idx ? 'opacity-50' : ''}`}
                  >
                    <span className="flex items-center gap-2 text-slate-700">
                      <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: SLICES[i % SLICES.length] }} />
                      {sl.name}
                    </span>
                    <span className="whitespace-nowrap text-slate-500">
                      {formatNumber(sl.count)} · {Math.round((sl.count / Math.max(1, detail.total)) * 100)}%
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {theme === null ? 'Berita terbaru pada cakupan ini' : `Berita terbaru: ${INDUSTRY_THEMES[theme]}`}
                </p>
                {theme !== null && (
                  <button type="button" onClick={() => setTheme(null)} className="text-[11px] text-blue-700 hover:underline">
                    Tampilkan semua
                  </button>
                )}
              </div>
              <ul className={`divide-y divide-slate-100 ${theme !== null ? 'max-h-72 overflow-y-auto' : ''}`}>
                {(theme === null ? detail.rows.slice(0, 4) : detail.rows.filter((r) => r[5] === theme).slice(0, 15)).map((r, k) => (
                  <li key={k} className="py-1.5 text-xs leading-snug">
                    {r[4] ? (
                      <a href={r[4]} target="_blank" rel="noopener noreferrer" className="text-slate-700 hover:text-blue-700 hover:underline">{r[3]}</a>
                    ) : (
                      <span className="text-slate-700">{r[3]}</span>
                    )}
                    <span className="block text-[11px] text-slate-400">
                      {shortDate(r[0])} · {industryMedia[r[1]]}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
</div>

      <Card>
        <CardHeader title="Daftar Berita" subtitle={`${formatNumber(list.length)} berita, terbaru di atas. Klik judul untuk membuka sumber`} />
        <CardBody>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(0)
                }}
                placeholder="Cari judul atau media"
                className="w-64 rounded-lg border border-slate-200 py-1.5 pl-8 pr-3 text-sm outline-none focus:border-blue-400"
              />
            </div>
            <select
              value={covFilter}
              onChange={(e) => {
                setCovFilter(Number(e.target.value))
                setPage(0)
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700"
            >
              <option value={-1}>Semua cakupan</option>
              {COVERAGES.map((n, i) => (
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
                  <th className="w-36 py-2 pr-3">Media</th>
                  <th className="w-44 py-2 pr-3">Cakupan</th>
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
                    <td className="py-2 pr-3 text-xs text-slate-600">{COVERAGES[r[2]]}</td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm text-slate-400">Tidak ada berita yang cocok</td>
                  </tr>
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
        Catatan: cakupan dan tema ditentukan dengan aturan kata kunci (perkiraan, bisa ada berita yang salah kelompok); sentimen tidak dipakai. Batu bara, galian C, dan migas tidak dihitung. Kartu alert memakai seluruh berita tambang.
      </p>
    </div>
  )
}
