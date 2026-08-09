import { useMemo, useState } from 'react'
import type { Influencer } from '@/types'
import { useData } from '@/lib/store'
import { Drawer } from '@/components/ui/Drawer'
import { SentimentBadge } from '@/components/ui/Badge'
import { NewsDetailDrawer } from '@/components/news/NewsDetailDrawer'
import { sentimentBreakdown } from '@/lib/aggregations'
import { formatDate, groupBy } from '@/lib/utils'
import type { NewsItem } from '@/types'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-0.5 text-sm text-slate-800">{value}</div>
    </div>
  )
}

export function InfluencerDetailDrawer({ influencer, onClose }: { influencer: Influencer | null; onClose: () => void }) {
  const { data } = useData()
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)

  const relatedNews = useMemo(() => (influencer ? data.news.filter((n) => n.actor === influencer.name).sort((a, b) => (a.date < b.date ? 1 : -1)) : []), [influencer, data.news])
  const sb = sentimentBreakdown(relatedNews)
  const issueCounts = useMemo(() => {
    const byIssue = groupBy(relatedNews, (n) => n.issueId)
    return [...byIssue.entries()]
      .map(([issueId, items]) => ({ issue: data.issues.find((i) => i.id === issueId), count: items.length }))
      .filter((r) => r.issue)
      .sort((a, b) => b.count - a.count)
  }, [relatedNews, data.issues])

  if (!influencer) return null

  return (
    <>
      <Drawer open={!!influencer} onClose={onClose} title={influencer.name} subtitle={`${influencer.position} · ${influencer.organization}`}>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <Field label="Scope" value={influencer.scope} />
            <Field label="Category" value={influencer.category} />
            <Field label="Total Statements" value={relatedNews.length} />
            <Field
              label="Sentiment Lean"
              value={<SentimentBadge sentiment={sb.positive >= sb.negative && sb.positive >= sb.neutral ? 'Positive' : sb.negative >= sb.neutral ? 'Negative' : 'Neutral'} />}
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Isu yang Dikomentari</p>
            <div className="flex flex-wrap gap-1.5">
              {issueCounts.map((r) => (
                <span key={r.issue!.id} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-200">
                  {r.issue!.name} ({r.count})
                </span>
              ))}
              {issueCounts.length === 0 && <p className="text-sm text-slate-400">Belum ada pernyataan tercatat.</p>}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Pernyataan / Pemberitaan Terkait</p>
            <div className="space-y-2">
              {relatedNews.map((n) => (
                <button key={n.id} onClick={() => setSelectedNews(n)} className="block w-full rounded-lg border border-slate-100 p-2.5 text-left hover:border-blue-200 hover:bg-blue-50/40">
                  <p className="line-clamp-2 text-sm font-medium text-slate-700">{n.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{formatDate(n.date)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Drawer>
      <NewsDetailDrawer news={selectedNews} onClose={() => setSelectedNews(null)} />
    </>
  )
}
