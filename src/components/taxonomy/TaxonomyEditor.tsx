import { useState } from 'react'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, X, Check } from 'lucide-react'
import { useData } from '@/lib/store'
import { useToast } from '@/lib/toast'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import type { Pillar, TaxonomyCategory } from '@/types'

function CategoryRow({ category, onMoveUp, onMoveDown, isFirst, isLast }: { category: TaxonomyCategory; onMoveUp: () => void; onMoveDown: () => void; isFirst: boolean; isLast: boolean }) {
  const { updateTaxonomy, deleteTaxonomy } = useData()
  const { showToast } = useToast()
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(category.label)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function save() {
    if (value.trim()) {
      updateTaxonomy(category.id, { label: value.trim() })
      showToast('Kategori diperbarui.')
    }
    setEditing(false)
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2">
      <div className="flex flex-col">
        <button onClick={onMoveUp} disabled={isFirst} className="text-slate-300 hover:text-slate-600 disabled:opacity-30" title="Naik">
          <ArrowUp className="h-3 w-3" />
        </button>
        <button onClick={onMoveDown} disabled={isLast} className="text-slate-300 hover:text-slate-600 disabled:opacity-30" title="Turun">
          <ArrowDown className="h-3 w-3" />
        </button>
      </div>
      {editing ? (
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          className="flex-1 rounded-md border border-blue-300 px-2 py-1 text-sm focus:outline-none"
        />
      ) : (
        <span className="flex-1 text-sm text-slate-700">{category.label}</span>
      )}
      <div className="flex items-center gap-1">
        {editing ? (
          <>
            <button onClick={save} className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50">
              <Check className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => { setEditing(false); setValue(category.label) }} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100">
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditing(true)} className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600">
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setConfirmDelete(true)} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
      <ConfirmDialog
        open={confirmDelete}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteTaxonomy(category.id)
          setConfirmDelete(false)
          showToast('Kategori dihapus.', 'info')
        }}
        title="Hapus Kategori"
        message={`Kategori "${category.label}" akan dihapus dari taxonomy. Berita yang sudah memakai tag ini tidak akan otomatis berubah.`}
      />
    </div>
  )
}

function GroupCard({ pillar, group, items }: { pillar: Pillar; group: string; items: TaxonomyCategory[] }) {
  const { addTaxonomy, reorderTaxonomy } = useData()
  const { showToast } = useToast()
  const [newLabel, setNewLabel] = useState('')
  const sorted = [...items].sort((a, b) => a.order - b.order)

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= sorted.length) return
    const ids = sorted.map((c) => c.id)
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorderTaxonomy(group, ids)
  }

  function handleAdd() {
    if (!newLabel.trim()) return
    addTaxonomy({ pillar, group, label: newLabel.trim(), order: sorted.length + 1 })
    setNewLabel('')
    showToast('Kategori baru ditambahkan.')
  }

  return (
    <Card>
      <CardHeader title={group} subtitle={`${sorted.length} kategori`} />
      <CardBody className="space-y-2">
        {sorted.map((cat, idx) => (
          <CategoryRow key={cat.id} category={cat} onMoveUp={() => move(idx, -1)} onMoveDown={() => move(idx, 1)} isFirst={idx === 0} isLast={idx === sorted.length - 1} />
        ))}
        <div className="flex items-center gap-2 pt-1">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Tambah kategori baru…"
            className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button onClick={handleAdd} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700">
            <Plus className="h-3.5 w-3.5" />
            Add
          </button>
        </div>
      </CardBody>
    </Card>
  )
}

export function TaxonomyEditor({ pillars }: { pillars: Pillar[] }) {
  const { data } = useData()
  const relevant = data.taxonomy.filter((t) => pillars.includes(t.pillar))
  const groups = Array.from(new Set(relevant.map((t) => t.group)))

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {groups.map((group) => {
        const items = relevant.filter((t) => t.group === group)
        return <GroupCard key={group} pillar={items[0].pillar} group={group} items={items} />
      })}
    </div>
  )
}
