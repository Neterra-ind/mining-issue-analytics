import { useMemo, useState } from 'react'
import type { MediaOutlet, NewsItem } from '@/types'
import { useData } from '@/lib/store'
import { Drawer } from '@/components/ui/Drawer'
import { SentimentBadge } from '@/components/ui/Badge'
import { NewsDetailDrawer } from '@/components/news/NewsDetailDrawer'
import { sentimentBreakdown } from '@/lib/aggregations'
import { formatDate, formatRupiah } from '@/lib/utils'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-0.5 text-sm text-slate-800">{value}</div>
    </div>
  )
}

export function MediaDetailDrawer({ media, onClose }: { media: MediaOutlet | null; onClose: () => void }) {
  const { data } = useData()
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null)

  const relatedNews = useMemo(() => (media ? data.news.filter((n) => n.mediaId === media.id).sort((a, b) => (a.date < b.date ? 1 : -1)) : []), [media, data.news])
  const sb = sentimentBreakdown(relatedNews)
  const prValue = relatedNews.reduce((s, n) => s + n.prValue, 0)

  if (!media) return null

  return (
    <>
      <Drawer open={!!media} onClose={onClose} title={media.name} subtitle={`${media.type} · ${media.tier}`}>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <Field label="Total Artikel" value={relatedNews.length} />
            <Field label="Total PR Value" value={formatRupiah(prValue)} />
            <Field label="Positive" value={sb.positive} />
            <Field label="Negative" value={sb.negative} />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Artikel Terbaru</p>
            <div className="space-y-2">
              {relatedNews.map((n) => (
                <button key={n.id} onClick={() => setSelectedNews(n)} className="block w-full rounded-lg border border-slate-100 p-2.5 text-left hover:border-blue-200 hover:bg-blue-50/40">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-2 text-sm font-medium text-slate-700">{n.title}</p>
                    <SentimentBadge sentiment={n.sentiment} className="shrink-0" />
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{formatDate(n.date)}</p>
                </button>
              ))}
              {relatedNews.length === 0 && <p className="text-sm text-slate-400">Belum ada artikel tercatat.</p>}
            </div>
          </div>
        </div>
      </Drawer>
      <NewsDetailDrawer news={selectedNews} onClose={() => setSelectedNews(null)} />
    </>
  )
}
