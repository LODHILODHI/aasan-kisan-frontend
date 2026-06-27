import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getAudit } from '../api/admin'
import { getApiError } from '../api/client'
import { FarmerActionsAuditPanel } from '../components/audit/FarmerActionsAuditPanel'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Loading, PageError } from '../components/ui/Loading'
import { PageTabs } from '../components/ui/PageTabs'
import { Table } from '../components/ui/Table'
import { cellValue } from '../utils/format'

const TAB_SYSTEM = 'system'
const TAB_FARMER = 'farmer-actions'

function SystemAuditPanel() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load(p = page) {
    setLoading(true)
    setError('')
    try {
      const res = await getAudit({ page: p, page_size: 25 })
      const list = res.data?.items ?? res.data?.entries ?? []
      setItems(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Loading />
  if (error) return <PageError message={error} onRetry={() => load(page)} />

  return (
    <Card title={`${items.length} entries`} subtitle="Hash-chain system audit (GET /audit)">
      <Table
        columns={[
          { key: 'id', label: 'ID', render: (r) => cellValue(r.id).toString().slice(0, 8) },
          { key: 'action', label: 'Action', render: (r) => cellValue(r.action ?? r.event_type) },
          { key: 'actor', label: 'Actor', render: (r) => cellValue(r.actor_email ?? r.actor_id) },
          { key: 'resource', label: 'Resource', render: (r) => cellValue(r.resource_type ?? r.resource) },
          {
            key: 'at',
            label: 'When',
            render: (r) => new Date(r.created_at ?? r.timestamp).toLocaleString(),
          },
          {
            key: 'outcome',
            label: 'Outcome',
            render: (r) => (
              <Badge tone={r.outcome === 'success' ? 'success' : 'warning'}>
                {cellValue(r.outcome, 'ok')}
              </Badge>
            ),
          },
        ]}
        rows={items}
        emptyMessage="No audit entries"
      />

      <div className="flex justify-between mt-4 pt-4 border-t border-ak-border">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => {
            const np = page - 1
            setPage(np)
            load(np)
          }}
        >
          Previous
        </Button>
        <span className="text-sm text-ak-muted">Page {page}</span>
        <Button
          variant="secondary"
          size="sm"
          disabled={items.length < 25}
          onClick={() => {
            const np = page + 1
            setPage(np)
            load(np)
          }}
        >
          Next
        </Button>
      </div>
    </Card>
  )
}

export default function AuditPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get('tab')
  const activeTab = requested === TAB_FARMER ? TAB_FARMER : TAB_SYSTEM

  const tabs = [
    { id: TAB_SYSTEM, label: 'System audit' },
    { id: TAB_FARMER, label: 'Farmer actions' },
  ]

  function setTab(tabId) {
    const next = new URLSearchParams(searchParams)
    if (tabId === TAB_SYSTEM) {
      next.delete('tab')
    } else {
      next.set('tab', tabId)
    }
    setSearchParams(next, { replace: true })
  }

  return (
    <>
      <Header
        title="Audit log"
        subtitle={
          activeTab === TAB_FARMER
            ? 'Per-farmer admin action trail'
            : 'Immutable hash-chain admin history'
        }
      />

      <PageTabs tabs={tabs} active={activeTab} onChange={setTab} className="w-full max-w-md" />

      {activeTab === TAB_SYSTEM ? <SystemAuditPanel /> : <FarmerActionsAuditPanel />}
    </>
  )
}
