import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { exportFarmersCsv, getFarmers } from '../api/admin'
import { getApiError } from '../api/client'
import { cellValue } from '../utils/format'
import { hasPermission } from '../utils/rbac'
import { parseContentDispositionFilename, triggerBlobDownload } from '../utils/download'
import { AddFarmerModal } from '../components/farmers/AddFarmerModal'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Select } from '../components/ui/Input'
import { Loading, PageError } from '../components/ui/Loading'
import { Table } from '../components/ui/Table'

const EMPTY_FILTERS = {
  phone: '',
  district: '',
  consent: '',
  identity_status: '',
  account_status: '',
  sync: '',
  sort: 'created_at',
}

export default function FarmersPage() {
  const { adminUser } = useAuth()
  const grants = adminUser?.grants ?? []
  const canCreate = hasPermission(grants, 'farmers.create')

  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  function buildListParams() {
    return {
      phone: filters.phone || undefined,
      district: filters.district || undefined,
      consent: filters.consent || undefined,
      identity_status: filters.identity_status || undefined,
      account_status: filters.account_status || undefined,
      sync: filters.sync || undefined,
      sort: filters.sort || undefined,
    }
  }

  async function load(p = page) {
    setLoading(true)
    setError('')
    try {
      const res = await getFarmers({
        ...buildListParams(),
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

  function updateFilter(key, value) {
    setFilters((f) => ({ ...f, [key]: value }))
  }

  async function handleExportCsv() {
    setExporting(true)
    setExportError('')
    try {
      const res = await exportFarmersCsv(buildListParams())
      const filename = parseContentDispositionFilename(
        res.headers['content-disposition'],
        `farmers-export-${Date.now()}.csv`,
      )
      triggerBlobDownload(res.data, filename)
    } catch (err) {
      setExportError(getApiError(err))
    } finally {
      setExporting(false)
    }
  }

  return (
    <>
      <Header
        title="Farmers"
        subtitle="Search, filter, and support registered farmers"
        action={
          canCreate ? (
            <Button size="sm" onClick={() => setShowAdd(true)}>
              Add farmer
            </Button>
          ) : null
        }
      />

      <Card className="mb-6">
        <form
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
          onSubmit={(e) => {
            e.preventDefault()
            setPage(1)
            load(1)
          }}
        >
          <Input
            label="Phone"
            placeholder="03xx…"
            value={filters.phone}
            onChange={(e) => updateFilter('phone', e.target.value)}
          />
          <Input
            label="District"
            placeholder="Multan"
            value={filters.district}
            onChange={(e) => updateFilter('district', e.target.value)}
          />
          <Select
            label="Consent"
            value={filters.consent}
            onChange={(e) => updateFilter('consent', e.target.value)}
          >
            <option value="">Any</option>
            <option value="analytics">Analytics</option>
            <option value="training">Image training</option>
            <option value="limited">Limited</option>
          </Select>
          <Select
            label="Identity"
            value={filters.identity_status}
            onChange={(e) => updateFilter('identity_status', e.target.value)}
          >
            <option value="">Any</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </Select>
          <Select
            label="Account"
            value={filters.account_status}
            onChange={(e) => updateFilter('account_status', e.target.value)}
          >
            <option value="">Any</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </Select>
          <Select
            label="Sync"
            value={filters.sync}
            onChange={(e) => updateFilter('sync', e.target.value)}
          >
            <option value="">Any</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </Select>
          <Select
            label="Sort"
            value={filters.sort}
            onChange={(e) => updateFilter('sort', e.target.value)}
          >
            <option value="created_at">Newest</option>
            <option value="name">Name</option>
            <option value="detections">Detections</option>
          </Select>
          <Button type="submit" disabled={loading}>
            Search
          </Button>
          <Button
            type="button"
            variant="secondary"
            disabled={exporting || loading}
            onClick={handleExportCsv}
          >
            {exporting ? 'Exporting…' : 'Export CSV'}
          </Button>
        </form>
        {exportError && (
          <p className="mt-3 text-sm text-ak-danger">{exportError}</p>
        )}
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
              {
                key: 'account',
                label: 'Account',
                render: (r) => (
                  <Badge tone={r.account_status === 'suspended' ? 'danger' : 'success'}>
                    {r.account_status ?? 'active'}
                  </Badge>
                ),
              },
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
            emptyMessage="No farmers match your filters"
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

      <AddFarmerModal open={showAdd} onClose={() => setShowAdd(false)} />
    </>
  )
}
