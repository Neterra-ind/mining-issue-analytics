import { useEffect, useState } from 'react'
import type { EsgFrame, MediaType, NewsItem, Pillar, PolicyStatus, RiskLevel, Sentiment } from '@/types'
import { useData } from '@/lib/store'
import { ESG_FRAMES, MAX_RELATED_PILLARS, PILLARS, POLICY_STATUSES, PRIMARY_COMPANY_ID, normalizeRelatedPillars } from '@/lib/boundaries'
import { Modal } from '@/components/ui/Modal'

interface FormState {
  title: string
  url: string
  summary: string
  date: string
  mediaId: string
  companyId: string
  pillar: Pillar
  relatedPillars: Pillar[]
  policyStatus: PolicyStatus | ''
  esgFrame: EsgFrame | ''
  topics: string
  issueId: string
  location: string
  actor: string
  stakeholders: string
  sentiment: Sentiment
  risk: RiskLevel
  program: string
  prValue: string
}

function toFormState(news: NewsItem | null): FormState {
  if (!news) {
    return {
      title: '',
      url: '',
      summary: '',
      date: new Date().toISOString().slice(0, 10),
      mediaId: '',
      companyId: '',
      pillar: 'Industry',
      relatedPillars: [],
      policyStatus: '',
      esgFrame: '',
      topics: '',
      issueId: '',
      location: '',
      actor: '',
      stakeholders: '',
      sentiment: 'Neutral',
      risk: 'Low',
      program: '',
      prValue: '10000000',
    }
  }
  return {
    title: news.title,
    url: news.url,
    summary: news.summary,
    date: news.date,
    mediaId: news.mediaId,
    companyId: news.companyId ?? '',
    pillar: news.pillar,
    relatedPillars: normalizeRelatedPillars(news.pillar, news.relatedPillars),
    policyStatus: news.policyStatus ?? '',
    esgFrame: news.esgFrame ?? '',
    topics: news.topics.join(', '),
    issueId: news.issueId,
    location: news.location,
    actor: news.actor,
    stakeholders: news.stakeholders.join(', '),
    sentiment: news.sentiment,
    risk: news.risk,
    program: news.program ?? '',
    prValue: String(news.prValue),
  }
}

const inputClass = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100'
const labelClass = 'mb-1 block text-xs font-medium text-slate-500'

export function NewsFormModal({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  initial: NewsItem | null
  onSaved: () => void
}) {
  const { data, addNews, updateNews } = useData()
  const [form, setForm] = useState<FormState>(() => toFormState(initial))

  useEffect(() => {
    if (open) setForm(toFormState(initial))
  }, [open, initial])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const canHavePolicyStatus = form.pillar === 'Industry'
  const canHaveEsgFrame = form.pillar === 'ESG' && form.companyId === PRIMARY_COMPANY_ID

  function toggleRelated(p: Pillar) {
    setForm((prev) => {
      const has = prev.relatedPillars.includes(p)
      const next = has ? prev.relatedPillars.filter((x) => x !== p) : [...prev.relatedPillars, p]
      return { ...prev, relatedPillars: normalizeRelatedPillars(prev.pillar, next) }
    })
  }

  function handleSubmit() {
    if (!form.title.trim() || !form.mediaId || !form.issueId) return
    const media = data.media.find((m) => m.id === form.mediaId)
    const payload = {
      title: form.title.trim(),
      url: form.url.trim() || '#',
      summary: form.summary.trim(),
      date: form.date,
      mediaId: form.mediaId,
      mediaType: media?.type ?? ('Online' as MediaType),
      companyId: form.companyId || null,
      pillar: form.pillar,
      relatedPillars: normalizeRelatedPillars(form.pillar, form.relatedPillars),
      policyStatus: canHavePolicyStatus && form.policyStatus ? form.policyStatus : undefined,
      esgFrame: canHaveEsgFrame && form.esgFrame ? form.esgFrame : undefined,
      topics: form.topics.split(',').map((t) => t.trim()).filter(Boolean),
      issueId: form.issueId,
      location: form.location.trim() || 'Nasional',
      actor: form.actor.trim() || 'Tidak diketahui',
      stakeholders: form.stakeholders.split(',').map((t) => t.trim()).filter(Boolean),
      sentiment: form.sentiment,
      risk: form.risk,
      program: form.program.trim() || null,
      prValue: Number(form.prValue) || 0,
    }
    if (initial) updateNews(initial.id, payload)
    else addNews(payload)
    onSaved()
  }

  const relevantIssues = data.issues.filter((i) => i.pillar === form.pillar)

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Edit Berita' : 'Tambah Berita'}
      size="lg"
      footer={
        <>
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            Batal
          </button>
          <button onClick={handleSubmit} className="rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700">
            {initial ? 'Simpan Perubahan' : 'Tambah Berita'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>Headline</label>
          <input className={inputClass} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="Judul berita" />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Ringkasan</label>
          <textarea className={inputClass} rows={3} value={form.summary} onChange={(e) => set('summary', e.target.value)} placeholder="Ringkasan isi berita" />
        </div>
        <div>
          <label className={labelClass}>Tanggal</label>
          <input type="date" className={inputClass} value={form.date} onChange={(e) => set('date', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>URL</label>
          <input className={inputClass} value={form.url} onChange={(e) => set('url', e.target.value)} placeholder="https://…" />
        </div>
        <div>
          <label className={labelClass}>Media</label>
          <select className={inputClass} value={form.mediaId} onChange={(e) => set('mediaId', e.target.value)}>
            <option value="">Pilih media…</option>
            {data.media.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} ({m.type})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Company</label>
          <select className={inputClass} value={form.companyId} onChange={(e) => set('companyId', e.target.value)}>
            <option value="">Tidak spesifik</option>
            {data.companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shortName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Pilar utama (dihitung di KPI)</label>
          <select
            className={inputClass}
            value={form.pillar}
            onChange={(e) => {
              const pillar = e.target.value as Pillar
              setForm((prev) => ({ ...prev, pillar, relatedPillars: normalizeRelatedPillars(pillar, prev.relatedPillars), issueId: '' }))
            }}
          >
            <option value="Industry">Industry</option>
            <option value="ESG">ESG</option>
            <option value="Corporate">Corporate</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Issue</label>
          <select className={inputClass} value={form.issueId} onChange={(e) => set('issueId', e.target.value)}>
            <option value="">Pilih issue…</option>
            {relevantIssues.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Pilar terkait (maks. {MAX_RELATED_PILLARS}, tidak dihitung di KPI)</label>
          <div className="flex flex-wrap gap-3 pt-1">
            {PILLARS.filter((p) => p !== form.pillar).map((p) => (
              <label key={p} className="inline-flex items-center gap-1.5 text-sm text-slate-700">
                <input type="checkbox" checked={form.relatedPillars.includes(p)} onChange={() => toggleRelated(p)} />
                {p}
              </label>
            ))}
          </div>
        </div>
        {canHavePolicyStatus && (
          <div>
            <label className={labelClass}>Status kebijakan (jika berita regulasi)</label>
            <select className={inputClass} value={form.policyStatus} onChange={(e) => set('policyStatus', e.target.value as PolicyStatus | '')}>
              <option value="">Bukan berita kebijakan</option>
              {POLICY_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
        {canHaveEsgFrame && (
          <div>
            <label className={labelClass}>Bingkai ESG terhadap PT AR</label>
            <select className={inputClass} value={form.esgFrame} onChange={(e) => set('esgFrame', e.target.value as EsgFrame | '')}>
              <option value="">Belum ditentukan</option>
              {ESG_FRAMES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="col-span-2">
          <label className={labelClass}>Topic (pisahkan dengan koma)</label>
          <input className={inputClass} value={form.topics} onChange={(e) => set('topics', e.target.value)} placeholder="Environment, ESG Reporting" />
        </div>
        <div>
          <label className={labelClass}>Lokasi</label>
          <input className={inputClass} value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="Batang Toru" />
        </div>
        <div>
          <label className={labelClass}>Actor</label>
          <input className={inputClass} value={form.actor} onChange={(e) => set('actor', e.target.value)} placeholder="Nama narasumber" />
        </div>
        <div className="col-span-2">
          <label className={labelClass}>Stakeholder (pisahkan dengan koma)</label>
          <input className={inputClass} value={form.stakeholders} onChange={(e) => set('stakeholders', e.target.value)} placeholder="Pemerintah Daerah, LSM" />
        </div>
        <div>
          <label className={labelClass}>Sentiment</label>
          <select className={inputClass} value={form.sentiment} onChange={(e) => set('sentiment', e.target.value as Sentiment)}>
            <option value="Positive">Positive</option>
            <option value="Neutral">Neutral</option>
            <option value="Negative">Negative</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Risk</label>
          <select className={inputClass} value={form.risk} onChange={(e) => set('risk', e.target.value as RiskLevel)}>
            <option value="Low">Low</option>
            <option value="Moderate">Moderate</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Program (opsional)</label>
          <input className={inputClass} value={form.program} onChange={(e) => set('program', e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>PR Value (Rp)</label>
          <input type="number" className={inputClass} value={form.prValue} onChange={(e) => set('prValue', e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}
