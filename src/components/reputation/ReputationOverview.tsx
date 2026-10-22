import { useMemo } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import type { Issue, NewsItem, Sentiment } from '@/types'

/**
 * Ringkasan reputasi berbasis berita: nada per isu, linimasa isu, volume per minggu, dan aktor.
 * Semua angka dihitung dari `news` yang diberikan (semua pilar, satu perusahaan) —
 * tidak ada data baru dan tidak ada field tambahan pada NewsItem.
 */

const COLOR: Record<Sentiment, string> = { Positive: '#1D4ED8', Neutral: '#6B7683', Negative: '#C2410C' }
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
}: {
  news: NewsItem[]
  issues: Issue[]
  companyName: string
  onOpenIssue: (issueId: string) => void
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
      .map(([issueId, items]) => ({ issueId, name: issues.find((i) => i.id === issueId)?.name ?? issueId, items }))
      .sort((a, b) => b.items.length - a.items.length)
  }, [news, issues])

  const range = useMemo(() => {
    if (!news.length) return { min: 0, max: 1 }
    const all = news.map((n) => ts(n.date))
    const min = Math.min(...all)
    const max = Math.max(...all)
    return { min, max: max === min ? min + DAY : max }
  }, [news])

  const weeks = useMemo(() => {
    const m = new Map<number, NewsItem[]>()
    for (const n of news) {
      const k = weekStart(n.date)
      m.set(k, [...(m.get(k) ?? []), n])
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([start, items]) => ({ start, items }))
  }, [news])
  const maxWeek = Math.max(1, ...weeks.map((w) => w.items.length))

  const actors = useMemo(() => {
    const m = new Map<string, number>()
    for (const n of news) for (const s of new Set(n.stakeholders)) m.set(s, (m.get(s) ?? 0) + 1)
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)
  }, [news])

  const issueRows = lanes.slice(0, 8)
  const maxSide = Math.max(1, ...issueRows.map((l) => Math.max(count(l.items, 'Negative'), count(l.items, 'Positive'))))

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

      <Card>
        <CardHeader title="Linimasa isu" subtitle="Satu baris per isu; setiap titik adalah satu berita, diwarnai menurut nada. Klik nama isu untuk detail." />
        <CardBody>
          <Legend />
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              <div className="mb-1 grid grid-cols-[160px_minmax(0,1fr)] gap-3 text-[11px] text-slate-500">
                <span />
                <div className="flex justify-between">
                  <span>{fmtDay(range.min)}</span>
                  <span>{fmtDay(range.max)}</span>
                </div>
              </div>
              {lanes.slice(0, 8).map((l) => (
                <div key={l.issueId} className="grid h-12 grid-cols-[160px_minmax(0,1fr)] items-center gap-3 border-t border-slate-100">
                  <button onClick={() => onOpenIssue(l.issueId)} className="line-clamp-2 text-left text-xs font-medium text-slate-800 hover:underline" title={l.name}>
                    {l.name}
                  </button>
                  <div className="relative h-12">
                    <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
                    {l.items.map((n) => (
                      <span
                        key={n.id}
                        title={`${n.date} · ${LABEL[n.sentiment]} · ${n.title}`}
                        className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white"
                        style={{ left: `${((ts(n.date) - range.min) / (range.max - range.min)) * 100}%`, backgroundColor: COLOR[n.sentiment] }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {lanes.length > 8 && <p className="mt-2 text-xs text-slate-400">Menampilkan 8 isu terbanyak dari {lanes.length}.</p>}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader title="Nada per isu" subtitle={`Jumlah berita (n = ${total}). Kiri negatif, tengah netral, kanan positif.`} />
          <CardBody>
            <Legend />
            <div className="space-y-2.5">
              {issueRows.map((l) => {
                const n = count(l.items, 'Negative')
                const u = count(l.items, 'Neutral')
                const p = count(l.items, 'Positive')
                return (
                  <div key={l.issueId} className="grid grid-cols-[150px_minmax(0,1fr)] items-center gap-2.5 text-xs">
                    <button onClick={() => onOpenIssue(l.issueId)} className="line-clamp-2 text-left text-slate-700 hover:underline" title={l.name}>
                      {l.name} ({l.items.length})
                    </button>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center">
                      <div className="flex justify-end">
                        <span className="mr-0.5 h-5" style={{ width: `${(n / maxSide) * 100}%`, backgroundColor: COLOR.Negative }} />
                      </div>
                      <span className="h-5" style={{ width: u * 8, backgroundColor: COLOR.Neutral }} />
                      <div className="flex">
                        <span className="ml-0.5 h-5" style={{ width: `${(p / maxSide) * 100}%`, backgroundColor: COLOR.Positive }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="mt-3 text-xs text-slate-400">Panjang sisi sebanding jumlah berita; sisi terpanjang = {maxSide}.</p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Volume dan nada per minggu" subtitle="Jumlah berita tiap minggu (mulai Senin), ditumpuk menurut nada." />
          <CardBody>
            <Legend />
            <div className="flex h-36 items-end gap-2 border-b border-slate-200 px-1">
              {weeks.map((w) => (
                <div key={w.start} className="flex flex-1 flex-col-reverse gap-0.5" title={`${fmtDay(w.start)}: ${w.items.length} berita`}>
                  {(['Positive', 'Neutral', 'Negative'] as Sentiment[]).map((s) => {
                    const c = count(w.items, s)
                    return c ? <div key={s} style={{ height: `${(c / maxWeek) * 128}px`, backgroundColor: COLOR[s] }} /> : null
                  })}
                </div>
              ))}
            </div>
            <div className="mt-1.5 flex gap-2 px-1 text-center text-[11px] text-slate-500">
              {weeks.map((w) => (
                <span key={w.start} className="flex-1">{fmtDay(w.start)}</span>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Siapa yang terlihat di media" subtitle="Jumlah berita yang memuat pemangku kepentingan tersebut. Pihak yang tidak tampil di sini belum tentu absen di lapangan." />
        <CardBody>
          <div className="space-y-2 text-xs">
            {actors.map(([name, c]) => (
              <div key={name} className="grid grid-cols-[170px_minmax(0,1fr)_28px] items-center gap-2.5">
                <span className="text-slate-700">{name}</span>
                <span className="block h-3.5 bg-teal-700" style={{ width: `${(c / actors[0][1]) * 100}%` }} />
                <span className="text-right text-slate-600">{c}</span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
