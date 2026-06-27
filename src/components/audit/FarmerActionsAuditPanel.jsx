import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFarmerActionsAuditLog } from '../../api/admin'
import { getApiError } from '../../api/client'
import { formatAuditDetails, formatFarmerAuditAction, FARMER_AUDIT_ACTIONS } from '../../utils/farmerAudit'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input, Select } from '../ui/Input'
import { Loading, PageError } from '../ui/Loading'
import { Table } from '../ui/Table'

const EMPTY_FILTERS = {
  farmer_id: '',
  admin_user_id: '',
  action: '',
  date_from: '',
  date_to: '',
}

export function FarmerActionsAuditPanel() {
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const pageSize = 25

  async function load(p = page) {
    setLoading(true)
    setError('')
    try {
      const res = await getFarmerActionsAuditLog({
        farmer_id: filters.farmer_id || undefined,
        admin_user_id: filters.admin_user_id || undefined,
        action: filters.action || undefined,
        date_from: filters.date_from || undefined,
        date_to: filters.date_to || undefined,
        page: p,
        page_size: pageSize,
      })
      setData(res.data ?? res)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(1)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const items = data?.items ?? []
  const total = data?.total ?? items.length

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }))
  }

  return (
    <>
      <Card className="mb-6">
        <form
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-end"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            load(1)
          }}
        >
          <Input
            label="Farmer ID"
            placeholder="UUID"
            value={filters.farmer_id}
            onChange={(e) => updateFilter('farmer_id', e.target.value)}
          />
          <Input
            label="Admin user ID"
            placeholder="UUID"
            value={filters.admin_user_id}
            onChange={(e) => updateFilter('admin_user_id', e.target.value)}
          />
          <Select
            label="Action"
            value={filters.action}
            onChange={(e) => updateFilter('action', e.target.value)}
          >
            {FARMER_AUDIT_ACTIONS.map((opt) => (
              <option key={opt.value || 'any'} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
          <Input
            label="From"
            type="date"
            value={filters.date_from}
            onChange={(e) => updateFilter('date_from', e.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={filters.date_to}
            onChange={(e) => updateFilter('date_to', e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            Search
          </Button>
        </form>
      </Card>

      {loading && !data && <Loading />}
      {error && !data && <PageError message={error} onRetry={() => load(page)} />}

      {(data || (!loading && !error)) && (
        <Card title={`${total} farmer actions`} subtitle="Per-farmer admin trail (not hash-chain audit)">
          {loading && <p className="text-xs text-ak-muted mb-3">Refreshing…</p>}

          <Table
            emptyMessage="No farmer audit entries match your filters"
            columns={[
              {
                key: 'when',
                label: 'When',
                render: (r) => formatTime(r.created_at),
              },
              {
                key: 'farmer',
                label: 'Farmer',
                render: (r) =>
                  r.farmer_id ? (
                    <Link
                      to={`/farmers/${r.farmer_id}?tab=audit`}
                      className="font-semibold text-ak-brand hover:underline"
                    >
                      {r.farmer_name ?? r.farmer_id.slice(0, 8)}
                    </Link>
                  ) : (
                    '—'
                  ),
              },
              {
                key: 'admin',
                label: 'Admin',
                render: (r) => r.admin_name ?? r.admin_email ?? '—',
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
                  <code className="text-xs font-semibold text-ak-brand bg-ak-light px-2 py-0.5 rounded">
                    {formatFarmerAuditAction(r.action)}
                  </code>
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
            <span className="text-sm text-ak-muted">Page {page}</span>
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
      )}
    </>
  )
}

function AuditDetailsCell({ details }) {
  if (details == null || (typeof details === 'object' && !Object.keys(details).length)) {
    return <span className="text-xs text-ak-subtle">—</span>
  }

  return (
    <details className="text-xs max-w-xs">
      <summary className="cursor-pointer font-semibold text-ak-brand hover:underline">
        View
      </summary>
      <pre className="mt-2 max-h-32 overflow-auto rounded-lg border border-ak-border bg-ak-pale p-2 text-[10px] whitespace-pre-wrap break-all">
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
