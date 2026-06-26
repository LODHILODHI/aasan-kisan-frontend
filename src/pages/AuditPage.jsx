import { useEffect, useState } from 'react'
import { getAudit } from '../api/admin'
import { getApiError } from '../api/client'
import { cellValue } from '../utils/format'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Loading, PageError } from '../components/ui/Loading'
import { Table } from '../components/ui/Table'

export default function AuditPage() {
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
  }, [])

  return (
    <>
      <Header title="Audit log" subtitle="Immutable admin action history" />

      {loading && <Loading />}
      {error && <PageError message={error} onRetry={() => load(page)} />}

      {!loading && !error && (
        <Card title={`${items.length} entries`}>
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
      )}
    </>
  )
}
