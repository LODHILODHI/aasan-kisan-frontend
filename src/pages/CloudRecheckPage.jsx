import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getCloudRecheck, reviewCloudRecheck } from '../api/admin'
import { getApiError } from '../api/client'
import { cellValue } from '../utils/format'
import { canShowDetectionImage } from '../utils/detectionImage'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { DetectionImagePanel, DetectionPhoto } from '../components/ui/DetectionPhoto'
import { Input, Select } from '../components/ui/Input'
import { Loading, PageError } from '../components/ui/Loading'
import { Table } from '../components/ui/Table'

function queueState(row) {
  return row.review_state ?? row.status ?? '—'
}

function stateTone(state) {
  if (state === 'pending') return 'warning'
  if (state === 'auto') return 'info'
  if (state === 'confirmed' || state === 'reviewed') return 'success'
  return 'muted'
}

export default function CloudRecheckPage() {
  const [searchParams] = useSearchParams()
  const farmerId = searchParams.get('farmerId') ?? ''
  const highlightId = searchParams.get('highlight') ?? ''

  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState('pending')
  const [reviewing, setReviewing] = useState(null)
  const [verdict, setVerdict] = useState('confirm')
  const [speciesKey, setSpeciesKey] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await getCloudRecheck({
        status,
        farmerId: farmerId || undefined,
      })
      const list = res.data?.items ?? res.data ?? res.items ?? []
      setItems(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [status, farmerId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!highlightId || !items.length) return
    const row = items.find((r) => r.id === highlightId)
    if (row) openReview(row)
  }, [highlightId, items]) // eslint-disable-line react-hooks/exhaustive-deps

  function openReview(row) {
    setReviewing(row)
    setVerdict('confirm')
    setSpeciesKey(row.species_key ?? row.speciesKey ?? '')
    setSuccessMsg('')
  }

  function closeReview() {
    setReviewing(null)
    setVerdict('confirm')
    setSpeciesKey('')
  }

  async function submitReview() {
    if (!reviewing?.id) return
    if (verdict === 'reclassify' && !speciesKey.trim()) {
      alert('Species key required for reclassify')
      return
    }

    setSubmitting(true)
    try {
      await reviewCloudRecheck(reviewing.id, {
        verdict,
        species_key: verdict === 'reclassify' ? speciesKey.trim() : undefined,
      })
      closeReview()
      setSuccessMsg('Review saved — queue updated')
      await load()
    } catch (err) {
      alert(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header
        title="Cloud recheck"
        subtitle={
          farmerId
            ? `Filtered to farmer ${farmerId.slice(0, 8)}… — low-confidence pest detections`
            : 'Review low-confidence pest detections'
        }
      />

      {farmerId && (
        <p className="mb-4 text-sm">
          <Link to="/cloud-recheck" className="text-ak-brand font-semibold hover:underline">
            Clear farmer filter
          </Link>
        </p>
      )}

      <Card className="mb-6">
        <Select label="Status filter" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="reviewed">Reviewed</option>
          <option value="all">All</option>
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
        <Card title={`Queue (${items.length})`}>
          <Table
            columns={[
              {
                key: 'photo',
                label: 'Photo',
                render: (r) => <DetectionPhoto row={r} />,
              },
              {
                key: 'farmer',
                label: 'Farmer',
                render: (r) => {
                  const farmerId = r.farmer_id ?? r.farmerId
                  const name = r.farmer_name ?? r.farmerName ?? 'Unknown'
                  return farmerId ? (
                    <Link
                      to={`/farmers/${farmerId}`}
                      className="font-semibold text-ak-brand hover:underline"
                    >
                      {name}
                    </Link>
                  ) : (
                    <span className="font-semibold text-ak-text">{name}</span>
                  )
                },
              },
              {
                key: 'phone',
                label: 'Phone',
                render: (r) => (
                  <span className="text-ak-muted">{r.phone_masked ?? r.phone ?? '—'}</span>
                ),
              },
              {
                key: 'district',
                label: 'District',
                render: (r) => cellValue(r.district),
              },
              {
                key: 'species',
                label: 'Species',
                render: (r) => (
                  <code className="text-sm font-semibold text-ak-brand bg-ak-light px-2 py-0.5 rounded">
                    {r.species_key ?? r.speciesKey ?? '—'}
                  </code>
                ),
              },
              {
                key: 'confidence',
                label: 'Confidence',
                render: (r) => {
                  const c = r.confidence
                  if (c == null) return '—'
                  const pct = `${(c * 100).toFixed(0)}%`
                  return c < 0.55 ? (
                    <span className="font-semibold text-ak-warning">{pct}</span>
                  ) : (
                    pct
                  )
                },
              },
              {
                key: 'status',
                label: 'Status',
                render: (r) => {
                  const state = queueState(r)
                  return <Badge tone={stateTone(state)}>{state}</Badge>
                },
              },
              {
                key: 'id',
                label: 'Detection ID',
                render: (r) => (
                  <code className="text-xs font-mono text-ak-muted break-all">{r.id}</code>
                ),
              },
              {
                key: 'actions',
                label: '',
                render: (r) => (
                  <Button size="sm" variant="secondary" onClick={() => openReview(r)}>
                    Review
                  </Button>
                ),
              },
            ]}
            rows={items}
            emptyMessage="Queue is empty"
            rowClassName={(r) =>
              r.id === highlightId ? 'bg-ak-light ring-1 ring-inset ring-ak-brand/40' : ''
            }
          />
        </Card>
      )}

      {reviewing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-[var(--radius-ak-card)] shadow-xl max-w-lg w-full p-6 my-8">
            <h3 className="text-lg font-bold text-ak-text mb-1">Review detection</h3>
            <p className="text-sm text-ak-text mb-1">
              Farmer:{' '}
              {reviewing.farmer_id ? (
                <Link
                  to={`/farmers/${reviewing.farmer_id}`}
                  className="font-semibold text-ak-brand hover:underline"
                >
                  {reviewing.farmer_name ?? reviewing.farmerName ?? 'Unknown'}
                </Link>
              ) : (
                <span className="font-semibold">
                  {reviewing.farmer_name ?? reviewing.farmerName ?? 'Unknown'}
                </span>
              )}
              <span className="text-ak-muted">
                {' '}
                · {reviewing.phone_masked ?? reviewing.phone ?? '—'} · {reviewing.district ?? '—'}
              </span>
            </p>
            <p className="text-xs font-mono text-ak-muted break-all mb-4">{reviewing.id}</p>

            <DetectionImagePanel row={reviewing} title="Review photo (image training consent granted)" />
            {!canShowDetectionImage(reviewing) && (
              <p className="mb-4 text-xs text-ak-muted rounded-xl border border-ak-border bg-ak-pale px-3 py-2">
                No training image — farmer has not granted image training consent.
              </p>
            )}

            <dl className="grid grid-cols-2 gap-3 text-sm mb-5 p-4 bg-ak-pale rounded-xl border border-ak-border">
              <div>
                <dt className="text-ak-muted text-xs uppercase">Species</dt>
                <dd className="font-semibold">{reviewing.species_key ?? reviewing.speciesKey}</dd>
              </div>
              <div>
                <dt className="text-ak-muted text-xs uppercase">Confidence</dt>
                <dd className="font-semibold">
                  {reviewing.confidence != null
                    ? `${(reviewing.confidence * 100).toFixed(0)}%`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-ak-muted text-xs uppercase">Status</dt>
                <dd>
                  <Badge tone={stateTone(queueState(reviewing))}>{queueState(reviewing)}</Badge>
                </dd>
              </div>
              <div>
                <dt className="text-ak-muted text-xs uppercase">District</dt>
                <dd className="font-semibold">{reviewing.district ?? '—'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-ak-muted text-xs uppercase">Phone (masked)</dt>
                <dd className="text-ak-muted">{reviewing.phone_masked ?? reviewing.phone ?? '—'}</dd>
              </div>
            </dl>

            <Select label="Verdict" value={verdict} onChange={(e) => setVerdict(e.target.value)}>
              <option value="confirm">Confirm (species is correct)</option>
              <option value="reclassify">Reclassify (wrong label)</option>
            </Select>

            {verdict === 'reclassify' && (
              <Input
                className="mt-3"
                label="New species key"
                value={speciesKey}
                onChange={(e) => setSpeciesKey(e.target.value)}
                placeholder="whitefly"
                required
              />
            )}

            <div className="flex gap-3 mt-6">
              <Button variant="ghost" className="flex-1" onClick={closeReview} disabled={submitting}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={submitReview} disabled={submitting}>
                {submitting ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
