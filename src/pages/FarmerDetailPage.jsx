import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fileDsr, getDsrStatus, getFarmer, resendOtp } from '../api/admin'
import { getApiError, resolveApiUrl } from '../api/client'
import { cellValue } from '../utils/format'
import { Header } from '../components/layout/Header'
import { AuthImage } from '../components/ui/AuthImage'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Loading, PageError } from '../components/ui/Loading'
import { Table } from '../components/ui/Table'

const SEVERITY_TONE = {
  low: 'muted',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
}

function isMaskedPhone(phone) {
  return !phone || String(phone).includes('*')
}

function pickMaskedPhone(data) {
  if (data?.phone_masked) return data.phone_masked
  if (isMaskedPhone(data?.phone)) return data.phone
  return null
}

export default function FarmerDetailPage() {
  const { id } = useParams()
  const [farmer, setFarmer] = useState(null)
  const [maskedPhone, setMaskedPhone] = useState(null)
  const [revealedPhone, setRevealedPhone] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [revealing, setRevealing] = useState(false)
  const [piiReason, setPiiReason] = useState('')
  const [actionMsg, setActionMsg] = useState('')
  const [dsrType, setDsrType] = useState('export')
  const [dsrTicket, setDsrTicket] = useState(null)
  const [dsrChecking, setDsrChecking] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    setRevealedPhone(null)
    try {
      const res = await getFarmer(id)
      const data = res.data ?? res
      setFarmer(data)
      setMaskedPhone(pickMaskedPhone(data))
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleRevealPhone() {
    const reason = piiReason.trim()
    if (!reason) return

    setRevealing(true)
    setActionMsg('')
    try {
      const res = await getFarmer(id, { 'X-Access-Reason': reason })
      const data = res.data ?? res

      setFarmer((prev) => ({
        ...prev,
        ...data,
        plots: data.plots ?? prev?.plots,
        detections: data.detections ?? prev?.detections,
      }))

      if (data.phone && !isMaskedPhone(data.phone)) {
        setRevealedPhone(data.phone)
        setActionMsg('Full phone revealed for this session')
      } else {
        setActionMsg('Phone still masked — check role, ticket, or backend PII access')
      }
    } catch (err) {
      setActionMsg(getApiError(err))
    } finally {
      setRevealing(false)
    }
  }

  useEffect(() => {
    load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleResendOtp() {
    setActionMsg('')
    try {
      await resendOtp(id)
      setActionMsg('OTP resent successfully')
    } catch (err) {
      setActionMsg(getApiError(err))
    }
  }

  async function handleDsr() {
    setActionMsg('')
    setDsrTicket(null)
    try {
      const res = await fileDsr(id, { request_type: dsrType })
      const ticket = res.request_id ? res : res.data ?? res
      setDsrTicket({
        request_id: ticket.request_id,
        status: ticket.status ?? 'pending',
        type: ticket.type ?? dsrType,
      })
      setActionMsg('DSR ticket filed — queued for ops')
    } catch (err) {
      setActionMsg(getApiError(err))
    }
  }

  async function handleCheckDsr() {
    if (!dsrTicket?.request_id) return
    setDsrChecking(true)
    setActionMsg('')
    try {
      const res = await getDsrStatus(dsrTicket.request_id)
      const data = res.data ?? res
      setDsrTicket((prev) => ({
        ...prev,
        ...data,
        request_id: data.request_id ?? prev.request_id,
      }))
      setActionMsg(`DSR status: ${data.status ?? 'unknown'}`)
    } catch (err) {
      setActionMsg(getApiError(err))
    } finally {
      setDsrChecking(false)
    }
  }

  const plots = farmer?.plots ?? []
  const detections = farmer?.detections ?? []
  const displayPhone = revealedPhone ?? maskedPhone ?? '—'
  const hasImageTraining =
    farmer?.consent?.imageTraining ?? farmer?.consent?.image_training

  return (
    <>
      <div className="mb-4">
        <Link to="/farmers" className="text-sm font-semibold text-ak-brand hover:underline">
          ← Back to farmers
        </Link>
      </div>

      <Header
        title={farmer?.name ?? 'Farmer detail'}
        subtitle={[farmer?.district, displayPhone !== '—' ? displayPhone : null]
          .filter(Boolean)
          .join(' · ')}
      />

      {loading && <Loading />}
      {error && <PageError message={error} onRetry={() => load()} />}

      {!loading && !error && farmer && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Profile" className="lg:col-span-2">
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <ProfileRow label="Name" value={farmer.name} />
                <ProfileRow label="District" value={farmer.district} />
                <ProfileRow label="Phone" value={displayPhone} highlight={Boolean(revealedPhone)} />
                <ProfileRow label="Locale" value={farmer.locale_code ?? farmer.locale} />
                <ProfileRow label="Farmer ID" value={farmer.id ?? id} mono />
                <ProfileRow label="Role" value={farmer.role ?? 'farmer'} />
              </dl>
            </Card>

            <Card title="Consent">
              <div className="flex flex-wrap gap-2">
                <Badge tone={farmer.consent?.analytics ? 'success' : 'muted'}>Analytics</Badge>
                <Badge tone={hasImageTraining ? 'success' : 'muted'}>Image training</Badge>
              </div>
              <p className="text-xs text-ak-muted mt-4">
                Green = opted in. Full phone requires PII access reason below.
              </p>
            </Card>
          </div>

          <Card
            title={`Plots (${plots.length})`}
            subtitle="Registered land parcels and crops"
          >
            <Table
              emptyMessage="No plots registered"
              columns={[
                {
                  key: 'crop',
                  label: 'Crop',
                  render: (r) => (
                    <span>
                      <span className="font-semibold">{r.crop_name ?? r.cropKey}</span>
                      {r.crop_name_urdu && (
                        <span className="text-ak-muted font-arabic ml-2">({r.crop_name_urdu})</span>
                      )}
                    </span>
                  ),
                },
                {
                  key: 'area',
                  label: 'Area',
                  render: (r) =>
                    r.area_acres != null ? `${r.area_acres} acres` : cellValue(r.area),
                },
                {
                  key: 'health',
                  label: 'Health',
                  render: (r) => (
                    <Badge tone={r.health_status === 'healthy' ? 'success' : 'warning'}>
                      {r.health_status ?? '—'}
                    </Badge>
                  ),
                },
              ]}
              rows={plots}
              keyField="id"
            />
          </Card>

          <Card
            title={`Detections (${detections.length})`}
            subtitle="Species keys and thumbnails when image training consent is granted"
          >
            <Table
              emptyMessage="No detections yet"
              columns={[
                {
                  key: 'photo',
                  label: 'Photo',
                  render: (r) => {
                    if (r.image_available && r.image_url) {
                      return (
                        <AuthImage
                          src={resolveApiUrl(r.image_url)}
                          alt={r.species_key ?? r.speciesKey ?? 'Detection'}
                          className="h-12 w-12 rounded-lg object-cover border border-ak-border"
                        />
                      )
                    }
                    return (
                      <span className="text-xs text-ak-subtle" title="No image training consent">
                        —
                      </span>
                    )
                  },
                },
                {
                  key: 'species_key',
                  label: 'Species key',
                  render: (r) => (
                    <code className="text-sm font-semibold text-ak-brand bg-ak-light px-2 py-0.5 rounded">
                      {r.species_key ?? r.speciesKey}
                    </code>
                  ),
                },
                { key: 'kind', label: 'Kind', render: (r) => r.kind },
                {
                  key: 'confidence',
                  label: 'Confidence',
                  render: (r) => {
                    const c = r.confidence
                    if (c == null) return '—'
                    const pct = `${(c * 100).toFixed(0)}%`
                    const low = c < 0.55
                    return (
                      <span className={low ? 'text-ak-warning font-semibold' : ''}>
                        {pct}
                        {low && (
                          <Badge tone="warning" className="ml-2">
                            low
                          </Badge>
                        )}
                      </span>
                    )
                  },
                },
                {
                  key: 'severity',
                  label: 'Severity',
                  render: (r) => (
                    <Badge tone={SEVERITY_TONE[r.severity] ?? 'muted'}>{r.severity}</Badge>
                  ),
                },
                {
                  key: 'review',
                  label: 'Review',
                  render: (r) => (
                    <Badge tone={r.review_state === 'pending' ? 'warning' : 'muted'}>
                      {r.review_state ?? '—'}
                    </Badge>
                  ),
                },
                {
                  key: 'when',
                  label: 'When',
                  render: (r) => formatTime(r.created_at),
                },
              ]}
              rows={detections}
              keyField="id"
            />
          </Card>

          <Card title="Support actions" subtitle="OTP, PII reveal, and data-subject requests">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="flex flex-col rounded-[var(--radius-ak-card)] border border-ak-border bg-ak-pale/60 p-5">
                <h4 className="text-sm font-bold text-ak-text">Resend OTP</h4>
                <p className="text-xs text-ak-muted mt-1 mb-4 flex-1">
                  Send a new login code to the farmer&apos;s registered phone.
                </p>
                <Button variant="secondary" className="w-full" onClick={handleResendOtp}>
                  Resend OTP
                </Button>
              </div>

              <div className="flex flex-col rounded-[var(--radius-ak-card)] border border-ak-border bg-ak-pale/60 p-5">
                <h4 className="text-sm font-bold text-ak-text">Reveal full phone</h4>
                <p className="text-xs text-ak-muted mt-1 mb-3">
                  Requires a support ticket ID. Updates header and profile phone.
                </p>
                <Input
                  label="PII access reason (ticket id)"
                  value={piiReason}
                  onChange={(e) => setPiiReason(e.target.value)}
                  placeholder="ticket-test-001"
                  className="flex-1"
                />
                <Button
                  variant="soft"
                  className="w-full mt-3"
                  onClick={handleRevealPhone}
                  disabled={!piiReason.trim() || revealing}
                >
                  {revealing ? 'Revealing…' : 'Reveal full phone'}
                </Button>
              </div>

              <div className="flex flex-col rounded-[var(--radius-ak-card)] border border-ak-border bg-ak-pale/60 p-5">
                <h4 className="text-sm font-bold text-ak-text">DSR request</h4>
                <p className="text-xs text-ak-muted mt-1 mb-3">
                  Open a data export or account erasure ticket (queued for ops).
                </p>
                <label className="block text-sm font-semibold text-ak-text mb-1.5">Request type</label>
                <select
                  className="w-full h-14 px-4 rounded-[var(--radius-ak-btn)] border border-ak-border bg-white"
                  value={dsrType}
                  onChange={(e) => setDsrType(e.target.value)}
                >
                  <option value="export">Data export</option>
                  <option value="erase">Account deletion (erase)</option>
                </select>
                <Button variant="danger" className="w-full mt-3" onClick={handleDsr}>
                  File DSR
                </Button>

                {dsrTicket && (
                  <div className="mt-4 p-4 bg-white border border-ak-border rounded-xl text-sm space-y-2">
                    <div className="font-semibold text-ak-text">Ticket opened</div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <Badge tone="muted">{dsrTicket.type}</Badge>
                      <Badge tone={dsrTicket.status === 'pending' ? 'warning' : 'success'}>
                        {dsrTicket.status}
                      </Badge>
                    </div>
                    <code className="block text-xs font-mono break-all text-ak-muted">
                      {dsrTicket.request_id}
                    </code>
                    {dsrTicket.download_url && (
                      <a
                        href={dsrTicket.download_url}
                        className="text-ak-brand font-semibold text-sm hover:underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Download export
                      </a>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full"
                      onClick={handleCheckDsr}
                      disabled={dsrChecking}
                    >
                      {dsrChecking ? 'Checking…' : 'Check status'}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {actionMsg && (
              <p className="mt-6 text-sm text-ak-muted bg-ak-surface rounded-xl px-4 py-3 border border-ak-border">
                {actionMsg}
              </p>
            )}
          </Card>
        </div>
      )}
    </>
  )
}

function ProfileRow({ label, value, mono, highlight }) {
  return (
    <div>
      <dt className="text-ak-muted text-xs font-semibold uppercase tracking-wide">{label}</dt>
      <dd
        className={`font-medium mt-1 ${mono ? 'font-mono text-xs break-all text-ak-text' : ''} ${
          highlight ? 'text-ak-brand font-semibold' : 'text-ak-text'
        }`}
      >
        {cellValue(value)}
      </dd>
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
