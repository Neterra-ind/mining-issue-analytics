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
import type { Company } from '@/types'

const inputClass = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'
const labelClass = 'mb-1 block text-xs font-medium text-slate-500'

function CompanyFormModal({ open, onClose, initial, onSaved }: { open: boolean; onClose: () => void; initial: Company | null; onSaved: () => void }) {
  const { addCompany, updateCompany } = useData()
  const [name, setName] = useState('')
  const [shortName, setShortName] = useState('')
  const [sector, setSector] = useState('')
  const [isPrimary, setIsPrimary] = useState(false)
  const [accentColor, setAccentColor] = useState('#1a4d8f')

  useEffect(() => {
    if (!open) return
    setName(initial?.name ?? '')
    setShortName(initial?.shortName ?? '')
    setSector(initial?.sector ?? '')
    setIsPrimary(initial?.isPrimary ?? false)
    setAccentColor(initial?.accentColor ?? '#1a4d8f')
  }, [open, initial])

  function handleSubmit() {
    if (!name.trim() || !shortName.trim()) return
    const payload = { name: name.trim(), shortName: shortName.trim(), sector: sector.trim(), isPrimary, accentColor }
    if (initial) updateCompany(initial.id, payload)
    else addCompany(payload)
    onSaved()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit Company' : 'Tambah Company'}
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Batal</button>
          <button onClick={handleSubmit} className="rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700">Simpan</button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className={labelClass}>Nama Perusahaan</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Nama Singkat</label>
          <input className={inputClass} value={shortName} onChange={(e) => setShortName(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Sektor</label>
          <input className={inputClass} value={sector} onChange={(e) => setSector(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <input id="isPrimary" type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
          <label htmlFor="isPrimary" className="text-sm text-slate-600">Tandai sebagai perusahaan utama (default Corporate Reputation)</label>
        </div>
        <div>
          <label className={labelClass}>Warna Aksen</label>
          <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)} className="h-9 w-16 rounded-lg border border-slate-200" />
        </div>
      </div>
    </Modal>
  )
}

export default function DataCompanies() {
  const { data, deleteCompany } = useData()
  const { showToast } = useToast()
  const [editing, setEditing] = useState<Company | null | undefined>(undefined)
  const [deleting, setDeleting] = useState<Company | null>(null)

  const columns: Column<Company>[] = [
    { key: 'name', header: 'Company', render: (r) => (
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.accentColor }} />
        <span className="font-medium text-slate-800">{r.name}</span>
        {r.isPrimary && <Badge tone="blue">Primary</Badge>}
      </div>
    ) },
    { key: 'shortName', header: 'Short Name', render: (r) => r.shortName },
    { key: 'sector', header: 'Sector', render: (r) => r.sector },
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
        configKey="dataCompanies.title"
        title="Companies"
        subtitleKey="dataCompanies.subtitle"
        subtitle="Kelola daftar perusahaan yang dipantau."
        action={
          <button onClick={() => setEditing(null)} className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus className="h-4 w-4" /> Add Company
          </button>
        }
      />
      <Card>
        <CardBody>
          <Table columns={columns} rows={data.companies} rowKey={(r) => r.id} />
        </CardBody>
      </Card>

      <CompanyFormModal open={editing !== undefined} onClose={() => setEditing(undefined)} initial={editing ?? null} onSaved={() => { setEditing(undefined); showToast('Data perusahaan disimpan.') }} />

      <ConfirmDialog
        open={!!deleting}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            deleteCompany(deleting.id)
            showToast('Perusahaan dihapus.', 'info')
          }
          setDeleting(null)
        }}
        title="Hapus Company"
        message={deleting ? `Perusahaan "${deleting.name}" akan dihapus. Berita yang sudah tertaut ke perusahaan ini tidak akan otomatis berubah.` : ''}
      />
    </div>
  )
}
