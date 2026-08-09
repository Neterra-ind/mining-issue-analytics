export type Sentiment = 'Positive' | 'Neutral' | 'Negative'

export type RiskLevel = 'Low' | 'Moderate' | 'High' | 'Critical'

export type MediaType = 'Online' | 'Cetak' | 'TV'

export type MediaTier = 'Tier 1' | 'Tier 2' | 'Tier 3'

/** Which of the three report engines a piece of content primarily belongs to. */
export type Pillar = 'Industry' | 'ESG' | 'Corporate'

export type InfluencerScope = 'Internal' | 'External'

export interface TaxonomyCategory {
  id: string
  pillar: Pillar
  /** Grouping shown as a section on the Taxonomy editor, e.g. "Industry Issues", "Biodiversity". */
  group: string
  label: string
  order: number
}

export interface Company {
  id: string
  name: string
  shortName: string
  sector: string
  isPrimary?: boolean
  accentColor: string
}

export interface MediaOutlet {
  id: string
  name: string
  type: MediaType
  tier: MediaTier
}

export interface Influencer {
  id: string
  name: string
  position: string
  organization: string
  scope: InfluencerScope
  category: string
}

export interface Issue {
  id: string
  name: string
  pillar: Pillar
  category: string
  description: string
  riskLevel: RiskLevel
  trend: 'up' | 'down' | 'stable'
}

export interface NewsItem {
  id: string
  date: string
  mediaId: string
  mediaType: MediaType
  title: string
  url: string
  summary: string
  companyId: string | null
  pillar: Pillar
  topics: string[]
  issueId: string
  location: string
  actor: string
  stakeholders: string[]
  sentiment: Sentiment
  risk: RiskLevel
  program: string | null
  prValue: number
}

export interface DashboardConfigMap {
  [key: string]: string
}

export interface AppData {
  news: NewsItem[]
  companies: Company[]
  media: MediaOutlet[]
  influencers: Influencer[]
  issues: Issue[]
  taxonomy: TaxonomyCategory[]
  dashboardConfig: DashboardConfigMap
}

export interface GlobalFilters {
  dateFrom: string
  dateTo: string
  pillar: Pillar | 'All'
  companyId: string | 'All'
  region: string | 'All'
  mediaType: MediaType | 'All'
}
