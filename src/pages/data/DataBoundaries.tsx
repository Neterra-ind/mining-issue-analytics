import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, CircleHelp } from 'lucide-react'
import { useData } from '@/lib/store'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Badge, EsgFrameBadge, PillarBadge, PolicyStatusBadge, RelatedPillarBadge } from '@/components/ui/Badge'
import {
  BOUNDARY_CASES,
  CONCEPT,
  COUNTING_RULES,
  DECISION_RULES,
  ESG_FRAMES,
  ESG_FRAME_DEFINITIONS,
  OPEN_DECISIONS,
  PILLAR_DEFINITIONS,
  POLICY_STATUSES,
  POLICY_STATUS_DEFINITIONS,
  SCOPE_ROWS,
  VIOLATION_LABEL,
  boundaryViolations,
  esgFrameBreakdown,
  pillarAccounting,
  policyStatusBreakdown,
} from '@/lib/boundaries'

const thClass = 'px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-400'
const tdClass = 'px-3 py-2.5 align-top text-sm text-slate-700'

export default function DataBoundaries() {
  const { data } = useData()
  const accounting = useMemo(() => pillarAccounting(data.news), [data.news])
  const violations = useMemo(() => boundaryViolations(data), [data])
  const policy = useMemo(() => policyStatusBreakdown(data.news), [data.news])
  const frames = useMemo(() => esgFrameBreakdown(data.news), [data.news])

  return (
    <div>
      <PageHeader
        configKey="dataBoundaries.title"
        title="Batasan & Definisi"
        subtitleKey="dataBoundaries.subtitle"
        subtitle="Cakupan, aturan hitung, dan batas antar pilar yang dipakai seluruh dashboard."
      />

      <Card className="mb-5">
        <CardBody>
          <p className="text-sm leading-relaxed text-slate-700">{CONCEPT.summary}</p>
          <p className="mt-2 inline-flex rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">{CONCEPT.disclaimer}</p>
        </CardBody>
      </Card>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Cek aturan hitung" subtitle="Seluruh berita di database, tanpa filter" />
          <CardBody>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={thClass}>Pilar</th>
                  <th className={`${thClass} text-right`}>Pilar utama (KPI)</th>
                  <th className={`${thClass} text-right`}>Pilar terkait (label)</th>
                </tr>
              </thead>
              <tbody>
                {accounting.rows.map((r) => (
                  <tr key={r.pillar} className="border-b border-slate-50">
                    <td className={tdClass}>
                      <PillarBadge pillar={r.pillar} />
                    </td>
                    <td className={`${tdClass} text-right font-semibold`}>{r.primary}</td>
                    <td className={`${tdClass} text-right text-slate-400`}>{r.related}</td>
                  </tr>
                ))}
                <tr>
                  <td className={`${tdClass} font-medium`}>Jumlah</td>
                  <td className={`${tdClass} text-right font-semibold`}>{accounting.sumPrimary}</td>
                  <td className={`${tdClass} text-right text-slate-400`}>{accounting.wouldDoubleCount}</td>
                </tr>
              </tbody>
            </table>
            <p className={`mt-3 flex items-start gap-1.5 text-xs ${accounting.balanced ? 'text-emerald-700' : 'text-red-700'}`}>
              {accounting.balanced ? <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0" /> : <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" />}
              {accounting.balanced
                ? `Jumlah pilar utama sama dengan total berita (${accounting.total}). Kalau pilar terkait ikut dihitung, angkanya akan membengkak ${accounting.wouldDoubleCount} berita.`
                : `Jumlah pilar utama (${accounting.sumPrimary}) tidak sama dengan total berita (${accounting.total}).`}
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Validasi batasan"
            subtitle="Pilar terkait, isu induk, objek, sumber, status kebijakan, bingkai ESG"
            action={<Badge tone={violations.length ? 'amber' : 'teal'}>{violations.length ? `${violations.length} temuan` : 'Sesuai'}</Badge>}
          />
          <CardBody className="max-h-72 overflow-y-auto">
            {violations.length === 0 ? (
              <p className="flex items-start gap-1.5 text-sm text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                Semua berita dan isu sesuai batasan.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {violations.map((v, idx) => (
                  <li key={`${v.targetId}-${v.kind}-${idx}`} className="text-sm">
                    <div className="flex items-start gap-2">
                      <Badge tone="amber" className="shrink-0">
                        {VIOLATION_LABEL[v.kind]}
                      </Badge>
                      <div className="min-w-0">
                        {v.targetId.startsWith('iss-') ? (
                          <Link to={`/issues/${v.targetId}`} className="line-clamp-1 font-medium text-blue-700 hover:underline">
                            {v.targetLabel}
                          </Link>
                        ) : (
                          <p className="line-clamp-1 font-medium text-slate-800">{v.targetLabel}</p>
                        )}
                        <p className="text-xs text-slate-500">{v.message}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card className="mb-5">
        <CardHeader title="Cakupan" />
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className={thClass}>Aspek</th>
                <th className={thClass}>Termasuk</th>
                <th className={thClass}>Tidak termasuk</th>
              </tr>
            </thead>
            <tbody>
              {SCOPE_ROWS.map((r) => (
                <tr key={r.aspect} className="border-b border-slate-50 last:border-0">
                  <td className={`${tdClass} font-medium text-slate-900`}>{r.aspect}</td>
                  <td className={tdClass}>{r.included}</td>
                  <td className={`${tdClass} text-slate-500`}>{r.excluded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <Card className="mb-5">
        <CardHeader title="Aturan unit dan hitung" />
        <CardBody>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700">
            {COUNTING_RULES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ol>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            Contoh tampilan:
            <PillarBadge pillar="ESG" /> pilar utama
            <RelatedPillarBadge pillar="Corporate" /> pilar terkait
          </div>
        </CardBody>
      </Card>

      <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        {PILLAR_DEFINITIONS.map((p) => (
          <Card key={p.pillar}>
            <CardHeader title={<span className="inline-flex items-center gap-2">{p.name} <PillarBadge pillar={p.pillar} /></span>} subtitle={p.definition} />
            <CardBody className="space-y-4 text-sm">
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Berisi berita tentang</p>
                <ul className="list-disc space-y-1 pl-4 text-slate-700">
                  {p.includes.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Bukan di pilar ini</p>
                <p className="text-slate-600">{p.excludes}</p>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Pertanyaan yang dijawab</p>
                <p className="mt-0.5 font-medium text-slate-800">{p.question}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Turunan analisis</p>
                <ol className="list-decimal space-y-1 pl-4 text-slate-700">
                  {p.analyses.map((a) => (
                    <li key={a.label}>
                      {a.label}
                      {a.proposal && (
                        <Badge tone="slate" className="ml-1.5 align-middle text-[10px]">
                          Usulan · fase lanjut
                        </Badge>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Penentuan pilar utama" subtitle="Ditentukan dari fokus berita, bukan kata kunci. Jika lebih dari satu terpenuhi, ikuti urutan ini." />
          <CardBody>
            <ol className="space-y-3">
              {DECISION_RULES.map((r, idx) => (
                <li key={r.pillar} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600">{idx + 1}</span>
                  <div>
                    <PillarBadge pillar={r.pillar} />
                    <p className="mt-1 text-slate-700">{r.rule}</p>
                  </div>
                </li>
              ))}
            </ol>
          </CardBody>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader title="Kasus batas" />
          <CardBody className="overflow-x-auto p-0">
            <table className="w-full min-w-[480px]">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className={thClass}>Kasus</th>
                  <th className={thClass}>Pilar utama</th>
                  <th className={thClass}>Pilar terkait</th>
                </tr>
              </thead>
              <tbody>
                {BOUNDARY_CASES.map((c) => (
                  <tr key={c.case} className="border-b border-slate-50 last:border-0">
                    <td className={tdClass}>{c.case}</td>
                    <td className={tdClass}>
                      <PillarBadge pillar={c.primary} />
                    </td>
                    <td className={tdClass}>
                      <div className="flex flex-wrap gap-1">
                        {c.related.length ? c.related.map((p) => <RelatedPillarBadge key={p} pillar={p} />) : <span className="text-slate-300">–</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Status kebijakan" subtitle="Radar regulasi, berita berpilar utama Industry" />
          <CardBody className="space-y-2.5">
            {POLICY_STATUSES.map((s) => (
              <div key={s} className="flex items-start justify-between gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <PolicyStatusBadge status={s} className="shrink-0" />
                  <span className="text-slate-600">{POLICY_STATUS_DEFINITIONS[s]}</span>
                </div>
                <span className="shrink-0 font-semibold text-slate-800">{policy[s]}</span>
              </div>
            ))}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Bingkai ESG terhadap PT AR" subtitle="Berita berpilar utama ESG yang menyebut PT AR" />
          <CardBody className="space-y-2.5">
            {ESG_FRAMES.map((f) => (
              <div key={f} className="flex items-start justify-between gap-3 text-sm">
                <div className="flex items-start gap-2">
                  <EsgFrameBadge frame={f} className="shrink-0" />
                  <span className="text-slate-600">{ESG_FRAME_DEFINITIONS[f]}</span>
                </div>
                <span className="shrink-0 font-semibold text-slate-800">{frames[f]}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Belum didefinisikan" subtitle="Perlu diputuskan sebelum dashboard dipakai dengan data riil" />
        <CardBody>
          <ul className="space-y-2">
            {OPEN_DECISIONS.map((d) => (
              <li key={d} className="flex items-start gap-2 text-sm text-slate-700">
                <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                {d}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  )
}
