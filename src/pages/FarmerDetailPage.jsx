import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  createFarmerNote,
  deleteDetection,
  fileDsr,
  forceEraseFarmer,
  getDsrStatus,
  getFarmer,
  getFarmerNotes,
  getFarmerSessions,
  overrideFarmerConsent,
  patchFarmerProfile,
  resendOtp,
  revokeFarmerSessions,
  suspendFarmer,
  unsuspendFarmer,
} from '../api/admin'
import { getApiError } from '../api/client'
import { StepUpModal } from '../components/farmers/StepUpModal'
import { DetectionsView } from '../components/farmers/DetectionsView'
import { FarmerAnalyticsTab } from '../components/farmers/FarmerAnalyticsTab'
import { FarmerAuditLogTab } from '../components/farmers/FarmerAuditLogTab'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Loading, PageError } from '../components/ui/Loading'
import { PageTabs } from '../components/ui/PageTabs'
import { Table } from '../components/ui/Table'
import { cellValue } from '../utils/format'
import { hasPermission } from '../utils/rbac'
import { buildStepUpHeaders, toAdminRoute } from '../utils/stepUp'

const TAB_PROFILE = 'profile'
const TAB_ANALYTICS = 'analytics'
const TAB_PLOTS = 'plots'
const TAB_DETECTIONS = 'detections'
const TAB_DSR = 'dsr'
const TAB_AUDIT = 'audit'
const TAB_SUPPORT = 'support'
const TAB_ACCOUNT = 'account'

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
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { adminUser } = useAuth()
  const grants = adminUser?.grants ?? []

  const canEditProfile = hasPermission(grants, 'farmers.edit_profile')
  const canConsentOverride = hasPermission(grants, 'farmers.consent_override')
  const canNotesRead = hasPermission(grants, 'farmers.notes.read')
  const canNotesWrite = hasPermission(grants, 'farmers.notes.write')
  const canSessionsRead = hasPermission(grants, 'farmers.sessions.read')
  const canSessionsRevoke = hasPermission(grants, 'farmers.sessions.revoke')
  const canDeleteDetection = hasPermission(grants, 'detections.delete')
  const canSuspend = hasPermission(grants, 'farmers.suspend')
  const canUnsuspend = hasPermission(grants, 'farmers.unsuspend')
  const canForceErase = hasPermission(grants, 'farmers.force_erase')

  const [farmer, setFarmer] = useState(null)
  const [notes, setNotes] = useState([])
  const [sessions, setSessions] = useState([])
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

  const [editProfile, setEditProfile] = useState(null)
  const [consentDraft, setConsentDraft] = useState(null)
  const [noteBody, setNoteBody] = useState('')
  const [noteTicket, setNoteTicket] = useState('')
  const [stepUp, setStepUp] = useState(null)
  const [stepUpLoading, setStepUpLoading] = useState(false)

  async function loadExtras() {
    const tasks = []
    if (canNotesRead) {
      tasks.push(
        getFarmerNotes(id)
          .then((res) => setNotes(res.data?.items ?? res.items ?? []))
          .catch(() => setNotes([])),
      )
    }
    if (canSessionsRead) {
      tasks.push(
        getFarmerSessions(id)
          .then((res) => setSessions(res.data?.items ?? res.items ?? []))
          .catch(() => setSessions([])),
      )
    }
    await Promise.all(tasks)
  }

  async function load() {
    setLoading(true)
    setError('')
    setRevealedPhone(null)
    try {
      const res = await getFarmer(id)
      const data = res.data ?? res
      setFarmer(data)
      setMaskedPhone(pickMaskedPhone(data))
      await loadExtras()
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

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
        setActionMsg('Phone still masked — check role or ticket')
      }
    } catch (err) {
      setActionMsg(getApiError(err))
    } finally {
      setRevealing(false)
    }
  }

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
      await load()
    } catch (err) {
      setActionMsg(getApiError(err))
    }
  }

  async function handleCheckDsr() {
    if (!dsrTicket?.request_id) return
    setDsrChecking(true)
    try {
      const res = await getDsrStatus(dsrTicket.request_id)
      const data = res.data ?? res
      setDsrTicket((prev) => ({ ...prev, ...data, request_id: data.request_id ?? prev.request_id }))
      setActionMsg(`DSR status: ${data.status ?? 'unknown'}`)
    } catch (err) {
      setActionMsg(getApiError(err))
    } finally {
      setDsrChecking(false)
    }
  }

  async function saveProfile() {
    if (!editProfile) return
    try {
      await patchFarmerProfile(id, {
        name: editProfile.name,
        district: editProfile.district,
        locale_code: editProfile.locale_code,
      })
      setEditProfile(null)
      setActionMsg('Profile updated')
      await load()
    } catch (err) {
      alert(getApiError(err))
    }
  }

  async function handleAddNote(e) {
    e.preventDefault()
    if (!noteBody.trim()) return
    try {
      await createFarmerNote(id, {
        body: noteBody.trim(),
        ticket_id: noteTicket.trim() || undefined,
      })
      setNoteBody('')
      setNoteTicket('')
      setActionMsg('Note added')
      await loadExtras()
    } catch (err) {
      alert(getApiError(err))
    }
  }

  async function handleRevokeAllSessions() {
    if (!confirm('Logout farmer from all devices?')) return
    try {
      await revokeFarmerSessions(id, { allDevices: true })
      setActionMsg('All sessions revoked')
      await loadExtras()
    } catch (err) {
      alert(getApiError(err))
    }
  }

  async function handleStepUpConfirm({ password, reason }) {
    if (!stepUp) return
    setStepUpLoading(true)
    try {
      const headers = await buildStepUpHeaders(password)
      await stepUp.run(headers, reason)
      setStepUp(null)
      setActionMsg(stepUp.successMsg ?? 'Action completed')
      if (stepUp.navigateAway) {
        navigate('/farmers')
        return
      }
      await load()
    } catch (err) {
      alert(getApiError(err))
    } finally {
      setStepUpLoading(false)
    }
  }

  async function handleDeleteDetection(detectionId) {
    if (!confirm('Permanently delete this detection?')) return
    setStepUp({
      title: 'Delete detection',
      description: 'Requires super-admin step-up.',
      run: (headers) => deleteDetection(detectionId, headers),
      successMsg: 'Detection deleted',
    })
  }

  const plots = farmer?.plots ?? []
  const detections = farmer?.detections ?? []
  const dsrHistory = farmer?.dsr_history ?? []
  const syncSummary = farmer?.sync_summary
  const displayPhone = revealedPhone ?? maskedPhone ?? '—'
  const hasImageTraining =
    farmer?.consent?.imageTraining ?? farmer?.consent?.image_training
  const recheckPath = toAdminRoute(farmer?.cloud_recheck_queue_path)
  const isSuspended = farmer?.account_status === 'suspended'
  const identity = farmer?.identity

  const showAccountTab = canSuspend || canUnsuspend || canForceErase
  const tabIds = [
    TAB_PROFILE,
    TAB_ANALYTICS,
    TAB_PLOTS,
    TAB_DETECTIONS,
    TAB_DSR,
    TAB_AUDIT,
    TAB_SUPPORT,
    ...(showAccountTab ? [TAB_ACCOUNT] : []),
  ]
  const requestedTab =
    searchParams.get('tab') === 'records' ? TAB_PLOTS : searchParams.get('tab')
  const activeTab = tabIds.includes(requestedTab) ? requestedTab : TAB_PROFILE

  const tabs = [
    { id: TAB_PROFILE, label: 'Profile' },
    { id: TAB_ANALYTICS, label: 'Analytics' },
    { id: TAB_PLOTS, label: `Plots (${plots.length})` },
    { id: TAB_DETECTIONS, label: `Detections (${detections.length})` },
    { id: TAB_DSR, label: `DSR history (${dsrHistory.length})` },
    { id: TAB_AUDIT, label: 'Audit log' },
    { id: TAB_SUPPORT, label: 'Support' },
    ...(showAccountTab ? [{ id: TAB_ACCOUNT, label: 'Account' }] : []),
  ]

  function setTab(tabId) {
    const next = new URLSearchParams(searchParams)
    if (tabId === TAB_PROFILE) {
      next.delete('tab')
    } else {
      next.set('tab', tabId)
    }
    setSearchParams(next, { replace: true })
  }

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
      {error && <PageError message={error} onRetry={load} />}

      {!loading && !error && farmer && (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge tone={isSuspended ? 'danger' : 'success'}>
              {farmer.account_status ?? 'active'}
            </Badge>
            {identity?.status && (
              <Badge tone={identity.status === 'verified' ? 'success' : 'warning'}>
                CNIC {identity.status}
              </Badge>
            )}
            {farmer.cloud_recheck_pending > 0 && (
              <Badge tone="warning">{farmer.cloud_recheck_pending} recheck pending</Badge>
            )}
          </div>

          <PageTabs
            tabs={tabs}
            active={activeTab}
            onChange={setTab}
            className="w-full max-w-full"
          />

          <div className="space-y-6">
            {activeTab === TAB_PROFILE && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card
                    title="Profile"
                    className="lg:col-span-2"
                    action={
                      canEditProfile ? (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() =>
                            setEditProfile({
                              name: farmer.name ?? '',
                              district: farmer.district ?? '',
                              locale_code: farmer.locale_code ?? farmer.locale ?? 'ur',
                            })
                          }
                        >
                          Edit
                        </Button>
                      ) : null
                    }
                  >
                    {identity?.masked_cnic && (
                      <p className="text-sm text-ak-muted mb-4 font-mono">{identity.masked_cnic}</p>
                    )}
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 text-sm">
                      <ProfileRow label="Name" value={farmer.name} />
                      <ProfileRow label="District" value={farmer.district} />
                      <ProfileRow
                        label="Phone"
                        value={displayPhone}
                        highlight={Boolean(revealedPhone)}
                      />
                      <ProfileRow label="Locale" value={farmer.locale_code ?? farmer.locale} />
                      <ProfileRow label="Farmer ID" value={farmer.id ?? id} mono />
                    </dl>
                  </Card>

                  <Card title="Consent">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={farmer.consent?.analytics ? 'success' : 'muted'}>Analytics</Badge>
                      <Badge tone={hasImageTraining ? 'success' : 'muted'}>Image training</Badge>
                    </div>
                    {canConsentOverride && (
                      <Button
                        size="sm"
                        variant="soft"
                        className="w-full mt-4"
                        onClick={() =>
                          setConsentDraft({
                            analytics: Boolean(farmer.consent?.analytics),
                            imageTraining: Boolean(hasImageTraining),
                          })
                        }
                      >
                        Override consent
                      </Button>
                    )}
                  </Card>
                </div>

                {(syncSummary || farmer.cloud_recheck_pending > 0) && (
                  <Card title="Sync & review" subtitle="Offline sync and cloud recheck queue">
                    <div className="flex flex-wrap gap-3">
                      {syncSummary && (
                        <>
                          <SummaryChip label="Synced" value={syncSummary.synced} tone="success" />
                          <SummaryChip label="Pending" value={syncSummary.pending} tone="warning" />
                          <SummaryChip label="Failed" value={syncSummary.failed} tone="danger" />
                        </>
                      )}
                      {farmer.cloud_recheck_pending > 0 && recheckPath && (
                        <Link
                          to={recheckPath}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-ak-warning/10 border border-ak-warning/30 text-sm font-semibold text-ak-text hover:bg-ak-warning/20"
                        >
                          {farmer.cloud_recheck_pending} cloud recheck pending →
                        </Link>
                      )}
                    </div>
                  </Card>
                )}
              </>
            )}

            {activeTab === TAB_ANALYTICS && <FarmerAnalyticsTab farmerId={id} />}

            {activeTab === TAB_PLOTS && (
              <Card title={`Plots (${plots.length})`}>
                <Table
                  emptyMessage="No plots registered"
                  columns={[
                    {
                      key: 'crop',
                      label: 'Crop',
                      render: (r) => r.crop_name ?? r.cropKey ?? '—',
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
            )}

            {activeTab === TAB_DETECTIONS && (
              <DetectionsView
                detections={detections}
                canDelete={canDeleteDetection}
                onDelete={handleDeleteDetection}
              />
            )}

            {activeTab === TAB_DSR && (
              <Card
                title={`DSR history (${dsrHistory.length})`}
                subtitle="Past data-subject requests"
              >
                <Table
                  keyField="request_id"
                  emptyMessage="No DSR history"
                  columns={[
                    { key: 'type', label: 'Type', render: (r) => r.type ?? r.request_type },
                    {
                      key: 'status',
                      label: 'Status',
                      render: (r) => <Badge tone="warning">{r.status}</Badge>,
                    },
                    {
                      key: 'when',
                      label: 'Created',
                      render: (r) => formatTime(r.created_at),
                    },
                    {
                      key: 'id',
                      label: 'Request ID',
                      render: (r) => (
                        <code className="text-xs font-mono text-ak-muted">{r.request_id}</code>
                      ),
                    },
                  ]}
                  rows={dsrHistory}
                />
              </Card>
            )}

            {activeTab === TAB_AUDIT && <FarmerAuditLogTab farmerId={id} />}

            {activeTab === TAB_SUPPORT && (
              <>
                {canNotesRead && (
                  <Card title="Support notes" subtitle="Internal thread (not visible to farmer)">
                    <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                      {notes.length === 0 && (
                        <p className="text-sm text-ak-muted">No notes yet.</p>
                      )}
                      {notes.map((n) => (
                        <div
                          key={n.id ?? n.created_at}
                          className="rounded-xl border border-ak-border bg-ak-pale px-4 py-3 text-sm"
                        >
                          <p className="text-ak-text">{n.body}</p>
                          <p className="text-xs text-ak-muted mt-2">
                            {n.author_email ?? n.author ?? 'staff'} · {formatTime(n.created_at)}
                            {n.ticket_id && ` · ticket ${n.ticket_id}`}
                          </p>
                        </div>
                      ))}
                    </div>
                    {canNotesWrite && (
                      <form onSubmit={handleAddNote} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Input
                          className="sm:col-span-2"
                          label="Note"
                          value={noteBody}
                          onChange={(e) => setNoteBody(e.target.value)}
                          placeholder="Called farmer, OTP resent"
                        />
                        <Input
                          label="Ticket ID (optional)"
                          value={noteTicket}
                          onChange={(e) => setNoteTicket(e.target.value)}
                        />
                        <Button type="submit" className="sm:col-span-3 w-full sm:w-auto">
                          Add note
                        </Button>
                      </form>
                    )}
                  </Card>
                )}

                {canSessionsRead && (
                  <Card
                    title="Active sessions"
                    subtitle="Device logins for this farmer"
                    action={
                      canSessionsRevoke && sessions.length > 0 ? (
                        <Button size="sm" variant="danger" onClick={handleRevokeAllSessions}>
                          Logout all
                        </Button>
                      ) : null
                    }
                  >
                    <Table
                      emptyMessage="No active sessions"
                      keyField="device_id"
                      columns={[
                        {
                          key: 'device',
                          label: 'Device',
                          render: (r) => r.device_id ?? r.deviceId ?? '—',
                        },
                        {
                          key: 'last',
                          label: 'Last seen',
                          render: (r) => formatTime(r.last_seen_at ?? r.lastSeenAt),
                        },
                        {
                          key: 'ip',
                          label: 'IP',
                          render: (r) => r.ip_masked ?? r.ip ?? '—',
                        },
                      ]}
                      rows={sessions}
                    />
                  </Card>
                )}

                <Card title="Support actions">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <SupportPanel title="Resend OTP" onAction={handleResendOtp} label="Resend OTP" />
                    <div className="flex flex-col rounded-[var(--radius-ak-card)] border border-ak-border bg-ak-pale/60 p-5">
                      <h4 className="text-sm font-bold text-ak-text">Reveal full phone</h4>
                      <Input
                        className="mt-3"
                        label="PII ticket"
                        value={piiReason}
                        onChange={(e) => setPiiReason(e.target.value)}
                        placeholder="ticket-test-001"
                      />
                      <Button
                        variant="soft"
                        className="w-full mt-3"
                        onClick={handleRevealPhone}
                        disabled={!piiReason.trim() || revealing}
                      >
                        {revealing ? 'Revealing…' : 'Reveal phone'}
                      </Button>
                    </div>
                    <div className="flex flex-col rounded-[var(--radius-ak-card)] border border-ak-border bg-ak-pale/60 p-5">
                      <h4 className="text-sm font-bold text-ak-text">File DSR</h4>
                      <select
                        className="w-full h-14 px-4 mt-3 rounded-[var(--radius-ak-btn)] border border-ak-border bg-white"
                        value={dsrType}
                        onChange={(e) => setDsrType(e.target.value)}
                      >
                        <option value="export">Data export</option>
                        <option value="erase">Account erasure</option>
                      </select>
                      <Button variant="danger" className="w-full mt-3" onClick={handleDsr}>
                        File DSR
                      </Button>
                      {dsrTicket && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full mt-2"
                          onClick={handleCheckDsr}
                          disabled={dsrChecking}
                        >
                          Check status
                        </Button>
                      )}
                    </div>
                  </div>
                  {actionMsg && (
                    <p className="mt-4 text-sm text-ak-muted bg-ak-surface rounded-xl px-4 py-3 border border-ak-border">
                      {actionMsg}
                    </p>
                  )}
                </Card>
              </>
            )}

            {activeTab === TAB_ACCOUNT && showAccountTab && (
              <Card
                title="Danger zone"
                subtitle="Account suspension and immediate erasure"
                className="border-ak-danger/30"
              >
                <div className="flex flex-wrap gap-3">
                  {canSuspend && !isSuspended && (
                    <Button
                      variant="danger"
                      onClick={() =>
                        setStepUp({
                          title: 'Suspend farmer',
                          description: 'Blocks login and revokes all sessions.',
                          run: (headers, reason) => suspendFarmer(id, { reason }, headers),
                          successMsg: 'Farmer suspended',
                        })
                      }
                    >
                      Suspend account
                    </Button>
                  )}
                  {canUnsuspend && isSuspended && (
                    <Button
                      variant="secondary"
                      onClick={async () => {
                        try {
                          await unsuspendFarmer(id)
                          setActionMsg('Farmer unsuspended')
                          await load()
                        } catch (err) {
                          alert(getApiError(err))
                        }
                      }}
                    >
                      Unsuspend
                    </Button>
                  )}
                  {canForceErase && (
                    <Button
                      variant="danger"
                      onClick={() => {
                        const confirmId = prompt(
                          `Type farmer ID to confirm immediate erase:\n${id}`,
                        )
                        if (confirmId !== id) return
                        setStepUp({
                          title: 'Force erase farmer',
                          description: 'Immediate tombstone — cannot be undone.',
                          run: (headers, reason) =>
                            forceEraseFarmer(id, { reason, confirm: id }, headers),
                          successMsg: 'Farmer erased',
                          navigateAway: true,
                        })
                      }}
                    >
                      Force erase
                    </Button>
                  )}
                </div>
              </Card>
            )}
          </div>
        </>
      )}

      {editProfile && (
        <Modal title="Edit profile" onClose={() => setEditProfile(null)}>
          <Input
            label="Name"
            value={editProfile.name}
            onChange={(e) => setEditProfile((p) => ({ ...p, name: e.target.value }))}
          />
          <Input
            className="mt-3"
            label="District"
            value={editProfile.district}
            onChange={(e) => setEditProfile((p) => ({ ...p, district: e.target.value }))}
          />
          <Input
            className="mt-3"
            label="Locale"
            value={editProfile.locale_code}
            onChange={(e) => setEditProfile((p) => ({ ...p, locale_code: e.target.value }))}
          />
          <div className="flex gap-3 mt-6">
            <Button variant="ghost" className="flex-1" onClick={() => setEditProfile(null)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={saveProfile}>
              Save
            </Button>
          </div>
        </Modal>
      )}

      {consentDraft && (
        <Modal title="Override consent" onClose={() => setConsentDraft(null)}>
          <label className="flex items-center gap-2 text-sm mb-3 cursor-pointer">
            <input
              type="checkbox"
              checked={consentDraft.analytics}
              onChange={(e) =>
                setConsentDraft((c) => ({ ...c, analytics: e.target.checked }))
              }
            />
            Analytics
          </label>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={consentDraft.imageTraining}
              onChange={(e) =>
                setConsentDraft((c) => ({ ...c, imageTraining: e.target.checked }))
              }
            />
            Image training
          </label>
          <Button
            className="w-full mt-6"
            onClick={() => {
              const draft = consentDraft
              setConsentDraft(null)
              setStepUp({
                title: 'Confirm consent override',
                run: (headers, reason) =>
                  overrideFarmerConsent(
                    id,
                    {
                      consentFlags: {
                        analytics: draft.analytics,
                        imageTraining: draft.imageTraining,
                      },
                      reason,
                    },
                    headers,
                  ),
                successMsg: 'Consent updated',
              })
            }}
          >
            Continue (step-up required)
          </Button>
        </Modal>
      )}

      <StepUpModal
        open={Boolean(stepUp)}
        title={stepUp?.title}
        description={stepUp?.description}
        loading={stepUpLoading}
        onConfirm={handleStepUpConfirm}
        onCancel={() => setStepUp(null)}
      />
    </>
  )
}

function ProfileRow({ label, value, mono, highlight }) {
  return (
    <div>
      <dt className="text-ak-muted text-xs font-semibold uppercase tracking-wide">{label}</dt>
      <dd
        className={`font-medium mt-1 ${mono ? 'font-mono text-xs break-all' : ''} ${
          highlight ? 'text-ak-brand font-semibold' : 'text-ak-text'
        }`}
      >
        {cellValue(value)}
      </dd>
    </div>
  )
}

function SummaryChip({ label, value, tone }) {
  const colors = {
    success: 'bg-ak-light text-ak-brand border-ak-border',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    danger: 'bg-red-50 text-ak-danger border-red-200',
  }
  return (
    <div className={`px-4 py-2 rounded-xl border text-sm ${colors[tone] ?? colors.success}`}>
      <span className="text-xs uppercase font-semibold opacity-70">{label}</span>
      <div className="text-xl font-extrabold">{value ?? 0}</div>
    </div>
  )
}

function SupportPanel({ title, label, onAction }) {
  return (
    <div className="flex flex-col rounded-[var(--radius-ak-card)] border border-ak-border bg-ak-pale/60 p-5">
      <h4 className="text-sm font-bold text-ak-text">{title}</h4>
      <Button variant="secondary" className="w-full mt-4" onClick={onAction}>
        {label}
      </Button>
    </div>
  )
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-[var(--radius-ak-card)] shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold text-ak-text mb-4">{title}</h3>
        {children}
      </div>
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
