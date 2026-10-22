import { Navigate, Route, Routes } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '@/lib/auth'
import { AppLayout } from '@/components/layout/AppLayout'
import Login from '@/pages/Login'
import ExecutiveDashboard from '@/pages/ExecutiveDashboard'
import IndustryIntelligence from '@/pages/IndustryIntelligence'
import EsgIntelligence from '@/pages/EsgIntelligence'
import CorporateReputation from '@/pages/CorporateReputation'
import NewsMonitoring from '@/pages/NewsMonitoring'
import IssueMonitoring from '@/pages/IssueMonitoring'
import IssueDetail from '@/pages/IssueDetail'
import StakeholderList from '@/pages/StakeholderList'
import MediaMonitoring from '@/pages/MediaMonitoring'
import AnalysisSentiment from '@/pages/analysis/AnalysisSentiment'
import AnalysisReputation from '@/pages/analysis/AnalysisReputation'
import AnalysisRisk from '@/pages/analysis/AnalysisRisk'
import AnalysisCompetitor from '@/pages/analysis/AnalysisCompetitor'
import ReportsHub from '@/pages/reports/ReportsHub'
import DataNews from '@/pages/data/DataNews'
import DataTaxonomy from '@/pages/data/DataTaxonomy'
import DataCompanies from '@/pages/data/DataCompanies'
import DataMedia from '@/pages/data/DataMedia'
import DataInfluencers from '@/pages/data/DataInfluencers'
import DataCategories from '@/pages/data/DataCategories'
import DataBoundaries from '@/pages/data/DataBoundaries'
import NotFound from '@/pages/NotFound'

function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<ExecutiveDashboard />} />
        <Route path="industry" element={<IndustryIntelligence />} />
        <Route path="esg" element={<EsgIntelligence />} />
        <Route path="corporate" element={<CorporateReputation />} />

        <Route path="news" element={<NewsMonitoring />} />
        <Route path="issues" element={<IssueMonitoring />} />
        <Route path="issues/:issueId" element={<IssueDetail />} />
        <Route path="stakeholders" element={<StakeholderList />} />
        <Route path="media" element={<MediaMonitoring />} />

        <Route path="analysis/sentiment" element={<AnalysisSentiment />} />
        <Route path="analysis/reputation" element={<AnalysisReputation />} />
        <Route path="analysis/risk" element={<AnalysisRisk />} />
        <Route path="analysis/competitor" element={<AnalysisCompetitor />} />

        <Route path="reports" element={<ReportsHub />} />
        <Route path="reports/industry" element={<Navigate to="/reports?type=industry" replace />} />
        <Route path="reports/esg" element={<Navigate to="/reports?type=esg" replace />} />
        <Route path="reports/corporate" element={<Navigate to="/reports?type=corporate" replace />} />

        <Route path="data/news" element={<DataNews />} />
        <Route path="data/taxonomy" element={<DataTaxonomy />} />
        <Route path="data/companies" element={<DataCompanies />} />
        <Route path="data/media" element={<DataMedia />} />
        <Route path="data/influencers" element={<DataInfluencers />} />
        <Route path="data/categories" element={<DataCategories />} />
        <Route path="data/boundaries" element={<DataBoundaries />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
