import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getAnalyticsClassifier,
  getAnalyticsConsent,
  getAnalyticsOverview,
  getAnalyticsTelemetry,
} from '../api/admin'
import { getApiError } from '../api/client'
import { ClassifierMetrics } from '../components/charts/ClassifierMetrics'
import { ConsentBreakdown } from '../components/charts/ConsentBreakdown'
import { TelemetryChart } from '../components/charts/TelemetryChart'
import { Card } from '../components/ui/Card'
import { Loading, PageError } from '../components/ui/Loading'

export function AnalyticsContent() {
  const [overview, setOverview] = useState(null)
  const [consent, setConsent] = useState(null)
  const [telemetry, setTelemetry] = useState(null)
  const [classifier, setClassifier] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [ov, co, te, cl] = await Promise.all([
        getAnalyticsOverview(),
        getAnalyticsConsent(),
        getAnalyticsTelemetry(),
        getAnalyticsClassifier(),
      ])
      setOverview(ov.data ?? ov)
      setConsent(co.data ?? co)
      setTelemetry(te.data ?? te)
      setClassifier(cl.data ?? cl)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const stats = overview ?? {}

  if (loading) return <Loading />
  if (error) return <PageError message={error} onRetry={load} />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard label="Farmers" value={stats.farmers_total} />
        <StatCard label="Detections" value={stats.detections_total} />
        <StatCard label="Low confidence" value={stats.low_confidence_detections} />
        <StatCard
          label="Cloud recheck pending"
          value={stats.cloud_recheck_pending}
          to="/cloud-recheck"
        />
        <StatCard label="DSR pending" value={stats.dsr_pending} to="/dsr" />
        <StatCard label="Sync pending" value={stats.sync_pending} />
        <StatCard label="Sync failed" value={stats.sync_failed} />
        <StatCard label="Telemetry 24h" value={stats.telemetry_events_24h} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Consent breakdown"
          subtitle="Farmer opt-in for analytics and image training"
        >
          <ConsentBreakdown data={consent} />
        </Card>
        <Card title="Telemetry (7 days)" subtitle="Event volume by type">
          <TelemetryChart data={telemetry} />
        </Card>
      </div>

      <Card title="Classifier metrics" subtitle="Detections by species and average confidence">
        <ClassifierMetrics data={classifier} />
      </Card>
    </div>
  )
}

function StatCard({ label, value, to }) {
  const inner = (
    <>
      <div className="text-xs font-semibold uppercase tracking-wider text-ak-muted">{label}</div>
      <div className="text-2xl font-extrabold text-ak-text mt-2">{value ?? '—'}</div>
    </>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="block bg-white border border-ak-border rounded-[var(--radius-ak-card)] shadow-[var(--shadow-ak-card)] p-5 hover:border-ak-brand hover:shadow-md transition-all"
      >
        {inner}
        <div className="text-xs font-semibold text-ak-brand mt-2">View queue →</div>
      </Link>
    )
  }

  return (
    <div className="bg-white border border-ak-border rounded-[var(--radius-ak-card)] shadow-[var(--shadow-ak-card)] p-5">
      {inner}
    </div>
  )
}
