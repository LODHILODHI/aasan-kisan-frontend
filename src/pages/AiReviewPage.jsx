import { useEffect, useState } from 'react'
import {
  adjudicateAiReviewItem,
  assignAiReviewItem,
  getAiReviewItems,
  labelAiReviewItem,
} from '../api/admin'
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

export default function AiReviewPage() {
  const [items, setItems] = useState([])
  const [state, setState] = useState('pending')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [successMsg, setSuccessMsg] = useState('')
  const [modal, setModal] = useState(null)
  const [labelForm, setLabelForm] = useState({ species_key: '', severity: 'medium', note_key: '' })
  const [verdict, setVerdict] = useState('confirm')
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await getAiReviewItems({ state, page_size: 50 })
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
  }, [state]) // eslint-disable-line react-hooks/exhaustive-deps

  function openItem(row) {
    setModal(row)
    setLabelForm({
      species_key: row.species_key ?? '',
      severity: row.severity ?? 'medium',
      note_key: row.note_key ?? '',
    })
    setVerdict('confirm')
  }

  async function handleAssign() {
    if (!modal) return
    setSubmitting(true)
    try {
      await assignAiReviewItem(modal.id)
      setSuccessMsg('Assigned to you')
      await load()
      setModal(null)
    } catch (err) {
      alert(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLabel() {
    if (!modal) return
    setSubmitting(true)
    try {
      await labelAiReviewItem(modal.id, labelForm)
      setSuccessMsg('Label saved')
      await load()
      setModal(null)
    } catch (err) {
      alert(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAdjudicate() {
    if (!modal) return
    setSubmitting(true)
    try {
      await adjudicateAiReviewItem(modal.id, {
        verdict,
        species_key: labelForm.species_key,
        severity: labelForm.severity,
      })
      setSuccessMsg(`Adjudicated: ${verdict}`)
      await load()
      setModal(null)
    } catch (err) {
      alert(getApiError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Header title="AI review queue" subtitle="Phase 3 human review for low-confidence ingest" />

      <Card className="mb-6">
        <Select label="State filter" value={state} onChange={(e) => setState(e.target.value)}>
          <option value="pending">Pending</option>
          <option value="assigned">Assigned</option>
          <option value="labeled">Labeled</option>
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
            keyField="id"
            columns={[
              {
                key: 'species',
                label: 'Species',
                render: (r) => (
                  <code className="text-sm font-semibold text-ak-brand bg-ak-light px-2 py-0.5 rounded">
                    {r.species_key}
                  </code>
                ),
              },
              {
                key: 'confidence',
                label: 'Confidence',
                render: (r) =>
                  r.confidence != null ? `${(r.confidence * 100).toFixed(0)}%` : '—',
              },
              { key: 'kind', label: 'Kind', render: (r) => r.kind },
              { key: 'district', label: 'District', render: (r) => cellValue(r.district) },
              {
                key: 'state',
                label: 'State',
                render: (r) => <Badge tone="warning">{r.state}</Badge>,
              },
              {
                key: 'image',
                label: 'Photo',
                render: (r) => <DetectionPhoto row={r} />,
              },
              {
                key: 'action',
                label: '',
                render: (r) => (
                  <Button size="sm" variant="secondary" onClick={() => openItem(r)}>
                    Review
                  </Button>
                ),
              },
            ]}
            rows={items}
            emptyMessage="Queue is empty"
          />
        </Card>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-[var(--radius-ak-card)] shadow-xl max-w-lg w-full p-6 my-8">
            <h3 className="text-lg font-bold text-ak-text">Review item</h3>
            <p className="text-xs font-mono text-ak-muted break-all mt-1">{modal.id}</p>
            <p className="text-sm text-ak-muted mt-2">
              {modal.district} · {modal.locale_code} · confidence{' '}
              {modal.confidence != null ? `${(modal.confidence * 100).toFixed(0)}%` : '—'}
            </p>

            <DetectionImagePanel
              row={modal}
              title="Training image (consent granted)"
            />
            {!canShowDetectionImage(modal) && (
              <p className="mt-4 text-xs text-ak-muted rounded-xl border border-ak-border bg-ak-pale px-3 py-2">
                {modal.has_image && !modal.consent_training
                  ? 'Image exists but farmer has not granted training consent.'
                  : 'No training image attached to this review item.'}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
              <Input
                label="Species key"
                value={labelForm.species_key}
                onChange={(e) => setLabelForm((f) => ({ ...f, species_key: e.target.value }))}
              />
              <Select
                label="Severity"
                value={labelForm.severity}
                onChange={(e) => setLabelForm((f) => ({ ...f, severity: e.target.value }))}
              >
                {['low', 'medium', 'high', 'critical'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
              <Input
                className="sm:col-span-2"
                label="Note key (l10n)"
                value={labelForm.note_key}
                onChange={(e) => setLabelForm((f) => ({ ...f, note_key: e.target.value }))}
                placeholder="reviewNoteAphids"
              />
            </div>

            <Select className="mt-4" label="Adjudicate verdict" value={verdict} onChange={(e) => setVerdict(e.target.value)}>
              <option value="confirm">Confirm</option>
              <option value="reject">Reject</option>
            </Select>

            <div className="flex flex-wrap gap-2 mt-6">
              <Button size="sm" variant="secondary" onClick={handleAssign} disabled={submitting}>
                Assign
              </Button>
              <Button size="sm" variant="soft" onClick={handleLabel} disabled={submitting}>
                Save label
              </Button>
              <Button size="sm" onClick={handleAdjudicate} disabled={submitting}>
                Adjudicate
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setModal(null)} disabled={submitting}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
