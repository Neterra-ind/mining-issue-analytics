import { useMemo, type ReactNode } from 'react'
import { CartesianGrid, Legend as ChartLegend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import type { Issue, NewsItem, Sentiment } from '@/types'

/**
 * Ringkasan reputasi berbasis berita: nada per isu, linimasa isu, volume per minggu, dan aktor.
 * Semua angka dihitung dari `news` yang diberikan (semua pilar, satu perusahaan) —
 * tidak ada data baru dan tidak ada field tambahan pada NewsItem.
 */

const COLOR: Record<Sentiment, string> = { Positive: '#1F6F9F', Neutral: '#9AA3AD', Negative: '#E58A2B' }
const LABEL: Record<Sentiment, string> = { Positive: 'Positif', Neutral: 'Netral', Negative: 'Negatif' }
const SENTIMENTS: Sentiment[] = ['Negative', 'Neutral', 'Positive']
const DAY = 86_400_000

function ts(date: string): number {
  return new Date(date).getTime()
}

function weekStart(date: string): number {
  const t = ts(date)
  const d = new Date(t)
  const offset = (d.getUTCDay() + 6) % 7
  return t - offset * DAY
}

function fmtDay(t: number): string {
  return new Date(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

function count(items: NewsItem[], s: Sentiment): number {
  return items.filter((n) => n.sentiment === s).length
}

function Legend() {
  return (
    <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
      {SENTIMENTS.map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLOR[s] }} />
          {LABEL[s]}
        </span>
      ))}
    </div>
  )
}

export function ReputationOverview({
  news,
  issues,
  companyName,
  onOpenIssue,
  topicChart,
  influencerChart,
}: {
  news: NewsItem[]
  issues: Issue[]
  companyName: string
  onOpenIssue: (issueId: string) => void
  /** Kartu grafik yang ditaruh di sebelah Rentang isu (mis. radar Reputation Topics). */
  topicChart?: ReactNode
  /** Kartu grafik yang ditaruh di sebelah "Siapa yang terlihat di media". */
  influencerChart?: ReactNode
}) {
  const total = news.length
  const pos = count(news, 'Positive')
  const neg = count(news, 'Negative')
  const tenor = total ? (pos - neg) / total : 0
  const nonProgram = news.filter((n) => !n.program)
  const tenorNonProgram = nonProgram.length ? (count(nonProgram, 'Positive') - count(nonProgram, 'Negative')) / nonProgram.length : 0

  const lanes = useMemo(() => {
    const byIssue = new Map<string, NewsItem[]>()
    for (const n of news) byIssue.set(n.issueId, [...(byIssue.get(n.issueId) ?? []), n])
    return [...byIssue.entries()]
      .map(([issueId, items]) => {
        const dates = items.map((n) => ts(n.date))
        return { issueId, name: issues.find((i) => i.id === issueId)?.name ?? issueId, items, start: Math.min(...dates), end: Math.max(...dates) }
      })
      .sort((a, b) => b.items.length - a.items.length)
  }, [news, issues])

  // Seri mingguan (mulai Senin); minggu tanpa berita diisi nol agar garis tidak melompat.
  const weekSeries = useMemo(() => {
    if (!news.length) return []
    const m = new Map<number, NewsItem[]>()
    for (const n of news) {
      const k = weekStart(n.date)
      m.set(k, [...(m.get(k) ?? []), n])
    }
    const keys = [...m.keys()]
    const first = Math.min(...keys)
    const last = Math.max(...keys)
    const out: { label: string; Positive: number; Neutral: number; Negative: number }[] = []
    for (let k = first; k <= last; k += 7 * DAY) {
      const items = m.get(k) ?? []
      out.push({ label: fmtDay(k), Positive: count(items, 'Positive'), Neutral: count(items, 'Neutral'), Negative: count(items, 'Negative') })
    }
    return out
  }, [news])

  const actors = useMemo(() => {
    const m = new Map<string, number>()
    for (const n of news) for (const s of new Set(n.stakeholders)) m.set(s, (m.get(s) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [news])

  const issueRows = lanes.slice(0, 8)
  // Donut isu: 5 isu terbanyak + sisanya digabung sebagai "Lainnya".
  const DONUT_COLORS = ['#1F6F9F', '#E58A2B', '#4C9BC9', '#F2A65A', '#16547A']
  const donut = (() => {
    const top = lanes.slice(0, 5).map((l, i) => ({ key: l.issueId, issueId: l.issueId, name: l.name, n: l.items.length, start: l.start, end: l.end, color: DONUT_COLORS[i] }))
    const rest = lanes.slice(5)
    if (rest.length) {
      const items = rest.flatMap((l) => l.items)
      top.push({ key: 'lainnya', issueId: '', name: `Lainnya (${rest.length} isu)`, n: items.length, start: Math.min(...rest.map((l) => l.start)), end: Math.max(...rest.map((l) => l.end)), color: '#9AA3AD' })
    }
    return top
  })()

  if (!total) {
    return (
      <Card className="mb-5">
        <CardBody>
          <p className="py-8 text-center text-sm text-slate-400">Belum ada berita {companyName} untuk filter ini.</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="mb-5 space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500">Total berita</div>
            <div className="mt-1 text-3xl font-semibold text-slate-900">{total}</div>
            <div className="mt-1 text-xs text-slate-500">{pos} positif · {count(news, 'Neutral')} netral · {neg} negatif</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500">Tenor keseluruhan</div>
            <div className="mt-1 text-3xl font-semibold" style={{ color: tenor >= 0 ? COLOR.Positive : COLOR.Negative }}>
              {tenor > 0 ? '+' : ''}{tenor.toFixed(2)}
            </div>
            <div className="mt-1 text-xs text-slate-500">(positif − negatif) ÷ n · n = {total}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500">Tenor di luar berita program</div>
            <div className="mt-1 text-3xl font-semibold" style={{ color: tenorNonProgram >= 0 ? COLOR.Positive : COLOR.Negative }}>
              {tenorNonProgram > 0 ? '+' : ''}{tenorNonProgram.toFixed(2)}
            </div>
            <div className="mt-1 text-xs text-slate-500">n = {nonProgram.length}; berita program tidak dihitung</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-xs text-slate-500">Isu terpantau</div>
            <div className="mt-1 text-3xl font-semibold text-slate-900">{lanes.length}</div>
            <div className="mt-1 text-xs text-slate-500">isu berbeda pada periode ini</div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card className="flex flex-col">
        <CardHeader title="Rentang isu" subtitle={`Porsi berita tiap isu (n = ${total}). Klik nama isu untuk detail.`} />
        <CardBody className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col items-center gap-6 md:flex-row">
            <svg viewBox="0 0 200 200" className="h-56 w-56 shrink-0 self-center" role="img" aria-label={`Porsi berita per isu, n = ${total}`}>
              {(() => {
                const r = 70
                const c = 2 * Math.PI * r
                let acc = 0
                return donut.map((d) => {
                  const len = (d.n / total) * c
                  const el = (
                    <circle
                      key={d.key}
                      cx="100"
                      cy="100"
                      r={r}
                      fill="none"
                      stroke={d.color}
                      strokeWidth="34"
                      strokeDasharray={`${Math.max(len - 2, 0)} ${c - Math.max(len - 2, 0)}`}
                      strokeDashoffset={-acc}
                      transform="rotate(-90 100 100)"
                    >
                      <title>{`${d.name}: ${d.n} berita (${Math.round((d.n / total) * 100)}%)`}</title>
                    </circle>
                  )
                  acc += len
                  return el
                })
              })()}
              <text x="100" y="98" textAnchor="middle" fontSize="26" fontWeight="700" fill="#0f172a">{total}</text>
              <text x="100" y="116" textAnchor="middle" fontSize="11" fill="#64748b">berita</text>
            </svg>
            <ul className="flex w-full flex-1 flex-col justify-between gap-2 self-stretch text-xs">
              {donut.map((d) => (
                <li key={d.key} className="grid grid-cols-[12px_minmax(0,1fr)_auto] items-start gap-2.5 border-t border-slate-100 pt-2 first:border-t-0 first:pt-0">
                  <span className="mt-1 h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: d.color }} />
                  <div className="min-w-0">
                    {d.issueId ? (
                      <button onClick={() => onOpenIssue(d.issueId)} className="text-left font-medium text-slate-800 hover:underline">{d.name}</button>
                    ) : (
                      <span className="font-medium text-slate-800">{d.name}</span>
                    )}
                  </div>
                  <div className="text-right text-slate-700">
                    <span className="font-semibold">{Math.round((d.n / total) * 100)}%</span>
                    <div className="text-slate-500">{d.n} berita</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardBody>
      </Card>
        {topicChart}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Nada per isu" subtitle={`Jumlah berita per isu menurut nada (n = ${total}). Warna sel makin pekat makin besar porsinya dalam isu itu.`} />
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] border-separate border-spacing-1 text-xs">
                <thead>
                  <tr className="text-slate-500">
                    <th className="pb-1 text-left font-medium">Isu</th>
                    {SENTIMENTS.map((sent) => (
                      <th key={sent} className="w-16 pb-1 text-center font-medium">{LABEL[sent]}</th>
                    ))}
                    <th className="w-12 pb-1 text-right font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {issueRows.map((l) => (
                    <tr key={l.issueId}>
                      <td className="pr-2">
                        <button onClick={() => onOpenIssue(l.issueId)} className="line-clamp-2 text-left text-slate-700 hover:underline" title={l.name}>
                          {l.name}
                        </button>
                      </td>
                      {SENTIMENTS.map((sent) => {
                        const c = count(l.items, sent)
                        const share = c / l.items.length
                        return (
                          <td
                            key={sent}
                            className="h-10 rounded-md text-center font-semibold"
                            style={{ backgroundColor: c ? `${COLOR[sent]}${Math.round((0.18 + 0.82 * share) * 255).toString(16).padStart(2, '0')}` : '#f1f5f9', color: c && share > 0.5 ? '#fff' : '#334155' }}
                            title={`${l.name}: ${c} berita ${LABEL[sent].toLowerCase()} (${Math.round(share * 100)}%)`}
                          >
                            {c}
                          </td>
                        )
                      })}
                      <td className="text-right text-slate-600">{l.items.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-slate-400">Angka di sel adalah jumlah berita. Label nada dari file sumber menilai teks berita, bukan sikap terhadap PT AR.</p>
          </CardBody>
        </Card>

        <Card className="flex flex-col">
          <CardHeader title="Volume dan nada per minggu" subtitle={`Jumlah berita tiap minggu (mulai Senin) menurut nada, n = ${total}.`} />
          <CardBody className="flex flex-1 flex-col">
            <div className="relative min-h-[260px] flex-1">
              <div className="absolute inset-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weekSeries} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="#e8ecf1" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                <ChartLegend wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 8 }} />
                {(['Positive', 'Neutral', 'Negative'] as Sentiment[]).map((sent) => (
                  <Line key={sent} type="monotone" dataKey={sent} name={LABEL[sent]} stroke={COLOR[sent]} strokeWidth={2.5} dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <Card className="flex flex-col">
        <CardHeader title="Siapa yang terlihat di media" subtitle="Jumlah berita yang memuat pemangku kepentingan tersebut. Pihak yang tidak tampil di sini belum tentu absen di lapangan." />
        <CardBody className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col justify-between gap-2 text-xs">
            {actors.map(([name, c]) => (
              <div key={name} className="grid grid-cols-[170px_minmax(0,1fr)_28px] items-center gap-2.5">
                <span className="text-slate-700">{name}</span>
                <span className="block h-3.5 " style={{ backgroundColor: '#16547A', width: `${(c / actors[0][1]) * 100}%` }} />
                <span className="text-right text-slate-600">{c}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
        {influencerChart}
      </div>
    </div>
  )
}
