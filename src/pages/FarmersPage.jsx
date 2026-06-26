import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getFarmers } from '../api/admin'
import { getApiError } from '../api/client'
import { cellValue } from '../utils/format'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Loading, PageError } from '../components/ui/Loading'
import { Table } from '../components/ui/Table'

export default function FarmersPage() {
  const [phone, setPhone] = useState('')
  const [district, setDistrict] = useState('')
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load(p = page) {
    setLoading(true)
    setError('')
    try {
      const res = await getFarmers({
        phone: phone || undefined,
        district: district || undefined,
        page: p,
        page_size: 20,
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

  const items = data?.items ?? data?.farmers ?? []

  return (
    <>
      <Header title="Farmers" subtitle="Search and support registered farmers" />

      <Card className="mb-6">
        <form
          className="flex flex-wrap gap-4 items-end"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            load(1)
          }}
        >
          <Input
            label="Phone"
            placeholder="03xx…"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="min-w-[180px] flex-1"
          />
          <Input
            label="District"
            placeholder="Multan"
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="min-w-[180px] flex-1"
          />
          <Button type="submit" disabled={loading}>
            Search
          </Button>
        </form>
      </Card>

      {loading && <Loading />}
      {error && <PageError message={error} onRetry={() => load(page)} />}

      {!loading && !error && (
        <Card title={`${data?.total ?? items.length} farmers`}>
          <Table
            columns={[
              {
                key: 'name',
                label: 'Name',
                render: (r) => {
                  const farmerId = cellValue(r.id ?? r.farmer_id, '')
                  return (
                    <Link
                      to={`/farmers/${farmerId}`}
                      className="font-semibold text-ak-text hover:text-ak-brand hover:underline"
                    >
                      {cellValue(r.name, '—')}
                    </Link>
                  )
                },
              },
              {
                key: 'phone',
                label: 'Phone',
                render: (r) => cellValue(r.phone_masked ?? r.phone),
              },
              { key: 'district', label: 'District', render: (r) => cellValue(r.district) },
              { key: 'plots', label: 'Plots', render: (r) => r.plot_count ?? '—' },
              { key: 'detections', label: 'Detections', render: (r) => r.detection_count ?? '—' },
              {
                key: 'consent',
                label: 'Consent',
                render: (r) => (
                  <div className="flex flex-wrap gap-1">
                    <Badge tone={r.consent?.analytics ? 'success' : 'muted'}>
                      {r.consent?.analytics ? 'analytics' : 'limited'}
                    </Badge>
                    {(r.consent?.imageTraining ?? r.consent?.image_training) && (
                      <Badge tone="success">training</Badge>
                    )}
                  </div>
                ),
              },
              {
                key: 'view',
                label: '',
                render: (r) => {
                  const farmerId = cellValue(r.id ?? r.farmer_id, '')
                  return (
                    <Link to={`/farmers/${farmerId}`}>
                      <Button size="sm" variant="secondary">
                        View
                      </Button>
                    </Link>
                  )
                },
              },
            ]}
            rows={items}
            keyField="id"
            emptyMessage="No farmers match your search"
          />

          <div className="flex justify-between items-center mt-4 pt-4 border-t border-ak-border">
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
              disabled={items.length < 20}
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
