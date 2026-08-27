import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { type ComponentType } from 'react'
import {
  BarChart3,
  Building2,
  FileBarChart,
  Gauge,
  LayoutDashboard,
  LayoutList,
  Leaf,
  LineChart,
  ListTree,
  LogOut,
  Newspaper,
  Pickaxe,
  Scale,
  ShieldAlert,
  Shovel,
  Tags,
  Trophy,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { EditableText } from '@/components/ui/EditableText'
import miningLogo from '@/assets/mining-logo.png'
import logoNeterra from '@/assets/logo-neterra.png'

interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  end?: boolean
}

function MiningIndustryIcon({ className }: { className?: string }) {
  return (
    <span className={cn('relative inline-block', className)}>
      <Pickaxe className="absolute inset-0 h-full w-full" strokeWidth={2.25} />
      <Shovel className="absolute inset-0 h-full w-full -scale-x-100" strokeWidth={2.25} />
    </span>
  )
}

function EsgIcon({ className }: { className?: string }) {
  return <Leaf className={className} strokeWidth={2.25} />
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  { label: 'Dashboard', items: [{ to: '/', label: 'Executive Overview', icon: LayoutDashboard, end: true }] },
  {
    label: 'ISSUE',
    items: [
      { to: '/industry', label: 'Mining Industry', icon: MiningIndustryIcon },
      { to: '/esg', label: 'ESG & Environmental', icon: EsgIcon },
      { to: '/corporate', label: 'Corporate Reputation', icon: Building2 },
    ],
  },
  {
    label: 'Monitoring',
    items: [
      { to: '/news', label: 'News Monitoring', icon: Newspaper },
      { to: '/issues', label: 'Issue Monitoring', icon: ListTree },
      { to: '/stakeholders', label: 'Stakeholder / Influencer', icon: Users },
      { to: '/media', label: 'Media Monitoring', icon: FileBarChart },
    ],
  },
  {
    label: 'Analysis',
    items: [
      { to: '/analysis/sentiment', label: 'Sentiment', icon: Gauge },
      { to: '/analysis/reputation', label: 'Reputation', icon: Trophy },
      { to: '/analysis/risk', label: 'Risk', icon: ShieldAlert },
      { to: '/analysis/competitor', label: 'Competitor Benchmark', icon: Scale },
    ],
  },
  {
    label: 'Reports',
    items: [
      { to: '/reports/industry', label: 'Weekly Industry Report', icon: LineChart },
      { to: '/reports/esg', label: 'Weekly ESG Report', icon: LineChart },
      { to: '/reports/corporate', label: 'Weekly Corporate Report', icon: LineChart },
    ],
  },
  {
    label: 'Data Management',
    items: [
      { to: '/data/news', label: 'News Database', icon: BarChart3 },
      { to: '/data/taxonomy', label: 'Taxonomy', icon: Tags },
      { to: '/data/companies', label: 'Companies', icon: Building2 },
      { to: '/data/media', label: 'Media', icon: Newspaper },
      { to: '/data/influencers', label: 'Influencers', icon: Users },
      { to: '/data/categories', label: 'Categories', icon: LayoutList },
    ],
  },
]

function BrandMark() {
  return (
    <div className="mb-6 flex items-center gap-2.5 px-2">
      <img src={miningLogo} alt="Mining Issue Analytics" className="h-10 w-10 shrink-0 object-contain" />
      <div className="min-w-0">
        <EditableText as="p" configKey="app.title" defaultValue="Mining Issue Analytics" className="truncate text-sm font-semibold leading-tight text-slate-900" />
        <EditableText as="p" configKey="app.subtitle" defaultValue="Industry, ESG & Corporate Reputation" className="truncate text-[11px] leading-tight text-slate-500" />
      </div>
    </div>
  )
}

export function AppLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <aside className="hidden w-[clamp(12rem,18vw,16rem)] shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
        <div className="px-3 pt-5">
          <BrandMark />
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-4">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2.5 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{group.label}</p>
              <div className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors',
                        isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                      )
                    }
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="shrink-0 space-y-3 border-t border-slate-100 px-3 py-3">
          <div className="flex items-center gap-2 px-2.5">
            <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Powered by</span>
            <img src={logoNeterra} alt="Neterra Indonesia" className="h-8 w-auto object-contain" />
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Logout
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-white px-5 py-3 md:hidden">
          <select
            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700"
            onChange={(e) => navigate(e.target.value)}
            defaultValue=""
          >
            <option value="" disabled>
              Buka halaman…
            </option>
            {NAV_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.items.map((item) => (
                  <option key={item.to} value={item.to}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button onClick={handleLogout} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
            <LogOut className="h-3.5 w-3.5" />
            Logout
          </button>
        </header>
        <main className="min-w-0 flex-1 px-5 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
