import { RefreshCw } from 'lucide-react'
import type { GlobalFilters } from '@/types'
import { useData } from '@/lib/store'
import { uniqueRegions } from '@/lib/aggregations'
import { useToast } from '@/lib/toast'

const selectClass = 'rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'

export function FilterBar({
  filters,
  onChange,
  showPillar = true,
  showCompany = true,
}: {
  filters: GlobalFilters
  onChange: (next: GlobalFilters) => void
  showPillar?: boolean
  showCompany?: boolean
}) {
  const { data } = useData()
  const { showToast } = useToast()
  const regions = uniqueRegions(data.news)

  function update<K extends keyof GlobalFilters>(key: K, value: GlobalFilters[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-medium text-slate-500">Dari</label>
        <input type="date" value={filters.dateFrom} onChange={(e) => update('dateFrom', e.target.value)} className={selectClass} />
      </div>
      <div className="flex items-center gap-1.5">
        <label className="text-xs font-medium text-slate-500">Sampai</label>
        <input type="date" value={filters.dateTo} onChange={(e) => update('dateTo', e.target.value)} className={selectClass} />
      </div>
      {showPillar && (
        <select value={filters.pillar} onChange={(e) => update('pillar', e.target.value as GlobalFilters['pillar'])} className={selectClass}>
          <option value="All">Semua Pilar</option>
          <option value="Industry">Industry</option>
          <option value="ESG">ESG</option>
          <option value="Corporate">Corporate</option>
        </select>
      )}
      {showCompany && (
        <select value={filters.companyId} onChange={(e) => update('companyId', e.target.value)} className={selectClass}>
          <option value="All">Semua Perusahaan</option>
          {data.companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.shortName}
            </option>
          ))}
        </select>
      )}
      <select value={filters.region} onChange={(e) => update('region', e.target.value)} className={selectClass}>
        <option value="All">Semua Wilayah</option>
        {regions.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <select value={filters.mediaType} onChange={(e) => update('mediaType', e.target.value as GlobalFilters['mediaType'])} className={selectClass}>
        <option value="All">Semua Media</option>
        <option value="Online">Online</option>
        <option value="Cetak">Cetak</option>
        <option value="TV">TV</option>
      </select>
      <button
        onClick={() => showToast('Data diperbarui', 'info')}
        className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Refresh Data
      </button>
    </div>
  )
}
