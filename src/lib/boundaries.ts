/* ── Batasan konsep dashboard ─────────────────────────────────────────────
 * Satu sumber untuk definisi, aturan hitung, dan validasi batasan:
 *  - Objek: PT AR dan sektor pertambangan emas.
 *  - Sumber: hanya media massa (Online, Cetak, TV).
 *  - Satu berita / isu = satu pilar utama + maks. 2 pilar terkait.
 *  - KPI hanya menghitung pilar utama, sehingga tidak ada hitung ganda. */
import type { AppData, Company, EsgFrame, MediaType, NewsItem, Pillar, PolicyStatus } from '@/types'
import { groupBy } from '@/lib/utils'

export const PILLARS: Pillar[] = ['Industry', 'ESG', 'Corporate']
export const MAX_RELATED_PILLARS = 2
export const MEDIA_TYPES: MediaType[] = ['Online', 'Cetak', 'TV']
export const PRIMARY_COMPANY_ID = 'co-ptar'

/** Urutan prioritas penentuan pilar utama saat sebuah berita/isu memenuhi lebih dari satu kriteria. */
export const PILLAR_PRIORITY: Pillar[] = ['Industry', 'ESG', 'Corporate']

export const POLICY_STATUSES: PolicyStatus[] = ['Resmi', 'Draf', 'Wacana']
export const ESG_FRAMES: EsgFrame[] = ['Teladan', 'Bagian masalah sektor', 'Tertuduh']

/** Pilar terkait yang valid: unik, tanpa pilar utama, maksimal dua. */
export function normalizeRelatedPillars(primary: Pillar, related: Pillar[] | undefined): Pillar[] {
  return PILLARS.filter((p) => p !== primary && (related ?? []).includes(p)).slice(0, MAX_RELATED_PILLARS)
}

/** Perusahaan dalam objek: PT AR atau pelaku sektor tambang emas. */
export function isCompanyInScope(company: Company): boolean {
  return company.id === PRIMARY_COMPANY_ID || /emas/i.test(company.sector)
}

/** Pilar utama isu = pilar utama terbanyak di antara berita anggotanya; seri diputus dengan PILLAR_PRIORITY. */
export function dominantPillar(items: NewsItem[]): Pillar | null {
  if (items.length === 0) return null
  const counts = new Map<Pillar, number>()
  for (const n of items) counts.set(n.pillar, (counts.get(n.pillar) ?? 0) + 1)
  return [...PILLAR_PRIORITY].sort((a, b) => (counts.get(b) ?? 0) - (counts.get(a) ?? 0))[0]
}

/* ── Aturan hitung ─────────────────────────────────────────────────────── */

export interface PillarAccountingRow {
  pillar: Pillar
  /** Dihitung di KPI. */
  primary: number
  /** Hanya label & filter — tidak dijumlahkan ke KPI. */
  related: number
}

export interface PillarAccounting {
  rows: PillarAccountingRow[]
  total: number
  sumPrimary: number
  /** Jumlah KPI ketiga pilar harus sama dengan total berita. */
  balanced: boolean
  /** Berapa kali total akan membengkak jika pilar terkait ikut dihitung. */
  wouldDoubleCount: number
}

export function pillarAccounting(news: NewsItem[]): PillarAccounting {
  const rows = PILLARS.map<PillarAccountingRow>((pillar) => ({
    pillar,
    primary: news.filter((n) => n.pillar === pillar).length,
    related: news.filter((n) => normalizeRelatedPillars(n.pillar, n.relatedPillars).includes(pillar)).length,
  }))
  const sumPrimary = rows.reduce((s, r) => s + r.primary, 0)
  return {
    rows,
    total: news.length,
    sumPrimary,
    balanced: sumPrimary === news.length,
    wouldDoubleCount: rows.reduce((s, r) => s + r.related, 0),
  }
}

/* ── Validasi batasan ──────────────────────────────────────────────────── */

export type ViolationKind = 'pilar-terkait' | 'isu' | 'pilar-isu' | 'objek' | 'sumber' | 'status-kebijakan' | 'bingkai-esg'

export interface BoundaryViolation {
  kind: ViolationKind
  targetId: string
  targetLabel: string
  message: string
}

export const VIOLATION_LABEL: Record<ViolationKind, string> = {
  'pilar-terkait': 'Pilar terkait',
  isu: 'Isu induk',
  'pilar-isu': 'Pilar isu',
  objek: 'Objek',
  sumber: 'Sumber',
  'status-kebijakan': 'Status kebijakan',
  'bingkai-esg': 'Bingkai ESG',
}

export function boundaryViolations(data: Pick<AppData, 'news' | 'issues' | 'companies' | 'media'>): BoundaryViolation[] {
  const out: BoundaryViolation[] = []
  const issueMap = new Map(data.issues.map((i) => [i.id, i]))
  const companyMap = new Map(data.companies.map((c) => [c.id, c]))
  const mediaMap = new Map(data.media.map((m) => [m.id, m]))

  for (const n of data.news) {
    const label = n.title
    const related = n.relatedPillars ?? []
    if (related.includes(n.pillar)) out.push({ kind: 'pilar-terkait', targetId: n.id, targetLabel: label, message: `Pilar terkait memuat pilar utama (${n.pillar}).` })
    if (new Set(related).size > MAX_RELATED_PILLARS) out.push({ kind: 'pilar-terkait', targetId: n.id, targetLabel: label, message: `Pilar terkait lebih dari ${MAX_RELATED_PILLARS}.` })

    if (!issueMap.has(n.issueId)) out.push({ kind: 'isu', targetId: n.id, targetLabel: label, message: 'Berita belum masuk isu induk yang terdaftar.' })

    const media = mediaMap.get(n.mediaId)
    if (!media || !MEDIA_TYPES.includes(n.mediaType)) out.push({ kind: 'sumber', targetId: n.id, targetLabel: label, message: 'Sumber bukan media massa terdaftar (Online, Cetak, TV).' })

    if (n.companyId) {
      const company = companyMap.get(n.companyId)
      if (company && !isCompanyInScope(company)) out.push({ kind: 'objek', targetId: n.id, targetLabel: label, message: `${company.shortName} bukan pelaku sektor tambang emas.` })
    }

    if (n.policyStatus && n.pillar !== 'Industry') out.push({ kind: 'status-kebijakan', targetId: n.id, targetLabel: label, message: 'Status kebijakan hanya berlaku untuk pilar utama Industry.' })
    if (n.esgFrame && (n.pillar !== 'ESG' || n.companyId !== PRIMARY_COMPANY_ID)) out.push({ kind: 'bingkai-esg', targetId: n.id, targetLabel: label, message: 'Bingkai ESG hanya untuk berita ESG yang menyebut PT AR.' })
  }

  const byIssue = groupBy(data.news, (n) => n.issueId)
  for (const issue of data.issues) {
    const related = issue.relatedPillars ?? []
    if (related.includes(issue.pillar) || new Set(related).size > MAX_RELATED_PILLARS) {
      out.push({ kind: 'pilar-terkait', targetId: issue.id, targetLabel: issue.name, message: 'Pilar terkait isu tidak valid.' })
    }
    const dominant = dominantPillar(byIssue.get(issue.id) ?? [])
    if (dominant && dominant !== issue.pillar) {
      out.push({ kind: 'pilar-isu', targetId: issue.id, targetLabel: issue.name, message: `Pilar isu ${issue.pillar}, tetapi mayoritas beritanya berpilar utama ${dominant}.` })
    }
  }
  return out
}

/* ── Bingkai ESG & status kebijakan ────────────────────────────────────── */

export function esgFrameBreakdown(news: NewsItem[]): Record<EsgFrame, number> {
  const out: Record<EsgFrame, number> = { Teladan: 0, 'Bagian masalah sektor': 0, Tertuduh: 0 }
  for (const n of news) if (n.esgFrame && n.pillar === 'ESG') out[n.esgFrame]++
  return out
}

export function policyStatusBreakdown(news: NewsItem[]): Record<PolicyStatus, number> {
  const out: Record<PolicyStatus, number> = { Resmi: 0, Draf: 0, Wacana: 0 }
  for (const n of news) if (n.policyStatus && n.pillar === 'Industry') out[n.policyStatus]++
  return out
}

/* ── Konten definisi (ditampilkan di halaman Batasan & Definisi) ───────── */

export const CONCEPT = {
  summary:
    'Dashboard ini memantau pemberitaan media massa tentang PT Agincourt Resources (tambang emas Martabe) dan sektornya, lalu mengubahnya menjadi isu yang bisa diputuskan manajemen.',
  disclaimer: 'Cermin pemberitaan, bukan verifikasi lapangan.',
}

export const SCOPE_ROWS: { aspect: string; included: string; excluded: string }[] = [
  {
    aspect: 'Objek',
    included: 'PT AR (tambang emas Martabe) dan sektor pertambangan emas tempat PT AR beroperasi.',
    excluded: 'Komoditas lain (nikel, batubara, timah), kecuali kebijakan lintas komoditas yang juga berlaku untuk emas (UU Minerba, RKAB, penertiban kawasan hutan, bea keluar).',
  },
  {
    aspect: 'Sumber',
    included: 'Media massa online, cetak, dan TV yang dikumpulkan crawler.',
    excluded: 'Media sosial, forum, rilis internal, laporan lapangan, dan dokumen regulator yang tidak diberitakan. Rilis PT AR baru dihitung kalau dimuat media.',
  },
  {
    aspect: 'Sifat data',
    included: 'Apa yang diberitakan media.',
    excluded: 'Kebenaran klaim. Dashboard tidak menilai klaim benar atau salah, dan volume berita tidak menggambarkan besarnya dampak di lapangan.',
  },
  { aspect: 'Pengguna', included: 'Manajemen PT AR.', excluded: 'Publik, regulator, atau pihak luar.' },
  { aspect: 'Aktor & influencer', included: 'Tokoh yang dikutip atau diberitakan media.', excluded: 'Akun media sosial dan buzzer.' },
]

export const COUNTING_RULES: string[] = [
  'Setiap berita masuk ke tepat satu isu induk, yaitu kumpulan berita tentang peristiwa atau perdebatan yang sama.',
  'Setiap berita dan isu punya tepat 1 pilar utama dan paling banyak 2 pilar terkait.',
  'KPI (volume, nada, pangsa, PR Value) hanya dihitung dari pilar utama. Pilar terkait hanya dipakai sebagai label dan filter.',
  'Jumlah KPI ketiga pilar harus sama dengan total berita.',
  'Pilar utama isu = pilar utama terbanyak di antara berita anggotanya. Jika seri, pakai urutan prioritas.',
]

export interface AnalysisItem {
  label: string
  proposal: boolean
}

export interface PillarDefinition {
  pillar: Pillar
  name: string
  definition: string
  includes: string[]
  excludes: string
  question: string
  analyses: AnalysisItem[]
}

export const PILLAR_DEFINITIONS: PillarDefinition[] = [
  {
    pillar: 'Industry',
    name: 'Industri Tambang',
    definition: 'Pemberitaan tentang lingkungan eksternal PT AR: aturan, tindakan negara, pasar, dan sektor.',
    includes: [
      'Kebijakan dan regulasi (izin, RKAB, bea keluar, hilirisasi)',
      'Tindakan negara (pencabutan izin, penertiban kawasan, sanksi, gugatan)',
      'Harga emas, investasi, dan target produksi',
      'Kejadian di tambang lain dan pesaing',
      'Penambangan ilegal dan penegakan hukum',
      'Riset akademisi tentang sektor tambang',
    ],
    excludes: 'Dampak lingkungan dan klaim LSM (ESG), serta citra dan program PT AR (Corporate).',
    question: 'Apa yang berubah di sekitar kami?',
    analyses: [
      { label: 'Radar kebijakan dan regulasi (Resmi, Draf, Wacana)', proposal: false },
      { label: 'Lini masa tindakan negara dan tahap eskalasinya', proposal: false },
      { label: 'Peta aktor kebijakan', proposal: false },
      { label: 'Pasar dan harga komoditas', proposal: true },
      { label: 'Pembandingan dengan pesaing', proposal: true },
      { label: 'Penambangan ilegal dan penegakan hukum', proposal: true },
    ],
  },
  {
    pillar: 'ESG',
    name: 'ESG',
    definition: 'Pemberitaan tentang dampak dan klaim lingkungan, sosial, dan tata kelola, serta cara media membingkai PT AR di dalamnya.',
    includes: [
      'Lingkungan (pencemaran, kerusakan sungai dan DAS, degradasi lahan, deforestasi, banjir)',
      'Biodiversitas (orangutan Tapanuli, habitat, konservasi)',
      'Penerapan ESG (pelaporan, kepatuhan, penghargaan, tuduhan greenwashing)',
      'Klaim dan bantahan antara LSM, regulator, dan perusahaan',
      'Makna ESG di Indonesia',
      'Cakupan B: isu sosial dan tata kelola yang berbingkai ESG',
    ],
    excludes: 'Kebijakan dan keputusan negara (Industry), serta program CSR dan komunitas (Corporate pada cakupan A).',
    question: 'Apa dampak kami, dan bagaimana publik dan media membingkainya?',
    analyses: [
      { label: 'ESG sebagai konsep: kewajiban regulasi, tuntutan pasar global, atau agenda asing', proposal: false },
      { label: 'ESG di sektor tambang: tambang hijau vs greenwashing, hilirisasi vs deforestasi', proposal: false },
      { label: 'ESG yang melekat pada perusahaan: Teladan, Bagian masalah sektor, Tertuduh', proposal: false },
      { label: 'Klaim dan bantahan', proposal: false },
      { label: 'Topik lingkungan dan biodiversitas', proposal: false },
      { label: 'Peta wilayah dampak', proposal: true },
    ],
  },
  {
    pillar: 'Corporate',
    name: 'Corporate',
    definition: 'Pemberitaan tentang PT AR sebagai organisasi: reputasi, hubungan dengan pemangku kepentingan, dan komunikasi di luar perdebatan ESG.',
    includes: [
      'Kinerja dan operasi dari sudut citra',
      'Hubungan dengan pemerintah pusat dan daerah',
      'Komunitas lingkar tambang, CSR, pendidikan, UMKM',
      'Hubungan media dan juru bicara',
      'Penghargaan',
      'Program PT AR',
    ],
    excludes: 'Kebijakan dan pasar sektor (Industry), serta dampak lingkungan dan klaim LSM (ESG).',
    question: 'Bagaimana PT AR dipandang, oleh siapa, dan bagaimana kami merespons?',
    analyses: [
      { label: 'Nada dan pangsa media (online, cetak, TV; lokal dan nasional)', proposal: false },
      { label: 'Program dan PR Value', proposal: false },
      { label: 'Komunitas dan pemerintah daerah', proposal: false },
      { label: 'Aktor internal dan eksternal, termasuk influencer', proposal: true },
      { label: 'Tren nada harian', proposal: true },
      { label: 'Pembandingan reputasi dengan pesaing', proposal: true },
    ],
  },
]

export const DECISION_RULES: { pillar: Pillar; rule: string }[] = [
  { pillar: 'Industry', rule: 'Ada keputusan atau tindakan negara yang mengikat (izin, regulasi, sanksi, gugatan, pencabutan, penertiban), walaupun alasannya soal lingkungan.' },
  { pillar: 'ESG', rule: 'Fokusnya dampak atau klaim lingkungan, biodiversitas, atau penerapan ESG, termasuk tuduhan LSM dan bantahan perusahaan.' },
  { pillar: 'Corporate', rule: 'Fokusnya PT AR sebagai organisasi: program, CSR, hubungan, dan citra.' },
]

export const BOUNDARY_CASES: { case: string; primary: Pillar; related: Pillar[] }[] = [
  { case: 'KLHK menggugat PT AR terkait banjir Batang Toru', primary: 'Industry', related: ['ESG', 'Corporate'] },
  { case: 'Walhi menuduh PT AR mencemari sungai, lalu PT AR membantah', primary: 'ESG', related: ['Corporate'] },
  { case: 'Pemda menerbitkan perda atau aturan tambang', primary: 'Industry', related: [] },
  { case: 'Pemda dan PT AR menandatangani MoU atau kunjungan bersama', primary: 'Corporate', related: [] },
  { case: 'PT AR meraih PROPER atau penghargaan ESG', primary: 'ESG', related: ['Corporate'] },
  { case: 'PT AR meraih penghargaan CSR, K3, atau SDM', primary: 'Corporate', related: [] },
  { case: 'Harga emas naik, berita membahas sektor', primary: 'Industry', related: [] },
  { case: 'Produksi PT AR naik, berita membahas kinerja perusahaan', primary: 'Corporate', related: ['Industry'] },
  { case: 'Riset akademisi tentang kebijakan atau ekonomi sektor', primary: 'Industry', related: [] },
  { case: 'Riset akademisi tentang dampak ke orangutan atau DAS', primary: 'ESG', related: [] },
  { case: 'PETI (tambang ilegal) ditertibkan aparat', primary: 'Industry', related: [] },
  { case: 'PETI mencemari sungai, berita fokus ke pencemaran', primary: 'ESG', related: ['Industry'] },
  { case: 'Bantuan CSR untuk korban banjir', primary: 'Corporate', related: ['ESG'] },
]

export const POLICY_STATUS_DEFINITIONS: Record<PolicyStatus, string> = {
  Resmi: 'Sudah ditetapkan atau diundangkan.',
  Draf: 'Dokumen rancangan sudah ada, misalnya RPP, RPermen, atau konsultasi publik.',
  Wacana: 'Baru berupa pernyataan pejabat tanpa dokumen.',
}

export const ESG_FRAME_DEFINITIONS: Record<EsgFrame, string> = {
  Teladan: 'PT AR disebut sebagai contoh baik.',
  'Bagian masalah sektor': 'PT AR disebut bersama perusahaan lain sebagai bagian dari masalah.',
  Tertuduh: 'PT AR menjadi sasaran klaim secara langsung.',
}

export const OPEN_DECISIONS: string[] = [
  'Tahap eskalasi: nama tahapnya dan kriteria naik dari satu tahap ke tahap berikutnya.',
  'Skala dampak: apa yang dinilai dan berapa skalanya.',
  'Pemilik isu: daftar unit internal dan siapa yang menetapkan pemiliknya.',
  'Pilihan cakupan A (sosial & tata kelola di Corporate) atau cakupan B (sosial & tata kelola berbingkai ESG di ESG). Data demo memakai cakupan A.',
  'Batas "pesaing": hanya tambang emas, atau termasuk tambang lain di Sumatera Utara. Data demo memakai tambang emas saja.',
]
