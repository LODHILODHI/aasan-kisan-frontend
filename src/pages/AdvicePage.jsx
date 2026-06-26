import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adviceAction, getAdvice } from '../api/admin'
import { getApiError } from '../api/client'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Input'
import { Loading, PageError } from '../components/ui/Loading'
import { Table } from '../components/ui/Table'

const STATUS_TONE = {
  draft: 'muted',
  in_review: 'info',
  approved: 'success',
  published: 'success',
  rejected: 'danger',
  archived: 'muted',
}

export default function AdvicePage() {
  const [items, setItems] = useState([])
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await getAdvice({ status: status || undefined })
      const list = res.data?.items ?? res.data ?? []
      setItems(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [status])

  async function runAction(id, action) {
    try {
      await adviceAction(id, action)
      load()
    } catch (err) {
      alert(getApiError(err))
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-extrabold text-ak-text tracking-tight">Advice CMS</h1>
          <p className="text-ak-muted text-sm mt-1">Draft → review → approve → publish workflow</p>
        </div>
        <Link to="/advice/new">
          <Button size="sm">New advice</Button>
        </Link>
      </div>

      <Card className="mb-6">
        <Select label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="in_review">In review</option>
          <option value="approved">Approved</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
        </Select>
      </Card>

      {loading && <Loading />}
      {error && <PageError message={error} onRetry={load} />}

      {!loading && !error && (
        <Card title={`${items.length} entries`}>
          <Table
            columns={[
              {
                key: 'species',
                label: 'Species',
                render: (r) => (
                  <Link to={`/advice/${r.id}`} className="text-ak-brand font-semibold hover:underline">
                    {r.species_key ?? r.speciesKey}
                  </Link>
                ),
              },
              { key: 'kind', label: 'Kind', render: (r) => r.kind },
              {
                key: 'status',
                label: 'Status',
                render: (r) => <Badge tone={STATUS_TONE[r.status] ?? 'muted'}>{r.status}</Badge>,
              },
              { key: 'version', label: 'Ver', render: (r) => r.version },
              {
                key: 'actions',
                label: 'Quick actions',
                render: (r) => (
                  <div className="flex flex-wrap gap-1">
                    {r.status === 'draft' && (
                      <Button size="sm" variant="ghost" onClick={() => runAction(r.id, 'submit')}>
                        Submit
                      </Button>
                    )}
                    {r.status === 'in_review' && (
                      <>
                        <Button size="sm" variant="soft" onClick={() => runAction(r.id, 'approve')}>
                          Approve
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => runAction(r.id, 'reject')}>
                          Reject
                        </Button>
                      </>
                    )}
                    {r.status === 'approved' && (
                      <Button size="sm" onClick={() => runAction(r.id, 'publish')}>
                        Publish
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            rows={items}
            emptyMessage="No advice entries"
          />
        </Card>
      )}
    </>
  )
}
