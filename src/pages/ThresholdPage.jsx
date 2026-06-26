import { useEffect, useState } from 'react'
import { getPestThreshold, updatePestThreshold } from '../api/admin'
import { getApiError } from '../api/client'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Loading, PageError } from '../components/ui/Loading'

/** API expects 0–1; user may type 0.55 or 55 (percent). */
function normalizeThreshold(raw) {
  const n = Number(raw)
  if (Number.isNaN(n)) return null
  if (n > 1) return n / 100
  return n
}

function formatThresholdDisplay(value) {
  if (value == null || Number.isNaN(value)) return '—'
  return `${value} (${(value * 100).toFixed(0)}%)`
}

export default function ThresholdPage() {
  const [threshold, setThreshold] = useState('0.55')
  const [current, setCurrent] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  async function loadCurrent() {
    setLoading(true)
    setError('')
    try {
      const res = await getPestThreshold()
      const data = res.data ?? res
      const value = data.value ?? data.threshold ?? 0.55
      setCurrent(value)
      setThreshold(String(value))
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCurrent()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    const normalized = normalizeThreshold(threshold)
    if (normalized == null || normalized < 0 || normalized > 1) {
      setMessage('Enter a value between 0–1 (e.g. 0.55) or 0–100 (e.g. 55)')
      return
    }

    setSaving(true)
    setMessage('')
    try {
      const res = await updatePestThreshold({ value: normalized })
      const data = res.data ?? res
      const saved = data.value ?? data.threshold ?? normalized
      setCurrent(saved)
      setThreshold(String(saved))
      setMessage(`Pest threshold saved: ${formatThresholdDisplay(saved)}`)
    } catch (err) {
      setMessage(getApiError(err))
    } finally {
      setSaving(false)
    }
  }

  const preview = normalizeThreshold(threshold)

  return (
    <>
      <Header
        title="Pest threshold"
        subtitle="Pest detections only — plant health has no admin threshold"
      />

      {loading && <Loading />}
      {error && <PageError message={error} onRetry={loadCurrent} />}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Global pest confidence threshold">
            <form onSubmit={handleSubmit} className="space-y-4">
              {current != null && (
                <p className="text-sm text-ak-muted">
                  Current:{' '}
                  <strong className="text-ak-text">{formatThresholdDisplay(current)}</strong>
                </p>
              )}

              <Input
                label="New threshold"
                type="number"
                step="any"
                min="0"
                max="100"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                placeholder="0.55 or 55"
                required
              />

              {preview != null && !Number.isNaN(preview) && (
                <p className="text-xs text-ak-brand bg-ak-light rounded-lg px-3 py-2">
                  Will save as <code className="font-mono">{preview}</code> → API{' '}
                  <code className="font-mono">{`{ "value": ${preview} }`}</code>
                </p>
              )}

              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save threshold'}
              </Button>

              {message && (
                <p
                  className={`text-sm rounded-xl px-4 py-3 ${
                    message.includes('saved')
                      ? 'text-ak-brand bg-ak-light border border-ak-border'
                      : 'text-ak-danger bg-[#feecec]'
                  }`}
                >
                  {message}
                </p>
              )}
            </form>
          </Card>

          <Card title="Scope" subtitle="What this setting affects">
            <div className="space-y-4 text-sm">
              <ScopeRow label="Pest cloud recheck" applies />
              <ScopeRow label="Pest admin threshold" applies />
              <ScopeRow label="Plant health threshold" applies={false} />
              <ScopeRow label="Plant cloud recheck" applies={false} />
              <p className="text-ak-muted text-xs leading-relaxed pt-2 border-t border-ak-border">
                Farmer app reads <code className="bg-ak-surface px-1 rounded">pestConfidenceThreshold</code>{' '}
                from <code className="bg-ak-surface px-1 rounded">GET /v1/config</code>. Queue
                items with confidence below ~0.60 may appear in Cloud Recheck for human review.
              </p>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}

function ScopeRow({ label, applies }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-ak-text">{label}</span>
      <Badge tone={applies ? 'success' : 'muted'}>{applies ? 'Yes' : 'No'}</Badge>
    </div>
  )
}
