import { useId } from 'react'

/**
 * Radar Reputation Topics: satu sumbu per topik, panjang sumbu = jumlah berita.
 * Poligon terluar = topik dengan berita terbanyak (skala maksimum); poligon putus-putus = jumlah aktual.
 */

const COLOR = '#1F6F9F'
const W = 560
const H = 470
const CX = W / 2
const CY = H / 2 + 6
const R = 150

function wrap(label: string): string[] {
  if (label.length <= 14 || !label.includes(' ')) return [label]
  const words = label.split(' ')
  let best = 1
  let diff = Infinity
  for (let i = 1; i < words.length; i++) {
    const d = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length)
    if (d < diff) { diff = d; best = i }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')]
}

export function TopicRadar({ data }: { data: { label: string; count: number }[] }) {
  const gid = useId()
  const n = data.length
  const max = Math.max(1, ...data.map((d) => d.count))
  const total = data.reduce((s, d) => s + d.count, 0)
  if (n < 3) return <p className="py-8 text-center text-sm text-slate-400">Radar butuh minimal 3 topik.</p>

  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n
  const pt = (i: number, f: number) => [CX + Math.cos(angle(i)) * R * f, CY + Math.sin(angle(i)) * R * f] as const
  const poly = (f: (i: number) => number) => data.map((_, i) => pt(i, f(i)).join(',')).join(' ')
  const rings = [0.25, 0.5, 0.75]

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto w-full max-w-[560px]" role="img" aria-label={`Radar Reputation Topics, n = ${total} berita`}>
        <defs>
          <linearGradient id={`${gid}-bg`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor={COLOR} stopOpacity="0.07" />
            <stop offset="1" stopColor={COLOR} stopOpacity="0.03" />
          </linearGradient>
        </defs>
        <polygon points={poly(() => 1)} fill={`url(#${gid}-bg)`} stroke="#c7ccd1" strokeWidth="1" />
        {rings.map((f) => (
          <polygon key={f} points={poly(() => f)} fill="none" stroke="#c7ccd1" strokeWidth="1" strokeDasharray="2 3" />
        ))}
        {data.map((_, i) => {
          const [x, y] = pt(i, 1)
          return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#c7ccd1" strokeWidth="1" strokeDasharray="2 3" />
        })}
        <polygon points={poly((i) => data[i].count / max)} fill={COLOR} fillOpacity="0.28" stroke={COLOR} strokeWidth="2" strokeDasharray="6 4" />
        {data.map((d, i) => {
          const [vx, vy] = pt(i, d.count / max)
          const [ex, ey] = pt(i, 1)
          const [lx, ly] = pt(i, 1.1)
          const sin = Math.sin(angle(i))
          const cos = Math.cos(angle(i))
          const anchor = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end'
          const lines = wrap(d.label)
          return (
            <g key={d.label}>
              <circle cx={ex} cy={ey} r="4.5" fill={d.count ? COLOR : '#9AA3AD'} />
              <circle cx={vx} cy={vy} r="3.5" fill={COLOR} stroke="#fff" strokeWidth="1.5" />
              <text x={lx} y={sin < -0.5 ? ly - (lines.length + 1) * 14 + 10 : sin > 0.5 ? ly + 12 : ly - ((lines.length + 1) * 14) / 2 + 12} textAnchor={anchor} fontSize="12" fontWeight="600" fill="#1e293b">
                {lines.map((t, k) => (
                  <tspan key={k} x={lx} dy={k === 0 ? 0 : 14}>{t}</tspan>
                ))}
                <tspan x={lx} dy={14} fontWeight="400" fill="#64748b">{d.count} berita</tspan>
              </text>
            </g>
          )
        })}
        {rings.concat(1).map((f) => {
          const a = angle(0) + Math.PI / n
          return (
            <text key={f} x={CX + Math.cos(a) * R * f} y={CY + Math.sin(a) * R * f - 2} fontSize="9" fill="#64748b" textAnchor="middle">
              {Math.round(max * f * 10) / 10}
            </text>
          )
        })}
      </svg>
      <p className="mt-1 text-xs text-slate-400">
        Skala linear: sisi terluar = {max} berita (topik terbanyak); n = {total}. Nilai di cincin adalah jumlah berita. Satu berita dihitung pada setiap topiknya.
      </p>
    </div>
  )
}
