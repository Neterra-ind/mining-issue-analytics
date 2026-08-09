import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useData } from '@/lib/store'
import { useToast } from '@/lib/toast'
import { PageHeader } from '@/components/PageHeader'
import { FilterBar } from '@/components/FilterBar'
import { Card, CardBody } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { NewsTable } from '@/components/news/NewsTable'
import { NewsDetailDrawer } from '@/components/news/NewsDetailDrawer'
import { NewsFormModal } from '@/components/news/NewsFormModal'
import { emptyFilters, filterNews } from '@/lib/aggregations'
import type { GlobalFilters, NewsItem } from '@/types'

export function NewsBrowser({ titleKey, title, subtitleKey, subtitle }: { titleKey: string; title: string; subtitleKey: string; subtitle: string }) {
  const { data, deleteNews } = useData()
  const { showToast } = useToast()
  const [filters, setFilters] = useState<GlobalFilters>(emptyFilters())
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<NewsItem | null>(null)
  const [editing, setEditing] = useState<NewsItem | null>(null)
  const [deleting, setDeleting] = useState<NewsItem | null>(null)

  const filtered = useMemo(() => {
    const base = filterNews(data.news, filters)
    if (!search.trim()) return base
    const q = search.toLowerCase()
    return base.filter((n) => n.title.toLowerCase().includes(q) || n.actor.toLowerCase().includes(q) || n.location.toLowerCase().includes(q))
  }, [data.news, filters, search])

  return (
    <div>
      <PageHeader configKey={titleKey} title={title} subtitleKey={subtitleKey} subtitle={subtitle} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul, aktor, atau lokasi…"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
        </div>
      </div>

      <div className="mb-4">
        <FilterBar filters={filters} onChange={setFilters} />
      </div>

      <Card>
        <CardBody>
          <p className="mb-2 text-xs text-slate-400">{filtered.length} dari {data.news.length} berita ditampilkan</p>
          <NewsTable rows={filtered} onRowClick={setSelected} editable onEdit={setEditing} onDelete={setDeleting} />
        </CardBody>
      </Card>

      <NewsDetailDrawer news={selected} onClose={() => setSelected(null)} />

      <NewsFormModal
        open={!!editing}
        onClose={() => setEditing(null)}
        initial={editing}
        onSaved={() => {
          setEditing(null)
          showToast('Berita berhasil diperbarui.')
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteNews(deleting.id)
            showToast('Berita dihapus.', 'info')
          }
          setDeleting(null)
        }}
        title="Hapus Berita"
        message={deleting ? `Berita "${deleting.title}" akan dihapus permanen dari database demo ini.` : ''}
      />
    </div>
  )
}
