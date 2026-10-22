import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { AppData, Company, Influencer, MediaOutlet, NewsItem, TaxonomyCategory } from '@/types'
import { newsSeed } from '@/data/news'
import { companiesSeed, influencersSeed, issuesSeed, mediaSeed } from '@/data/entities'
import { taxonomySeed } from '@/data/taxonomy'
import { INCLUDE_DEMO_NEWS, ptarIssues, ptarMedia, ptarNews } from '@/data/ptarReal'
import { uid } from '@/lib/utils'

// v3: menambahkan data berita nyata PT AR (src/data/ptarReal.ts).
// v2: data seed mengikuti batasan konsep (pilar terkait, status kebijakan, bingkai ESG).
const STORAGE_KEY = 'midash:v3'
const LEGACY_KEYS = ['midash:v1', 'midash:v2']

function freshSeed(): AppData {
  return {
    news: structuredClone(INCLUDE_DEMO_NEWS ? [...ptarNews, ...newsSeed] : ptarNews),
    companies: structuredClone(companiesSeed),
    media: structuredClone(INCLUDE_DEMO_NEWS ? [...mediaSeed, ...ptarMedia] : ptarMedia),
    influencers: structuredClone(influencersSeed),
    issues: structuredClone(INCLUDE_DEMO_NEWS ? [...issuesSeed, ...ptarIssues] : ptarIssues),
    taxonomy: structuredClone(taxonomySeed),
    dashboardConfig: {},
  }
}

/** Seed baru, tetapi teks yang sudah diedit pengguna (dashboardConfig) dari versi lama tetap dibawa. */
function migrateLegacy(): AppData {
  const seed = freshSeed()
  for (const key of LEGACY_KEYS) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const legacy = JSON.parse(raw) as Partial<AppData>
      if (legacy.dashboardConfig) seed.dashboardConfig = legacy.dashboardConfig
      localStorage.removeItem(key)
    } catch {
      // abaikan data lama yang rusak
    }
  }
  return seed
}

function loadInitial(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return migrateLegacy()
    const parsed = JSON.parse(raw) as AppData
    if (!parsed.news || !parsed.companies) return freshSeed()
    return parsed
  } catch {
    return freshSeed()
  }
}

interface DataContextValue {
  data: AppData
  editMode: boolean
  setEditMode: (v: boolean) => void
  saveChanges: () => void
  resetDemo: () => void

  addNews: (item: Omit<NewsItem, 'id'>) => void
  updateNews: (id: string, patch: Partial<NewsItem>) => void
  deleteNews: (id: string) => void

  addCompany: (item: Omit<Company, 'id'>) => void
  updateCompany: (id: string, patch: Partial<Company>) => void
  deleteCompany: (id: string) => void

  addMedia: (item: Omit<MediaOutlet, 'id'>) => void
  updateMedia: (id: string, patch: Partial<MediaOutlet>) => void
  deleteMedia: (id: string) => void

  addInfluencer: (item: Omit<Influencer, 'id'>) => void
  updateInfluencer: (id: string, patch: Partial<Influencer>) => void
  deleteInfluencer: (id: string) => void

  addTaxonomy: (item: Omit<TaxonomyCategory, 'id'>) => void
  updateTaxonomy: (id: string, patch: Partial<TaxonomyCategory>) => void
  deleteTaxonomy: (id: string) => void
  reorderTaxonomy: (group: string, orderedIds: string[]) => void

  getConfig: (key: string, fallback: string) => string
  setConfig: (key: string, value: string) => void
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadInitial)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }, [data])

  const value = useMemo<DataContextValue>(() => {
    function saveChanges() {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    }

    function resetDemo() {
      localStorage.removeItem(STORAGE_KEY)
      setData(freshSeed())
      setEditMode(false)
    }

    function addNews(item: Omit<NewsItem, 'id'>) {
      setData((prev) => ({ ...prev, news: [{ ...item, id: uid('nws') }, ...prev.news] }))
    }
    function updateNews(id: string, patch: Partial<NewsItem>) {
      setData((prev) => ({ ...prev, news: prev.news.map((n) => (n.id === id ? { ...n, ...patch } : n)) }))
    }
    function deleteNews(id: string) {
      setData((prev) => ({ ...prev, news: prev.news.filter((n) => n.id !== id) }))
    }

    function addCompany(item: Omit<Company, 'id'>) {
      setData((prev) => ({ ...prev, companies: [...prev.companies, { ...item, id: uid('co') }] }))
    }
    function updateCompany(id: string, patch: Partial<Company>) {
      setData((prev) => ({ ...prev, companies: prev.companies.map((c) => (c.id === id ? { ...c, ...patch } : c)) }))
    }
    function deleteCompany(id: string) {
      setData((prev) => ({ ...prev, companies: prev.companies.filter((c) => c.id !== id) }))
    }

    function addMedia(item: Omit<MediaOutlet, 'id'>) {
      setData((prev) => ({ ...prev, media: [...prev.media, { ...item, id: uid('md') }] }))
    }
    function updateMedia(id: string, patch: Partial<MediaOutlet>) {
      setData((prev) => ({ ...prev, media: prev.media.map((m) => (m.id === id ? { ...m, ...patch } : m)) }))
    }
    function deleteMedia(id: string) {
      setData((prev) => ({ ...prev, media: prev.media.filter((m) => m.id !== id) }))
    }

    function addInfluencer(item: Omit<Influencer, 'id'>) {
      setData((prev) => ({ ...prev, influencers: [...prev.influencers, { ...item, id: uid('inf') }] }))
    }
    function updateInfluencer(id: string, patch: Partial<Influencer>) {
      setData((prev) => ({ ...prev, influencers: prev.influencers.map((i) => (i.id === id ? { ...i, ...patch } : i)) }))
    }
    function deleteInfluencer(id: string) {
      setData((prev) => ({ ...prev, influencers: prev.influencers.filter((i) => i.id !== id) }))
    }

    function addTaxonomy(item: Omit<TaxonomyCategory, 'id'>) {
      setData((prev) => ({ ...prev, taxonomy: [...prev.taxonomy, { ...item, id: uid('tax') }] }))
    }
    function updateTaxonomy(id: string, patch: Partial<TaxonomyCategory>) {
      setData((prev) => ({ ...prev, taxonomy: prev.taxonomy.map((t) => (t.id === id ? { ...t, ...patch } : t)) }))
    }
    function deleteTaxonomy(id: string) {
      setData((prev) => ({ ...prev, taxonomy: prev.taxonomy.filter((t) => t.id !== id) }))
    }
    function reorderTaxonomy(group: string, orderedIds: string[]) {
      setData((prev) => ({
        ...prev,
        taxonomy: prev.taxonomy.map((t) => {
          if (t.group !== group) return t
          const idx = orderedIds.indexOf(t.id)
          return idx === -1 ? t : { ...t, order: idx + 1 }
        }),
      }))
    }

    function getConfig(key: string, fallback: string) {
      return data.dashboardConfig[key] ?? fallback
    }
    function setConfig(key: string, val: string) {
      setData((prev) => ({ ...prev, dashboardConfig: { ...prev.dashboardConfig, [key]: val } }))
    }

    return {
      data,
      editMode,
      setEditMode,
      saveChanges,
      resetDemo,
      addNews,
      updateNews,
      deleteNews,
      addCompany,
      updateCompany,
      deleteCompany,
      addMedia,
      updateMedia,
      deleteMedia,
      addInfluencer,
      updateInfluencer,
      deleteInfluencer,
      addTaxonomy,
      updateTaxonomy,
      deleteTaxonomy,
      reorderTaxonomy,
      getConfig,
      setConfig,
    }
  }, [data, editMode])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData harus dipakai di dalam DataProvider')
  return ctx
}
