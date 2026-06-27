import { useEffect, useState } from 'react'
import { Badge } from './Badge'
import { DetectionPhoto } from './DetectionPhoto'

const SEVERITY_TONE = {
  low: 'muted',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
}

export function DetectionImageViewer({ detections, index, onClose, onNavigate }) {
  const [size, setSize] = useState('panel')
  const row = detections[index]
  const hasPrev = index > 0
  const hasNext = index < detections.length - 1

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft' && hasPrev) onNavigate(index - 1)
      if (e.key === 'ArrowRight' && hasNext) onNavigate(index + 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, hasPrev, hasNext, onClose, onNavigate])

  if (!row) return null

  const isFullscreen = size === 'fullscreen'

  return (
    <div
      className={`fixed inset-0 z-[60] flex ${
        isFullscreen ? 'bg-black/95' : 'items-center justify-center bg-black/45 p-4 sm:p-8'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Detection image viewer"
      onClick={onClose}
    >
      <div
        className={`relative flex flex-col overflow-hidden ${
          isFullscreen
            ? 'h-full w-full'
            : 'w-full max-w-5xl max-h-[88vh] rounded-[var(--radius-ak-card)] border border-white/20 bg-white shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <ViewerToolbar
          size={size}
          onSize={setSize}
          onClose={onClose}
          index={index}
          total={detections.length}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPrev={() => onNavigate(index - 1)}
          onNext={() => onNavigate(index + 1)}
          dark={isFullscreen}
        />

        <div
          className={`flex flex-1 min-h-0 ${
            isFullscreen ? 'flex-col lg:flex-row' : 'flex-col md:flex-row'
          }`}
        >
          <div
            className={`flex flex-1 items-center justify-center min-h-0 ${
              isFullscreen ? 'bg-black p-4 lg:p-6' : 'bg-ak-pale p-4 md:p-6'
            }`}
          >
            <DetectionPhoto
              row={row}
              className={`max-h-full w-full object-contain ${
                isFullscreen ? 'max-h-[calc(100vh-12rem)] lg:max-h-[calc(100vh-5rem)]' : 'max-h-[50vh] md:max-h-[58vh]'
              }`}
            />
          </div>

          <ViewerMeta row={row} fullscreen={isFullscreen} />
        </div>
      </div>
    </div>
  )
}

function ViewerToolbar({
  size,
  onSize,
  onClose,
  index,
  total,
  hasPrev,
  hasNext,
  onPrev,
  onNext,
  dark,
}) {
  const bar = dark
    ? 'border-white/10 bg-black/80 text-white'
    : 'border-ak-border bg-white text-ak-text'
  const btn = dark
    ? 'text-white/80 hover:bg-white/10 hover:text-white'
    : 'text-ak-muted hover:bg-ak-pale hover:text-ak-text'
  const active = dark ? 'bg-white/15 text-white' : 'bg-ak-brand text-white'

  return (
    <div className={`flex flex-wrap items-center gap-2 border-b px-3 py-2 sm:px-4 ${bar}`}>
      <div className="flex items-center gap-1 mr-auto">
        <IconButton
          label="Previous"
          disabled={!hasPrev}
          onClick={onPrev}
          className={btn}
        >
          ‹
        </IconButton>
        <span className={`text-xs font-semibold px-2 ${dark ? 'text-white/70' : 'text-ak-muted'}`}>
          {index + 1} / {total}
        </span>
        <IconButton label="Next" disabled={!hasNext} onClick={onNext} className={btn}>
          ›
        </IconButton>
      </div>

      <div className="flex items-center gap-1 rounded-xl border border-inherit p-0.5">
        <button
          type="button"
          onClick={() => onSize('panel')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
            size === 'panel' ? active : btn
          }`}
          title="Panel view — background stays visible"
        >
          Panel
        </button>
        <button
          type="button"
          onClick={() => onSize('fullscreen')}
          className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${
            size === 'fullscreen' ? active : btn
          }`}
          title="Fullscreen"
        >
          Full screen
        </button>
      </div>

      <IconButton label="Close" onClick={onClose} className={btn}>
        ✕
      </IconButton>
    </div>
  )
}

function IconButton({ children, label, onClick, disabled, className = '' }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`h-8 min-w-8 rounded-lg text-lg font-bold leading-none transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  )
}

function ViewerMeta({ row, fullscreen }) {
  const lowConfidence = row.confidence != null && row.confidence < 0.55
  const panel = fullscreen
    ? 'border-white/10 bg-black/60 text-white lg:w-72 lg:border-l lg:border-t-0 border-t'
    : 'border-ak-border bg-white md:w-72 md:border-l md:border-t-0 border-t'

  return (
    <aside className={`shrink-0 p-4 sm:p-5 ${panel}`}>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <code
          className={`text-sm font-semibold px-2 py-0.5 rounded ${
            fullscreen ? 'bg-white/10 text-white' : 'bg-ak-light text-ak-brand'
          }`}
        >
          {row.species_key ?? row.speciesKey ?? '—'}
        </code>
        {row.kind && <Badge tone="muted">{row.kind}</Badge>}
        {row.needs_cloud_recheck && <Badge tone="warning">Recheck</Badge>}
      </div>

      <dl className="space-y-3 text-sm">
        <MetaRow
          label="Confidence"
          fullscreen={fullscreen}
          value={
            row.confidence != null ? (
              <span className={lowConfidence ? 'font-bold text-ak-warning' : 'font-semibold'}>
                {(row.confidence * 100).toFixed(0)}%
              </span>
            ) : (
              '—'
            )
          }
        />
        {row.severity && (
          <MetaRow
            label="Severity"
            fullscreen={fullscreen}
            value={<Badge tone={SEVERITY_TONE[row.severity] ?? 'muted'}>{row.severity}</Badge>}
          />
        )}
        {row.review_state && (
          <MetaRow
            label="Review"
            fullscreen={fullscreen}
            value={
              <Badge tone={row.review_state === 'pending' ? 'warning' : 'muted'}>
                {row.review_state}
              </Badge>
            }
          />
        )}
        <MetaRow
          label="Scanned"
          fullscreen={fullscreen}
          value={formatTime(row.created_at)}
        />
      </dl>

      <p className={`mt-4 text-[10px] ${fullscreen ? 'text-white/50' : 'text-ak-subtle'}`}>
        Esc to close · ← → to navigate
      </p>
    </aside>
  )
}

function MetaRow({ label, value, fullscreen }) {
  return (
    <div>
      <dt
        className={`text-[10px] font-semibold uppercase ${
          fullscreen ? 'text-white/50' : 'text-ak-muted'
        }`}
      >
        {label}
      </dt>
      <dd className={`mt-0.5 ${fullscreen ? 'text-white/90' : 'text-ak-text'}`}>{value}</dd>
    </div>
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
