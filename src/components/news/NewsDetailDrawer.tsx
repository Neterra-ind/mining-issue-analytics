import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { NewsItem } from '@/types'
import { useData } from '@/lib/store'
import { useToast } from '@/lib/toast'
import { Drawer } from '@/components/ui/Drawer'
import { SentimentBadge, RiskBadge, PillarBadge, RelatedPillarBadge, PolicyStatusBadge, EsgFrameBadge } from '@/components/ui/Badge'
import { normalizeRelatedPillars } from '@/lib/boundaries'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { NewsFormModal } from '@/components/news/NewsFormModal'
import { formatDate, formatRupiah } from '@/lib/utils'

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <div className="mt-0.5 text-sm text-slate-800">{value}</div>
    </div>
  )
}

export function NewsDetailDrawer({ news, onClose, onDeleted }: { news: NewsItem | null; onClose: () => void; onDeleted?: () => void }) {
  const { data, deleteNews } = useData()
  const { showToast } = useToast()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  if (!news) return null

  const media = data.media.find((m) => m.id === news.mediaId)
  const company = news.companyId ? data.companies.find((c) => c.id === news.companyId) : null
  const issue = data.issues.find((i) => i.id === news.issueId)
  const related = normalizeRelatedPillars(news.pillar, news.relatedPillars)

  return (
    <>
      <Drawer
        open={!!news}
        onClose={onClose}
        title={news.title}
        subtitle={`${formatDate(news.date)} · ${media?.name ?? '—'}`}
        footer={
          <>
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <PillarBadge pillar={news.pillar} />
            {related.map((p) => (
              <RelatedPillarBadge key={p} pillar={p} />
            ))}
            <SentimentBadge sentiment={news.sentiment} />
            <RiskBadge risk={news.risk} />
            {news.policyStatus && <PolicyStatusBadge status={news.policyStatus} />}
            {news.esgFrame && <EsgFrameBadge frame={news.esgFrame} />}
          </div>
          {related.length > 0 && <p className="-mt-3 text-[11px] text-slate-400">Pilar bergaris putus-putus adalah pilar terkait dan tidak dihitung di KPI.</p>}

          <p className="text-sm leading-relaxed text-slate-600">{news.summary}</p>

          <a href={news.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline">
            Buka artikel sumber <ExternalLink className="h-3.5 w-3.5" />
          </a>

          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <Field label="Media" value={media?.name ?? '—'} />
            <Field label="Media Type" value={news.mediaType} />
            <Field label="Company" value={company?.name ?? '—'} />
            <Field label="Location" value={news.location} />
            <Field
              label="Issue"
              value={
                issue ? (
                  <Link to={`/issues/${issue.id}`} className="text-blue-600 hover:underline">
                    {issue.name}
                  </Link>
                ) : (
                  '—'
                )
              }
            />
            <Field label="Topics" value={news.topics.join(', ') || '—'} />
            <Field label="Actor" value={news.actor} />
            <Field label="Stakeholder" value={news.stakeholders.join(', ') || '—'} />
            <Field label="Program" value={news.program ?? '—'} />
            <Field label="PR Value" value={formatRupiah(news.prValue)} />
          </div>
        </div>
      </Drawer>

      <ConfirmDialog
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteNews(news.id)
          setConfirmDelete(false)
          showToast('Berita dihapus.', 'info')
          onDeleted?.()
          onClose()
        }}
        title="Hapus Berita"
        message={`Berita "${news.title}" akan dihapus permanen dari database demo ini.`}
      />

      <NewsFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initial={news}
        onSaved={() => {
          setEditOpen(false)
          showToast('Berita berhasil diperbarui.')
        }}
      />
    </>
  )
}
