import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useData } from '@/lib/store'
import { useToast } from '@/lib/toast'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { MediaOutlet, MediaTier, MediaType } from '@/types'

const inputClass = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'
const labelClass = 'mb-1 block text-xs font-medium text-slate-500'

function MediaFormModal({ open, onClose, initial, onSaved }: { open: boolean; onClose: () => void; initial: MediaOutlet | null; onSaved: () => void }) {
  const { addMedia, updateMedia } = useData()
  const [name, setName] = useState('')
  const [type, setType] = useState<MediaType>('Online')
  const [tier, setTier] = useState<MediaTier>('Tier 2')

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setType(initial?.type ?? 'Online')
    setTier(initial?.tier ?? 'Tier 2')
  }, [open, initial])

  function handleSubmit() {
    if (!name.trim()) return
    const payload = { name: name.trim(), type, tier }
    if (initial) updateMedia(initial.id, payload)
    else addMedia(payload)
    onSaved()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit Media' : 'Tambah Media'}
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
          <button onClick={handleSubmit} className="rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700">Simpan</button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className={labelClass}>Nama Media</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Tipe</label>
            <select className={inputClass} value={type} onChange={(e) => setType(e.target.value as MediaType)}>
              <option value="Online">Online</option>
              <option value="Cetak">Cetak</option>
              <option value="TV">TV</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Tier</label>
            <select className={inputClass} value={tier} onChange={(e) => setTier(e.target.value as MediaTier)}>
              <option value="Tier 1">Tier 1</option>
              <option value="Tier 2">Tier 2</option>
              <option value="Tier 3">Tier 3</option>
            </select>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default function DataMedia() {
  const { data, deleteMedia } = useData()
  const { showToast } = useToast()
  const [editing, setEditing] = useState<MediaOutlet | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<MediaOutlet | null>(null)

  const columns: Column<MediaOutlet>[] = [
    { key: 'name', header: 'Media', render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
    { key: 'type', header: 'Type', render: (r) => <Badge>{r.type}</Badge> },
    { key: 'tier', header: 'Tier', render: (r) => <Badge tone="amber">{r.tier}</Badge> },
    {
      key: 'actions',
      header: '',
      render: (r) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setEditing(r)} className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Pencil className="h-3.5 w-3.5" /></button>
          <button onClick={() => setDeleting(r)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        configKey="dataMedia.title"
        title="Media"
        subtitleKey="dataMedia.subtitle"
        subtitle="Kelola daftar outlet media yang dipantau."
        action={
          <button onClick={() => setEditing(null)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add Media
          </button>
        }
      />
      <Card>
        <CardBody>
          <Table columns={columns} rows={data.media} rowKey={(r) => r.id} />
        </CardBody>
      </Card>

      <MediaFormModal open={editing !== undefined} onClose={() => setEditing(undefined)} initial={editing ?? null} onSaved={() => { setEditing(undefined); showToast('Data media disimpan.') }} />

      <ConfirmDialog
        open={!!deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteMedia(deleting.id)
            showToast('Media dihapus.', 'info')
          }
          setDeleting(null)
        }}
        title="Hapus Media"
        message={deleting ? `Media "${deleting.name}" akan dihapus dari daftar.` : ''}
      />
    </div>
  )
}
