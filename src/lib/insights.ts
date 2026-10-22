import type { IssueMonitoringOverview } from '@/lib/aggregations'
import { formatDate, percentage } from '@/lib/utils'

export type InsightTone = 'critical' | 'warning' | 'neutral' | 'positive'

export interface Insight {
  id: string
  tone: InsightTone
  text: string
}

export interface MonitoringNarrative {
  headline: string
  points: Insight[]
}

const TONE_RANK: Record<InsightTone, number> = { critical: 0, warning: 1, neutral: 2, positive: 3 }

/**
 * Rule-based, deterministic narrative for the industry issue-monitoring data —
 * the kind of summary an analyst would write, derived straight from the
 * aggregates. No model calls, no AI, no external service: same input always
 * yields the same text.
 */
export function industryMonitoringInsights(o: IssueMonitoringOverview): MonitoringNarrative {
  const total = o.totalItems

  if (total === 0) {
    return { headline: 'Belum ada berita isu industri non-korporat pada periode ini.', points: [] }
  }

  const headline = `${total} berita isu industri non-korporat terpantau — ${o.highRiskItems} berisiko tinggi, ${o.risingIssues} isu bertren menaik.`
  const points: Insight[] = []
  const byCount = [...o.clusters].sort((a, b) => b.count - a.count)

  // Konsentrasi volume
  const top = byCount[0]
  points.push({
    id: 'volume',
    tone: top.maxRisk === 'Critical' || top.maxRisk === 'High' ? 'warning' : 'neutral',
    text: `Pemberitaan paling terkonsentrasi pada "${top.issue.name}" — ${top.count} dari ${total} berita (${percentage(top.count, total)}%), kategori ${top.issue.category}.`,
  })

  // Status kritis
  const critical = [...o.clusters].filter((c) => c.maxRisk === 'Critical').sort((a, b) => b.highRiskCount - a.highRiskCount)
  if (critical.length) {
    const lead = critical[0]
    const detail = `${lead.highRiskCount} dari ${lead.count} berita berisiko tinggi — perlu pemantauan intensif.`
    points.push({
      id: 'critical',
      tone: 'critical',
      text:
        critical.length === 1
          ? `"${lead.issue.name}" berstatus Kritis: ${detail}`
          : `${critical.length} isu berstatus Kritis: ${critical.map((c) => `"${c.issue.name}"`).join(', ')}. Terberat "${lead.issue.name}" — ${detail}`,
    })
  }

  // Momentum / tren menaik
  const rising = o.clusters.filter((c) => c.trend === 'up')
  if (rising.length) {
    const risingNames = rising.map((c) => `"${c.issue.name}"`).join(', ')
    const priorityRising = rising.filter((c) => c.highRiskCount > 0).map((c) => `"${c.issue.name}"`)
    points.push({
      id: 'momentum',
      tone: priorityRising.length ? 'warning' : 'neutral',
      text:
        `${rising.length} dari ${o.clusters.length} isu bertren menaik: ${risingNames}.` +
        (priorityRising.length ? ` Menaik sekaligus berisiko tinggi: ${priorityRising.join(', ')}.` : ''),
    })
  }

  // Sentimen keseluruhan
  const s = o.sentiment
  const negShare = percentage(s.negative, s.total || 1)
  const sentimentTone: InsightTone =
    s.negative >= s.neutral && s.negative >= s.positive && negShare >= 30
      ? 'warning'
      : s.positive > s.negative && s.positive >= s.neutral
        ? 'positive'
        : 'neutral'
  const negCluster = [...o.clusters]
    .filter((c) => c.sentiment.negative > 0)
    .sort((a, b) => b.sentiment.negative - a.sentiment.negative)[0]
  points.push({
    id: 'sentiment',
    tone: sentimentTone,
    text:
      `Nada pemberitaan: ${s.negative} negatif, ${s.neutral} netral, ${s.positive} positif (dari ${s.total}).` +
      (negCluster ? ` Sentimen negatif paling terkonsentrasi di "${negCluster.issue.name}".` : ''),
  })

  // Aktivitas terbaru
  const recent = [...o.clusters].sort((a, b) => b.recentCount - a.recentCount)[0]
  if (recent && recent.recentCount > 0 && o.recentCutoff) {
    points.push({
      id: 'recency',
      tone: 'neutral',
      text: `Sejak ${formatDate(o.recentCutoff)}, aktivitas terbaru paling banyak pada "${recent.issue.name}" (${recent.recentCount} berita).`,
    })
  }

  // Cakupan kategori yang kosong
  const emptyCats = o.categories.filter((c) => c.count === 0).map((c) => c.category)
  if (emptyCats.length) {
    points.push({
      id: 'gap',
      tone: 'neutral',
      text: `Tidak ada pemberitaan non-korporat pada kategori: ${emptyCats.join(', ')}.`,
    })
  }

  points.sort((a, b) => TONE_RANK[a.tone] - TONE_RANK[b.tone])
  return { headline, points: points.slice(0, 6) }
}
