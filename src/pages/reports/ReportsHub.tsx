import { useSearchParams } from 'react-router-dom'
import { cn } from '@/lib/utils'
import ReportPage, { type ReportType } from '@/pages/reports/ReportPage'

const TABS: { type: ReportType; label: string }[] = [
  { type: 'industry', label: 'Industry Report' },
  { type: 'esg', label: 'ESG Report' },
  { type: 'corporate', label: 'Corporate Report' },
]

function isReportType(value: string | null): value is ReportType {
  return TABS.some((t) => t.type === value)
}

export default function ReportsHub() {
  const [params, setParams] = useSearchParams()
  const raw = params.get('type')
  const active: ReportType = isReportType(raw) ? raw : 'industry'

  return (
    <div>
      <div className="mb-5 inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {TABS.map(({ type, label }) => (
          <button
            key={type}
            onClick={() => setParams({ type })}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              active === type ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      <ReportPage key={active} reportType={active} />
    </div>
  )
}
