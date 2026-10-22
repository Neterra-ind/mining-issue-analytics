import type { EsgFrame, Pillar, PolicyStatus, RiskLevel, Sentiment } from '@/types'
import { cn } from '@/lib/utils'

export function Badge({ children, className, tone = 'slate' }: { children: React.ReactNode; className?: string; tone?: 'slate' | 'blue' | 'teal' | 'amber' }) {
  const toneClass = {
    slate: 'bg-slate-100 text-slate-700 ring-slate-200',
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    teal: 'bg-teal-50 text-teal-700 ring-teal-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  }[tone]
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', toneClass, className)}>
      {children}
    </span>
  )
}

const SENTIMENT_STYLE: Record<Sentiment, string> = {
  Positive: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
  Negative: 'bg-red-50 text-red-700 ring-red-200',
}

export function SentimentBadge({ sentiment, className }: { sentiment: Sentiment; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', SENTIMENT_STYLE[sentiment], className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', sentiment === 'Positive' ? 'bg-emerald-500' : sentiment === 'Negative' ? 'bg-red-500' : 'bg-slate-400')} />
      {sentiment}
    </span>
  )
}

const RISK_STYLE: Record<RiskLevel, string> = {
  Low: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Moderate: 'bg-amber-50 text-amber-800 ring-amber-200',
  High: 'bg-orange-50 text-orange-700 ring-orange-200',
  Critical: 'bg-red-50 text-red-700 ring-red-200',
}

export function RiskBadge({ risk, className }: { risk: RiskLevel; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', RISK_STYLE[risk], className)}>{risk}</span>
}

export function PillarBadge({ pillar, className }: { pillar: Pillar; className?: string }) {
  const style = {
    Industry: 'bg-blue-50 text-blue-700 ring-blue-200',
    ESG: 'bg-teal-50 text-teal-700 ring-teal-200',
    Corporate: 'bg-violet-50 text-violet-700 ring-violet-200',
  }[pillar]
  return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', style, className)}>{pillar}</span>
}

/** Pilar terkait: garis putus-putus agar tidak tertukar dengan pilar utama (yang dihitung di KPI). */
export function RelatedPillarBadge({ pillar, className }: { pillar: Pillar; className?: string }) {
  const style = {
    Industry: 'border-blue-300 text-blue-600',
    ESG: 'border-teal-300 text-teal-600',
    Corporate: 'border-violet-300 text-violet-600',
  }[pillar]
  return (
    <span title="Pilar terkait — tidak dihitung di KPI" className={cn('inline-flex items-center rounded-full border border-dashed bg-white px-2 py-0.5 text-xs font-medium', style, className)}>
      + {pillar}
    </span>
  )
}

const POLICY_STATUS_STYLE: Record<PolicyStatus, string> = {
  Resmi: 'bg-slate-800 text-white ring-slate-800',
  Draf: 'bg-amber-50 text-amber-800 ring-amber-200',
  Wacana: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export function PolicyStatusBadge({ status, className }: { status: PolicyStatus; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', POLICY_STATUS_STYLE[status], className)}>{status}</span>
}

const ESG_FRAME_STYLE: Record<EsgFrame, string> = {
  Teladan: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Bagian masalah sektor': 'bg-amber-50 text-amber-800 ring-amber-200',
  Tertuduh: 'bg-red-50 text-red-700 ring-red-200',
}

export function EsgFrameBadge({ frame, className }: { frame: EsgFrame; className?: string }) {
  return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', ESG_FRAME_STYLE[frame], className)}>{frame}</span>
}
