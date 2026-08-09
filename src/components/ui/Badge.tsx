import type { RiskLevel, Sentiment } from '@/types'
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

export function PillarBadge({ pillar, className }: { pillar: 'Industry' | 'ESG' | 'Corporate'; className?: string }) {
  const style = {
    Industry: 'bg-blue-50 text-blue-700 ring-blue-200',
    ESG: 'bg-teal-50 text-teal-700 ring-teal-200',
    Corporate: 'bg-violet-50 text-violet-700 ring-violet-200',
  }[pillar]
  return <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset', style, className)}>{pillar}</span>
}
