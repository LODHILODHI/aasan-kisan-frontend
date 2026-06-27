import { useState } from 'react'
import { Link } from 'react-router-dom'
import { canShowDetectionImage } from '../../utils/detectionImage'
import { toAdminRoute } from '../../utils/stepUp'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { DetectionImageViewer } from '../ui/DetectionImageViewer'
import { DetectionPhoto } from '../ui/DetectionPhoto'
import { Table } from '../ui/Table'

const SEVERITY_TONE = {
  low: 'muted',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
}

export function DetectionsView({ detections, canDelete, onDelete }) {
  const [view, setView] = useState('list')
  const [previewIndex, setPreviewIndex] = useState(null)

  const previewable = detections.filter(canShowDetectionImage)

  function openPreview(row) {
    const idx = previewable.findIndex((d) => d.id === row.id)
    if (idx >= 0) setPreviewIndex(idx)
  }

  function closePreview() {
    setPreviewIndex(null)
  }

  if (!detections.length) {
    return (
      <Card title="Detections (0)">
        <p className="text-sm text-ak-muted py-10 text-center">No detections yet</p>
      </Card>
    )
  }

  return (
    <Card
      title={`Detections (${detections.length})`}
      subtitle={view === 'gallery' ? 'Scanned images with species details' : 'Table view'}
      action={
        <ViewToggle view={view} onChange={setView} />
      }
    >
      {view === 'list' ? (
        <DetectionsList
          detections={detections}
          canDelete={canDelete}
          onDelete={onDelete}
          onPreview={openPreview}
        />
      ) : (
        <DetectionsGallery
          detections={detections}
          canDelete={canDelete}
          onDelete={onDelete}
          onPreview={openPreview}
        />
      )}

      {previewIndex != null && previewable.length > 0 && (
        <DetectionImageViewer
          detections={previewable}
          index={previewIndex}
          onClose={closePreview}
          onNavigate={setPreviewIndex}
        />
      )}
    </Card>
  )
}

function ViewToggle({ view, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-ak-pale border border-ak-border">
      <button
        type="button"
        onClick={() => onChange('list')}
        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
          view === 'list'
            ? 'bg-white text-ak-brand shadow-sm'
            : 'text-ak-muted hover:text-ak-text'
        }`}
      >
        List
      </button>
      <button
        type="button"
        onClick={() => onChange('gallery')}
        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
          view === 'gallery'
            ? 'bg-white text-ak-brand shadow-sm'
            : 'text-ak-muted hover:text-ak-text'
        }`}
      >
        Gallery
      </button>
    </div>
  )
}

function DetectionPhotoButton({ row, onPreview, list = false }) {
  const hasImage = canShowDetectionImage(row)

  if (!hasImage) {
    return <DetectionPhoto row={row} />
  }

  return (
    <button
      type="button"
      onClick={() => onPreview(row)}
      className={`group relative block overflow-hidden rounded-lg cursor-zoom-in ${
        list ? 'h-12 w-12' : 'h-full w-full'
      }`}
      aria-label="View detection image"
    >
      <DetectionPhoto
        row={row}
        className={
          list
            ? 'h-12 w-12 rounded-lg object-cover border border-ak-border transition group-hover:brightness-95'
            : 'h-full w-full object-cover transition group-hover:scale-[1.02]'
        }
      />
      {!list && (
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-ak-text opacity-0 shadow transition group-hover:opacity-100">
            View
          </span>
        </span>
      )}
    </button>
  )
}

function DetectionsList({ detections, canDelete, onDelete, onPreview }) {
  return (
    <Table
      emptyMessage="No detections yet"
      columns={[
        {
          key: 'photo',
          label: 'Photo',
          render: (r) => (
            <DetectionPhotoButton row={r} onPreview={onPreview} list />
          ),
        },
        {
          key: 'species',
          label: 'Species',
          render: (r) => <SpeciesChip row={r} />,
        },
        {
          key: 'confidence',
          label: 'Confidence',
          render: (r) => <ConfidenceText row={r} />,
        },
        {
          key: 'recheck',
          label: 'Recheck',
          render: (r) => <RecheckLink row={r} />,
        },
        {
          key: 'when',
          label: 'When',
          render: (r) => formatTime(r.created_at),
        },
        ...(canDelete
          ? [
              {
                key: 'del',
                label: '',
                render: (r) => (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="!text-ak-danger"
                    onClick={() => onDelete(r.id)}
                  >
                    Delete
                  </Button>
                ),
              },
            ]
          : []),
      ]}
      rows={detections}
      keyField="id"
    />
  )
}

function DetectionsGallery({ detections, canDelete, onDelete, onPreview }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {detections.map((row) => (
        <DetectionGalleryCard
          key={row.id}
          row={row}
          canDelete={canDelete}
          onDelete={onDelete}
          onPreview={onPreview}
        />
      ))}
    </div>
  )
}

function DetectionGalleryCard({ row, canDelete, onDelete, onPreview }) {
  const hasImage = canShowDetectionImage(row)
  const lowConfidence = row.confidence != null && row.confidence < 0.55

  return (
    <article className="flex flex-col rounded-[var(--radius-ak-card)] border border-ak-border bg-ak-pale/40 overflow-hidden shadow-[var(--shadow-ak-card)]">
      <div className="relative aspect-[4/3] bg-ak-surface border-b border-ak-border">
        {hasImage ? (
          <DetectionPhotoButton row={row} onPreview={onPreview} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="text-3xl opacity-40">📷</span>
            <p className="text-xs text-ak-muted">No scan image</p>
            <p className="text-[10px] text-ak-subtle">Image training consent required</p>
          </div>
        )}
        {row.needs_cloud_recheck && (
          <span className="absolute top-2 left-2">
            <Badge tone="warning">Recheck</Badge>
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <SpeciesChip row={row} />
          {row.kind && <Badge tone="muted">{row.kind}</Badge>}
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <div>
            <dt className="text-[10px] font-semibold uppercase text-ak-muted">Confidence</dt>
            <dd className={lowConfidence ? 'font-bold text-ak-warning' : 'font-semibold text-ak-text'}>
              <ConfidenceText row={row} />
            </dd>
          </div>
          {row.severity && (
            <div>
              <dt className="text-[10px] font-semibold uppercase text-ak-muted">Severity</dt>
              <dd>
                <Badge tone={SEVERITY_TONE[row.severity] ?? 'muted'}>{row.severity}</Badge>
              </dd>
            </div>
          )}
          {row.review_state && (
            <div>
              <dt className="text-[10px] font-semibold uppercase text-ak-muted">Review</dt>
              <dd>
                <Badge tone={row.review_state === 'pending' ? 'warning' : 'muted'}>
                  {row.review_state}
                </Badge>
              </dd>
            </div>
          )}
          <div className="col-span-2">
            <dt className="text-[10px] font-semibold uppercase text-ak-muted">Scanned</dt>
            <dd className="text-xs text-ak-muted">{formatTime(row.created_at)}</dd>
          </div>
        </dl>

        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          {row.needs_cloud_recheck && row.cloud_recheck_path && (
            <Link to={toAdminRoute(row.cloud_recheck_path)}>
              <Button size="sm" variant="soft">
                Review in queue
              </Button>
            </Link>
          )}
          {canDelete && (
            <Button
              size="sm"
              variant="ghost"
              className="!text-ak-danger"
              onClick={() => onDelete(row.id)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}

function SpeciesChip({ row }) {
  return (
    <code className="text-sm font-semibold text-ak-brand bg-ak-light px-2 py-0.5 rounded">
      {row.species_key ?? row.speciesKey ?? '—'}
    </code>
  )
}

function ConfidenceText({ row }) {
  if (row.confidence == null) return '—'
  return `${(row.confidence * 100).toFixed(0)}%`
}

function RecheckLink({ row }) {
  if (!row.needs_cloud_recheck || !row.cloud_recheck_path) return '—'
  return (
    <Link
      to={toAdminRoute(row.cloud_recheck_path)}
      className="text-xs font-semibold text-ak-brand hover:underline"
    >
      Review →
    </Link>
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
