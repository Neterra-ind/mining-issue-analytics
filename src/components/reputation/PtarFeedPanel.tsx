import { useMemo } from 'react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { ptarFeed } from '@/data/ptarReal'

/**
 * Grafik untuk hal yang tidak tertampung kategori dashboard: seberapa banyak berita benar-benar tentang PT AR
 * (kelompok relevansi 1–4). Sumber: ptarFeed (256 baris, 22 Sep – 20 Okt 2026).
 */

const GROUPS = [
  { g: 1, label: 'PT AR jadi pokok berita', color: '#16547A' },
  { g: 2, label: 'PT AR faktor / pihak terkait', color: '#4C9BC9' },
  { g: 3, label: 'PT AR hanya disebut dalam daftar', color: '#9AA3AD' },
  { g: 4, label: 'Bukan berita PT AR (halaman portal)', color: '#D5D9DE' },
] as const
const SENT = [
  ['pos', 'Positif'],
  ['neu', 'Netral'],
  ['neg', 'Negatif'],
] as const

export function PtarFeedPanel() {
  const total = ptarFeed.length
  const byGroup = useMemo(() => GROUPS.map((x) => ({ ...x, rows: ptarFeed.filter((r) => r[1] === x.g) })), [])

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardHeader
          title="Seberapa banyak berita benar-benar tentang PT AR"
          subtitle={`Data pantauan nyata, 22 Sep – 20 Okt 2026, n = ${total} baris. Hanya kelompok 1 dan 2 yang masuk ke grafik reputasi di atas.`}
        />
        <CardBody className="flex flex-1 flex-col justify-between gap-5">
          <div className="flex h-12 w-full overflow-hidden rounded-md">
            {byGroup.map((x) => (
              <div key={x.g} style={{ width: `${(x.rows.length / total) * 100}%`, backgroundColor: x.color }} title={`${x.label}: ${x.rows.length}`} />
            ))}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-xs">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-1 pr-3 font-medium">Kelompok</th>
                  <th className="py-1 pr-3 text-right font-medium">Berita</th>
                  <th className="py-1 pr-3 text-right font-medium">Persen</th>
                  {SENT.map(([, l]) => (
                    <th key={l} className="py-1 pr-3 text-right font-medium">{l}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byGroup.map((x) => (
                  <tr key={x.g} className="border-t border-slate-100 text-slate-700">
                    <td className="py-3 pr-3">
                      <span className="mr-2 inline-block h-2.5 w-2.5 rounded-sm align-middle" style={{ backgroundColor: x.color }} />
                      {x.g}. {x.label}
                    </td>
                    <td className="py-3 pr-3 text-right">{x.rows.length}</td>
                    <td className="py-3 pr-3 text-right">{Math.round((x.rows.length / total) * 100)}%</td>
                    {SENT.map(([k]) => (
                      <td key={k} className="py-3 pr-3 text-right">{x.rows.filter((r) => r[2] === k).length}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400">
            Kolom Positif, Netral, Negatif memakai label sentimen dari file sumber, yang menilai teks berita, bukan sikap terhadap PT AR. Rilis yang sama di media berbeda dihitung per baris.
          </p>
        </CardBody>
      </Card>

    </>
  )
}
