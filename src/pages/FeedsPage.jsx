import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { hasPermission } from '../utils/rbac'
import { Header } from '../components/layout/Header'
import { PageTabs } from '../components/ui/PageTabs'
import { MandiFeedContent } from './MandiPage'
import { WeatherFeedContent } from './WeatherPage'

const MANDI_TAB = 'mandi'
const WEATHER_TAB = 'weather'

export default function FeedsPage() {
  const { adminUser } = useAuth()
  const grants = adminUser?.grants ?? []
  const canMandi = hasPermission(grants, 'mandi_feed.read')
  const canWeather = hasPermission(grants, 'weather_feed.read')
  const [searchParams, setSearchParams] = useSearchParams()

  const tabs = [
    ...(canMandi ? [{ id: MANDI_TAB, label: 'Mandi prices' }] : []),
    ...(canWeather ? [{ id: WEATHER_TAB, label: 'Weather' }] : []),
  ]

  const requestedTab = searchParams.get('tab')
  const defaultTab = tabs[0]?.id ?? MANDI_TAB
  const activeTab = tabs.some((t) => t.id === requestedTab) ? requestedTab : defaultTab

  function setTab(tabId) {
    const next = new URLSearchParams(searchParams)
    if (tabId === defaultTab) {
      next.delete('tab')
    } else {
      next.set('tab', tabId)
    }
    setSearchParams(next, { replace: true })
  }

  const subtitle =
    activeTab === WEATHER_TAB
      ? 'District forecasts shown in the farmer app'
      : 'Edit crop prices shown in the farmer app'

  return (
    <>
      <Header title="Market & weather feeds" subtitle={subtitle} />
      <PageTabs tabs={tabs} active={activeTab} onChange={setTab} />
      {activeTab === WEATHER_TAB ? <WeatherFeedContent /> : <MandiFeedContent />}
    </>
  )
}
