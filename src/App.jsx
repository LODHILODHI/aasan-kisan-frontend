import { Navigate, Route, Routes } from 'react-router-dom'
import { ProtectedRoute, PublicOnlyRoute } from './auth/ProtectedRoute'
import { AdminLayout } from './components/layout/AdminLayout'
import AdviceDetailPage from './pages/AdviceDetailPage'
import AdvicePage from './pages/AdvicePage'
import AiReviewPage from './pages/AiReviewPage'
import AnalyticsPage from './pages/AnalyticsPage'
import AuditPage from './pages/AuditPage'
import CatalogPage from './pages/CatalogPage'
import CloudRecheckPage from './pages/CloudRecheckPage'
import DashboardPage from './pages/DashboardPage'
import DsrPage from './pages/DsrPage'
import FarmerDetailPage from './pages/FarmerDetailPage'
import FarmersPage from './pages/FarmersPage'
import KbPage from './pages/KbPage'
import LocalesPage from './pages/LocalesPage'
import LoginPage from './pages/LoginPage'
import MandiPage from './pages/MandiPage'
import ModelsPage from './pages/ModelsPage'
import StringsPage from './pages/StringsPage'
import ThresholdPage from './pages/ThresholdPage'
import UsersPage from './pages/UsersPage'
import WeatherPage from './pages/WeatherPage'

export default function App() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="farmers" element={<FarmersPage />} />
          <Route path="farmers/:id" element={<FarmerDetailPage />} />
          <Route path="dsr" element={<DsrPage />} />
          <Route path="cloud-recheck" element={<CloudRecheckPage />} />
          <Route path="ai/review" element={<AiReviewPage />} />
          <Route path="models" element={<ModelsPage />} />
          <Route path="catalog" element={<CatalogPage />} />
          <Route path="advice" element={<AdvicePage />} />
          <Route path="advice/:id" element={<AdviceDetailPage />} />
          <Route path="kb" element={<KbPage />} />
          <Route path="mandi" element={<MandiPage />} />
          <Route path="weather" element={<WeatherPage />} />
          <Route path="l10n/locales" element={<LocalesPage />} />
          <Route path="l10n/strings" element={<StringsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="settings/threshold" element={<ThresholdPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
