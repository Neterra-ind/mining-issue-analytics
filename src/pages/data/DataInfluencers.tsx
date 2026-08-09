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
import type { Influencer, InfluencerScope } from '@/types'

const inputClass = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'
const labelClass = 'mb-1 block text-xs font-medium text-slate-500'

function InfluencerFormModal({ open, onClose, initial, onSaved }: { open: boolean; onClose: () => void; initial: Influencer | null; onSaved: () => void }) {
  const { addInfluencer, updateInfluencer } = useData()
  const [name, setName] = useState('')
  const [position, setPosition] = useState('')
  const [organization, setOrganization] = useState('')
  const [scope, setScope] = useState<InfluencerScope>('External')
  const [category, setCategory] = useState('')

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setPosition(initial?.position ?? '')
    setOrganization(initial?.organization ?? '')
    setScope(initial?.scope ?? 'External')
    setCategory(initial?.category ?? '')
  }, [open, initial])

  function handleSubmit() {
    if (!name.trim()) return
    const payload = { name: name.trim(), position: position.trim(), organization: organization.trim(), scope, category: category.trim() }
    if (initial) updateInfluencer(initial.id, payload)
    else addInfluencer(payload)
    onSaved()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit Influencer' : 'Tambah Influencer'}
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
          <button onClick={handleSubmit} className="rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700">Simpan</button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className={labelClass}>Nama</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Jabatan</label>
          <input className={inputClass} value={position} onChange={(e) => setPosition(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Organisasi</label>
          <input className={inputClass} value={organization} onChange={(e) => setOrganization(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Scope</label>
            <select className={inputClass} value={scope} onChange={(e) => setScope(e.target.value as InfluencerScope)}>
              <option value="Internal">Internal</option>
              <option value="External">External</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Kategori</label>
            <input className={inputClass} value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Government, NGO, Academic…" />
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default function DataInfluencers() {
  const { data, deleteInfluencer } = useData()
  const { showToast } = useToast()
  const [editing, setEditing] = useState<Influencer | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Influencer | null>(null)

  const columns: Column<Influencer>[] = [
    { key: 'name', header: 'Name', render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
    { key: 'position', header: 'Position', render: (r) => r.position },
    { key: 'organization', header: 'Organization', render: (r) => r.organization },
    { key: 'scope', header: 'Scope', render: (r) => <Badge tone={r.scope === 'Internal' ? 'blue' : 'teal'}>{r.scope}</Badge> },
    { key: 'category', header: 'Category', render: (r) => r.category },
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
        configKey="dataInfluencers.title"
        title="Influencers"
        subtitleKey="dataInfluencers.subtitle"
        subtitle="Kelola daftar stakeholder / influencer yang dipetakan sistem."
        action={
          <button onClick={() => setEditing(null)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add Influencer
          </button>
        }
      />
      <Card>
        <CardBody>
          <Table columns={columns} rows={data.influencers} rowKey={(r) => r.id} />
        </CardBody>
      </Card>

      <InfluencerFormModal open={editing !== undefined} onClose={() => setEditing(undefined)} initial={editing ?? null} onSaved={() => { setEditing(undefined); showToast('Data influencer disimpan.') }} />

      <ConfirmDialog
        open={!!deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteInfluencer(deleting.id)
            showToast('Influencer dihapus.', 'info')
          }
          setDeleting(null)
        }}
        title="Hapus Influencer"
        message={deleting ? `Data influencer "${deleting.name}" akan dihapus.` : ''}
      />
    </div>
  )
}
