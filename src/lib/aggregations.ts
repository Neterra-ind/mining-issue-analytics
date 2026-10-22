import type { AppData, GlobalFilters, Issue, NewsItem, RiskLevel, Sentiment } from '@/types'
import { groupBy, percentage } from '@/lib/utils'

export const RISK_WEIGHT: Record<RiskLevel, number> = { Low: 1, Moderate: 2, High: 3, Critical: 4 }

export const emptyFilters = (): GlobalFilters => ({
  dateFrom: '2026-06-01',
  dateTo: '2026-10-31',
  pillar: 'All',
  companyId: 'All',
  region: 'All',
  mediaType: 'All',
})

export function filterNews(news: NewsItem[], filters: Partial<GlobalFilters>): NewsItem[] {
  return news.filter((n) => {
    if (filters.dateFrom && n.date < filters.dateFrom) return false
    if (filters.dateTo && n.date > filters.dateTo) return false
    if (filters.pillar && filters.pillar !== 'All' && n.pillar !== filters.pillar) return false
    if (filters.companyId && filters.companyId !== 'All' && n.companyId !== filters.companyId) return false
    if (filters.region && filters.region !== 'All' && n.location !== filters.region) return false
    if (filters.mediaType && filters.mediaType !== 'All' && n.mediaType !== filters.mediaType) return false
    return true
  })
}

export interface SentimentCounts {
  positive: number
  neutral: number
  negative: number
  total: number
}

export function sentimentBreakdown(news: NewsItem[]): SentimentCounts {
  let positive = 0
  let neutral = 0
  let negative = 0
  for (const n of news) {
    if (n.sentiment === 'Positive') positive++
    else if (n.sentiment === 'Neutral') neutral++
    else negative++
  }
  return { positive, neutral, negative, total: news.length }
}

export interface ExecutiveKpis {
  totalNews: number
  positive: number
  neutral: number
  negative: number
  potentialRisk: number
  criticalIssues: number
  topIssueName: string
  prValue: number
}

export function computeExecutiveKpis(news: NewsItem[], issues: AppData['issues']): ExecutiveKpis {
  const sb = sentimentBreakdown(news)
  const potentialRisk = news.filter((n) => n.risk === 'High' || n.risk === 'Critical').length
  const criticalIssueIds = new Set(news.filter((n) => n.risk === 'Critical').map((n) => n.issueId))
  const prValue = news.reduce((sum, n) => sum + n.prValue, 0)
  const top = topIssues(news, issues, 1)[0]
  return {
    totalNews: news.length,
    positive: sb.positive,
    neutral: sb.neutral,
    negative: sb.negative,
    potentialRisk,
    criticalIssues: criticalIssueIds.size,
    topIssueName: top?.issue.name ?? '—',
    prValue,
  }
}

export interface IssueAgg {
  issue: AppData['issues'][number]
  count: number
  sentiment: SentimentCounts
  impactScore: number
}

export function topIssues(news: NewsItem[], issues: AppData['issues'], limit = 10): IssueAgg[] {
  const byIssue = groupBy(news, (n) => n.issueId)
  const issueMap = new Map(issues.map((i) => [i.id, i]))
  const rows: IssueAgg[] = []
  for (const [issueId, items] of byIssue) {
    const issue = issueMap.get(issueId)
    if (!issue) continue
    const impactScore = items.reduce((s, n) => s + RISK_WEIGHT[n.risk], 0) / items.length
    rows.push({ issue, count: items.length, sentiment: sentimentBreakdown(items), impactScore })
  }
  return rows.sort((a, b) => b.count - a.count).slice(0, limit)
}

export interface MediaAgg {
  mediaId: string
  name: string
  type: string
  count: number
  share: number
  sentiment: SentimentCounts
}

export function mediaRanking(news: NewsItem[], media: AppData['media'], limit = 10): MediaAgg[] {
  const total = news.length
  const byMedia = groupBy(news, (n) => n.mediaId)
  const mediaMap = new Map(media.map((m) => [m.id, m]))
  const rows: MediaAgg[] = []
  for (const [mediaId, items] of byMedia) {
    const m = mediaMap.get(mediaId)
    if (!m) continue
    rows.push({ mediaId, name: m.name, type: m.type, count: items.length, share: percentage(items.length, total), sentiment: sentimentBreakdown(items) })
  }
  return rows.sort((a, b) => b.count - a.count).slice(0, limit)
}

export interface InfluencerAgg {
  name: string
  count: number
  mainIssue: string
  sentimentLean: Sentiment
  matched: AppData['influencers'][number] | null
}

export function influencerRanking(news: NewsItem[], influencers: AppData['influencers'], issues: AppData['issues'], limit = 10): InfluencerAgg[] {
  const byActor = groupBy(news, (n) => n.actor)
  const influencerMap = new Map(influencers.map((i) => [i.name, i]))
  const issueMap = new Map(issues.map((i) => [i.id, i]))
  const rows: InfluencerAgg[] = []
  for (const [actor, items] of byActor) {
    if (!actor.trim()) continue // berita tanpa aktor tercatat (data pantauan nyata) tidak masuk peringkat
    const issueCounts = groupBy(items, (n) => n.issueId)
    let topIssueId = ''
    let topCount = 0
    for (const [issueId, arr] of issueCounts) {
      if (arr.length > topCount) {
        topCount = arr.length
        topIssueId = issueId
      }
    }
    const sb = sentimentBreakdown(items)
    const sentimentLean: Sentiment = sb.positive >= sb.negative && sb.positive >= sb.neutral ? 'Positive' : sb.negative >= sb.neutral ? 'Negative' : 'Neutral'
    rows.push({
      name: actor,
      count: items.length,
      mainIssue: issueMap.get(topIssueId)?.name ?? '—',
      sentimentLean,
      matched: influencerMap.get(actor) ?? null,
    })
  }
  return rows.sort((a, b) => b.count - a.count).slice(0, limit)
}

export interface CompanyAgg {
  companyId: string
  name: string
  shortName: string
  volume: number
  positive: number
  neutral: number
  negative: number
  reputationScore: number
  prValue: number
}

export function industryPlayers(news: NewsItem[], companies: AppData['companies']): CompanyAgg[] {
  const byCompany = groupBy(news.filter((n) => n.companyId), (n) => n.companyId as string)
  const companyMap = new Map(companies.map((c) => [c.id, c]))
  const rows: CompanyAgg[] = []
  for (const [companyId, items] of byCompany) {
    const c = companyMap.get(companyId)
    if (!c) continue
    const sb = sentimentBreakdown(items)
    const reputationScore = Math.round(50 + ((sb.positive - sb.negative) / items.length) * 50)
    rows.push({
      companyId,
      name: c.name,
      shortName: c.shortName,
      volume: items.length,
      positive: sb.positive,
      neutral: sb.neutral,
      negative: sb.negative,
      reputationScore,
      prValue: items.reduce((s, n) => s + n.prValue, 0),
    })
  }
  return rows.sort((a, b) => b.volume - a.volume)
}

export interface TrendPoint {
  date: string
  label: string
  total: number
  positive: number
  neutral: number
  negative: number
}

export function trendByDay(news: NewsItem[]): TrendPoint[] {
  const byDate = groupBy(news, (n) => n.date)
  const rows: TrendPoint[] = []
  for (const [date, items] of byDate) {
    const sb = sentimentBreakdown(items)
    rows.push({
      date,
      label: new Date(date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
      total: items.length,
      positive: sb.positive,
      neutral: sb.neutral,
      negative: sb.negative,
    })
  }
  return rows.sort((a, b) => (a.date < b.date ? -1 : 1))
}

export type RiskQuadrant = 'Monitor' | 'Watch' | 'Attention' | 'Critical'

export interface RiskMatrixPoint {
  issue: AppData['issues'][number]
  volume: number
  impact: number
  quadrant: RiskQuadrant
  sentiment: SentimentCounts
}

export function riskMatrix(news: NewsItem[], issues: AppData['issues']): RiskMatrixPoint[] {
  const agg = topIssues(news, issues, issues.length)
  if (agg.length === 0) return []
  const volumes = agg.map((a) => a.count)
  const medianVolume = [...volumes].sort((a, b) => a - b)[Math.floor(volumes.length / 2)]
  const medianImpact = 2.5
  return agg.map((a) => {
    const highVolume = a.count >= medianVolume
    const highImpact = a.impactScore >= medianImpact
    let quadrant: RiskQuadrant = 'Monitor'
    if (highVolume && highImpact) quadrant = 'Critical'
    else if (!highVolume && highImpact) quadrant = 'Watch'
    else if (highVolume && !highImpact) quadrant = 'Attention'
    return { issue: a.issue, volume: a.count, impact: a.impactScore, quadrant, sentiment: a.sentiment }
  })
}

export interface PrValueBreakdown {
  online: number
  print: number
  tv: number
  total: number
}

export function prValueBreakdown(news: NewsItem[]): PrValueBreakdown {
  let online = 0
  let print = 0
  let tv = 0
  for (const n of news) {
    if (n.mediaType === 'Online') online += n.prValue
    else if (n.mediaType === 'Cetak') print += n.prValue
    else tv += n.prValue
  }
  return { online, print, tv, total: online + print + tv }
}

export interface CompetitorBenchmarkRow {
  companyId: string
  name: string
  shortName: string
  newsVolume: number
  positivePct: number
  negativePct: number
  esgCoverage: number
  environmentCoverage: number
  prValue: number
  topIssue: string
}

export function competitorBenchmark(news: NewsItem[], companies: AppData['companies'], issues: AppData['issues']): CompetitorBenchmarkRow[] {
  const byCompany = groupBy(news.filter((n) => n.companyId), (n) => n.companyId as string)
  const rows: CompetitorBenchmarkRow[] = []
  for (const c of companies) {
    const items = byCompany.get(c.id) ?? []
    const sb = sentimentBreakdown(items)
    const esgCoverage = items.filter((n) => n.pillar === 'ESG').length
    const environmentCoverage = items.filter((n) => n.topics.some((t) => t.toLowerCase().includes('environment') || t.toLowerCase().includes('pollution') || t.toLowerCase().includes('damage'))).length
    const top = topIssues(items, issues, 1)[0]
    rows.push({
      companyId: c.id,
      name: c.name,
      shortName: c.shortName,
      newsVolume: items.length,
      positivePct: percentage(sb.positive, items.length || 1),
      negativePct: percentage(sb.negative, items.length || 1),
      esgCoverage,
      environmentCoverage,
      prValue: items.reduce((s, n) => s + n.prValue, 0),
      topIssue: top?.issue.name ?? '—',
    })
  }
  return rows.sort((a, b) => b.newsVolume - a.newsVolume)
}

/* ── Industry issue monitoring (non-corporate) ───────────────────────────
 * General issue-monitoring view of Industry-pillar coverage that is NOT tied
 * to a specific company (companyId === null): policy, production, downstreaming,
 * illegal mining, export rules, etc. Not a PR/comms lens — this tracks how each
 * issue is developing: coverage volume, recency, risk mix, sentiment, spread,
 * and a rule-derived monitoring status. */

export type MonitorPriority = 'Kritis' | 'Tinggi' | 'Sedang' | 'Rendah'

const RISK_ORDER: RiskLevel[] = ['Critical', 'High', 'Moderate', 'Low']

/** Recency window (days) counted back from the latest item in scope. */
const RECENT_WINDOW_DAYS = 21

function deriveMonitorStatus(maxRisk: RiskLevel, trend: Issue['trend']): { priority: MonitorPriority; rank: number } {
  if (maxRisk === 'Critical') return { priority: 'Kritis', rank: 4 }
  if (maxRisk === 'High') return { priority: 'Tinggi', rank: 3 }
  if (maxRisk === 'Moderate') return trend === 'up' ? { priority: 'Tinggi', rank: 3 } : { priority: 'Sedang', rank: 2 }
  return trend === 'up' ? { priority: 'Sedang', rank: 2 } : { priority: 'Rendah', rank: 1 }
}

export interface IssueWatchCluster {
  issue: Issue
  count: number
  recentCount: number
  sentiment: SentimentCounts
  risk: Record<RiskLevel, number>
  maxRisk: RiskLevel
  highRiskCount: number
  mediaCount: number
  stakeholderCount: number
  trend: Issue['trend']
  priority: MonitorPriority
  priorityRank: number
}

export interface IssueCategoryRollup {
  category: string
  count: number
  risk: Record<RiskLevel, number>
  /** Highest risk level present in this category's coverage; null when count === 0. */
  maxRisk: RiskLevel | null
  sentiment: SentimentCounts
}

export interface IssueMonitoringOverview {
  scope: NewsItem[]
  clusters: IssueWatchCluster[]
  /** One entry per issue category used by any Industry issue (the shared category set),
   *  rolled up over `scope`. Categories with no coverage in scope stay at zero. */
  categories: IssueCategoryRollup[]
  totalItems: number
  highRiskItems: number
  risingIssues: number
  recentCutoff: string | null
  sentiment: SentimentCounts
}

export function issueMonitoringOverview(news: NewsItem[], issues: Issue[]): IssueMonitoringOverview {
  const scope = news.filter((n) => n.pillar === 'Industry' && n.companyId === null)
  const latest = scope.reduce<string | null>((max, n) => (max === null || n.date > max ? n.date : max), null)
  let recentCutoff: string | null = null
  if (latest) {
    const d = new Date(latest)
    d.setDate(d.getDate() - RECENT_WINDOW_DAYS)
    recentCutoff = d.toISOString().slice(0, 10)
  }

  const issueMap = new Map(issues.map((i) => [i.id, i]))
  const clusters: IssueWatchCluster[] = []
  for (const [issueId, items] of groupBy(scope, (n) => n.issueId)) {
    const issue = issueMap.get(issueId)
    if (!issue) continue
    const risk: Record<RiskLevel, number> = { Low: 0, Moderate: 0, High: 0, Critical: 0 }
    for (const n of items) risk[n.risk]++
    const maxRisk = RISK_ORDER.find((r) => risk[r] > 0) ?? 'Low'
    const { priority, rank } = deriveMonitorStatus(maxRisk, issue.trend)
    clusters.push({
      issue,
      count: items.length,
      recentCount: recentCutoff ? items.filter((n) => n.date >= recentCutoff!).length : 0,
      sentiment: sentimentBreakdown(items),
      risk,
      maxRisk,
      highRiskCount: risk.High + risk.Critical,
      mediaCount: new Set(items.map((n) => n.mediaId)).size,
      stakeholderCount: new Set(items.flatMap((n) => n.stakeholders)).size,
      trend: issue.trend,
      priority,
      priorityRank: rank,
    })
  }
  clusters.sort((a, b) => b.priorityRank - a.priorityRank || b.count - a.count)

  // Shared category set: every category used by an Industry-pillar issue (used by all
  // issue-per-category widgets on this page so they stay in sync). Rolled up over scope.
  const emptyRisk = (): Record<RiskLevel, number> => ({ Low: 0, Moderate: 0, High: 0, Critical: 0 })
  const categoryMap = new Map<string, IssueCategoryRollup>()
  for (const i of issues) {
    if (i.pillar === 'Industry' && !categoryMap.has(i.category)) {
      categoryMap.set(i.category, { category: i.category, count: 0, risk: emptyRisk(), maxRisk: null, sentiment: { positive: 0, neutral: 0, negative: 0, total: 0 } })
    }
  }
  for (const c of clusters) {
    const entry = categoryMap.get(c.issue.category)
    if (!entry) continue
    entry.count += c.count
    entry.risk.Low += c.risk.Low
    entry.risk.Moderate += c.risk.Moderate
    entry.risk.High += c.risk.High
    entry.risk.Critical += c.risk.Critical
    entry.sentiment.positive += c.sentiment.positive
    entry.sentiment.neutral += c.sentiment.neutral
    entry.sentiment.negative += c.sentiment.negative
    entry.sentiment.total += c.sentiment.total
  }
  for (const entry of categoryMap.values()) {
    entry.maxRisk = RISK_ORDER.find((r) => entry.risk[r] > 0) ?? null
  }
  const categories = [...categoryMap.values()].sort((a, b) => b.count - a.count || a.category.localeCompare(b.category))

  return {
    scope,
    clusters,
    categories,
    totalItems: scope.length,
    highRiskItems: scope.filter((n) => n.risk === 'High' || n.risk === 'Critical').length,
    risingIssues: clusters.filter((c) => c.trend === 'up').length,
    recentCutoff,
    sentiment: sentimentBreakdown(scope),
  }
}

export function uniqueRegions(news: NewsItem[]): string[] {
  return Array.from(new Set(news.map((n) => n.location))).sort()
}

export function issueDetail(issueId: string, news: NewsItem[], issues: AppData['issues'], media: AppData['media'], influencers: AppData['influencers'], companies: AppData['companies']) {
  const issue = issues.find((i) => i.id === issueId) ?? null
  const relatedNews = news.filter((n) => n.issueId === issueId).sort((a, b) => (a.date < b.date ? 1 : -1))
  const timeline = trendByDay(relatedNews)
  const mediaAgg = mediaRanking(relatedNews, media, 20)
  const influencerAgg = influencerRanking(relatedNews, influencers, issues, 20)
  const companyIds = new Set(relatedNews.map((n) => n.companyId).filter(Boolean) as string[])
  const relatedCompanies = companies.filter((c) => companyIds.has(c.id))
  return { issue, relatedNews, timeline, mediaAgg, influencerAgg, relatedCompanies }
}
