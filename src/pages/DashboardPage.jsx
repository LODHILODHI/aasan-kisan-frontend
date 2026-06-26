import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getAudit, getSyncHealth } from '../api/admin'
import { getApiError } from '../api/client'
import { cellValue } from '../utils/format'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Loading, PageError } from '../components/ui/Loading'
import { Table } from '../components/ui/Table'

export default function DashboardPage() {
  const [sync, setSync] = useState(null)
  const [audit, setAudit] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [syncRes, auditRes] = await Promise.all([
        getSyncHealth().catch(() => null),
        getAudit({ page_size: 5 }).catch(() => null),
      ])
      setSync(syncRes?.data ?? syncRes)
      setAudit(auditRes?.data ?? auditRes)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const metrics = sync?.metrics ?? sync ?? {}
  const recentAudit = audit?.items ?? audit?.entries ?? []

  return (
    <>
      <Header
        title="Dashboard"
        subtitle="Sync health & recent audit activity"
      />

      {loading && <Loading />}
      {error && <PageError message={error} onRetry={load} />}

      {!loading && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Pending sync" value={cellValue(metrics.pending_batches ?? metrics.pending)} />
            <StatCard label="Failed (24h)" value={cellValue(metrics.failed_24h ?? metrics.failedLast24h)} />
            <StatCard label="Detections synced" value={cellValue(metrics.detections_synced)} />
            <StatCard label="Last batch" value={formatTime(metrics.last_batch_at ?? metrics.lastBatchAt)} />
          </div>

          <Card title="Quick links" subtitle="Common admin tasks">
            <div className="flex flex-wrap gap-3">
              <QuickLink to="/farmers" label="Farmer support" />
              <QuickLink to="/advice" label="Advice CMS" />
              <QuickLink to="/cloud-recheck" label="Cloud recheck queue" />
              <QuickLink to="/mandi" label="Mandi prices" />
              <QuickLink to="/audit" label="Full audit log" />
              <QuickLink to="/analytics" label="Analytics" />
              <QuickLink to="/ai/review" label="AI review queue" />
              <QuickLink to="/models" label="Model registry" />
              <QuickLink to="/kb" label="Knowledge base" />
              <QuickLink to="/dsr" label="DSR queue" />
            </div>
          </Card>

          <Card title="Recent audit" subtitle="Last 5 entries">
            <Table
              emptyMessage="No audit entries yet"
              columns={[
                { key: 'action', label: 'Action', render: (r) => cellValue(r.action ?? r.event_type) },
                { key: 'actor', label: 'Actor', render: (r) => cellValue(r.actor_email ?? r.actorId ?? r.actor_id) },
                {
                  key: 'at',
                  label: 'When',
                  render: (r) => formatTime(r.created_at ?? r.timestamp),
                },
                {
                  key: 'status',
                  label: 'Status',
                  render: (r) => (
                    <Badge tone={r.outcome === 'success' ? 'success' : 'muted'}>
                      {cellValue(r.outcome ?? r.status, 'ok')}
                    </Badge>
                  ),
                },
              ]}
              rows={Array.isArray(recentAudit) ? recentAudit : []}
              keyField="id"
            />
          </Card>
        </div>
      )}
    </>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-ak-border rounded-[var(--radius-ak-card)] shadow-[var(--shadow-ak-card)] p-5">
      <div className="text-xs font-semibold uppercase tracking-wider text-ak-muted">{label}</div>
      <div className="text-2xl font-extrabold text-ak-text mt-2">{value}</div>
    </div>
  )
}

function QuickLink({ to, label }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center px-4 py-2 rounded-full bg-ak-light text-ak-brand text-sm font-semibold hover:bg-ak-surface transition-colors"
    >
      {label}
    </Link>
  )
}

function formatTime(iso) {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}
