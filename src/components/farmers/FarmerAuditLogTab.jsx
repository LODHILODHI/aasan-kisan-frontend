import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFarmerAuditLog } from '../../api/admin'
import { getApiError } from '../../api/client'
import { formatAuditDetails, formatFarmerAuditAction } from '../../utils/farmerAudit'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Loading, PageError } from '../ui/Loading'
import { Table } from '../ui/Table'

export function FarmerAuditLogTab({ farmerId }) {
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const pageSize = 50

  async function load(p = page) {
    setLoading(true)
    setError('')
    try {
      const res = await getFarmerAuditLog(farmerId, { page: p, page_size: pageSize })
      setData(res.data ?? res)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
  }, [farmerId]) // eslint-disable-line react-hooks/exhaustive-deps

  const items = data?.items ?? []
  const total = data?.total ?? items.length

  if (loading && !data) return <Loading />
  if (error && !data) return <PageError message={error} onRetry={() => load(page)} />

  return (
    <Card title={`Audit log (${total})`} subtitle="Admin actions on this farmer (read-only)">
      {loading && <p className="text-xs text-ak-muted mb-3">Refreshing…</p>}

      <Table
        emptyMessage="No audit entries for this farmer yet"
        columns={[
          {
            key: 'when',
            label: 'When',
            render: (r) => formatTime(r.created_at),
          },
          {
            key: 'admin',
            label: 'Admin',
            render: (r) => (
              <div>
                <div className="font-semibold text-ak-text text-sm">
                  {r.admin_name ?? r.admin_email ?? '—'}
                </div>
                {r.admin_email && r.admin_name && (
                  <div className="text-xs text-ak-muted">{r.admin_email}</div>
                )}
              </div>
            ),
          },
          {
            key: 'role',
            label: 'Role',
            render: (r) => (
              <Badge tone="muted">{r.admin_role?.replace(/_/g, ' ') ?? '—'}</Badge>
            ),
          },
          {
            key: 'action',
            label: 'Action',
            render: (r) => (
              <div className="flex flex-wrap items-center gap-2">
                <code className="text-xs font-semibold text-ak-brand bg-ak-light px-2 py-0.5 rounded">
                  {formatFarmerAuditAction(r.action)}
                </code>
                {r.action === 'delete_detection' && (
                  <Link
                    to={`/farmers/${farmerId}?tab=detections`}
                    className="text-xs font-semibold text-ak-brand hover:underline"
                  >
                    Detections →
                  </Link>
                )}
              </div>
            ),
          },
          {
            key: 'details',
            label: 'Details',
            render: (r) => <AuditDetailsCell details={r.details} />,
          },
        ]}
        rows={items}
        keyField="id"
      />

      <div className="flex justify-between items-center mt-4 pt-4 border-t border-ak-border">
        <Button
          variant="secondary"
          size="sm"
          disabled={page <= 1 || loading}
          onClick={() => {
            const next = page - 1
            setPage(next)
            load(next)
          }}
        >
          Previous
        </Button>
        <span className="text-sm text-ak-muted">
          Page {page}
          {total > 0 ? ` · ${total} total` : ''}
        </span>
        <Button
          variant="secondary"
          size="sm"
          disabled={page * pageSize >= total || loading}
          onClick={() => {
            const next = page + 1
            setPage(next)
            load(next)
          }}
        >
          Next
        </Button>
      </div>
    </Card>
  )
}

function AuditDetailsCell({ details }) {
  if (details == null || (typeof details === 'object' && !Object.keys(details).length)) {
    return <span className="text-xs text-ak-subtle">—</span>
  }

  return (
    <details className="text-xs max-w-md">
      <summary className="cursor-pointer font-semibold text-ak-brand hover:underline">
        View JSON
      </summary>
      <pre className="mt-2 max-h-40 overflow-auto rounded-lg border border-ak-border bg-ak-pale p-2 text-[10px] text-ak-text whitespace-pre-wrap break-all">
        {formatAuditDetails(details)}
      </pre>
    </details>
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
