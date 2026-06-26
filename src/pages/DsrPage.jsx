import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDsrQueue, patchDsr } from '../api/admin'
import { getApiError } from '../api/client'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Input'
import { Loading, PageError } from '../components/ui/Loading'
import { Table } from '../components/ui/Table'

const STATUS_TONE = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  rejected: 'danger',
}

export default function DsrPage() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('pending')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [successMsg, setSuccessMsg] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await getDsrQueue({ status: status || undefined })
      const data = res.data ?? res
      setItems(data.items ?? [])
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [status]) // eslint-disable-line react-hooks/exhaustive-deps

  async function updateStatus(row, newStatus) {
    try {
      await patchDsr(row.request_id, { status: newStatus })
      setSuccessMsg(`${row.request_id.slice(0, 8)}… → ${newStatus}`)
      await load()
    } catch (err) {
      alert(getApiError(err))
    }
  }

  return (
    <>
      <Header title="DSR queue" subtitle="Data subject requests — export & erasure tickets" />

      <Card className="mb-6">
        <Select label="Status filter" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="rejected">Rejected</option>
          <option value="">All</option>
        </Select>
      </Card>

      {successMsg && (
        <p className="mb-4 text-sm font-medium text-ak-brand bg-ak-light border border-ak-border rounded-xl px-4 py-3">
          {successMsg}
        </p>
      )}

      {loading && <Loading />}
      {error && <PageError message={error} onRetry={load} />}

      {!loading && !error && (
        <Card title={`${items.length} requests`}>
          <Table
            keyField="request_id"
            columns={[
              {
                key: 'farmer',
                label: 'Farmer',
                render: (r) => (
                  <Link to={`/farmers/${r.farmer_id}`} className="font-semibold text-ak-brand hover:underline">
                    {r.farmer_name ?? r.farmer_id?.slice(0, 8)}
                  </Link>
                ),
              },
              { key: 'phone', label: 'Phone', render: (r) => r.phone_masked ?? '—' },
              { key: 'type', label: 'Type', render: (r) => <Badge tone="muted">{r.type}</Badge> },
              {
                key: 'status',
                label: 'Status',
                render: (r) => <Badge tone={STATUS_TONE[r.status] ?? 'muted'}>{r.status}</Badge>,
              },
              {
                key: 'created',
                label: 'Created',
                render: (r) => new Date(r.created_at).toLocaleString(),
              },
              {
                key: 'actions',
                label: '',
                render: (r) =>
                  r.status === 'pending' ? (
                    <div className="flex gap-1">
                      <Button size="sm" variant="soft" onClick={() => updateStatus(r, 'processing')}>
                        Process
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => updateStatus(r, 'completed')}>
                        Complete
                      </Button>
                    </div>
                  ) : null,
              },
            ]}
            rows={items}
            emptyMessage="No DSR tickets"
          />
        </Card>
      )}
    </>
  )
}
