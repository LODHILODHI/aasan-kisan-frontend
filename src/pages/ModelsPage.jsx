import { useEffect, useState } from 'react'
import {
  getModels,
  promoteModel,
  registerModel,
  rollbackModel,
  stageModel,
} from '../api/admin'
import { getApiError } from '../api/client'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Select } from '../components/ui/Input'
import { Loading, PageError } from '../components/ui/Loading'
import { Table } from '../components/ui/Table'

const STATUS_TONE = {
  active: 'success',
  production: 'success',
  staged: 'warning',
  retired: 'muted',
}

export default function ModelsPage() {
  const [models, setModels] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [successMsg, setSuccessMsg] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [form, setForm] = useState({
    name: '',
    kind: 'pest',
    artifact_uri: '/uploads/models/pest_v2.tflite',
    sha256: '',
    size_bytes: 2100000,
    semver: '2.0.0',
  })

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await getModels()
      const data = res.data ?? res
      const items = data.items ?? []
      setModels(Array.isArray(items) ? items : [])
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleRegister(e) {
    e.preventDefault()
    try {
      await registerModel({
        ...form,
        size_bytes: Number(form.size_bytes),
      })
      setSuccessMsg(`Model ${form.name} registered`)
      setShowRegister(false)
      await load()
    } catch (err) {
      alert(getApiError(err))
    }
  }

  async function handleStage(model) {
    const pct = prompt('Rollout percent (1–100)', '10')
    if (pct == null) return
    try {
      await stageModel(model.id, { rollout_pct: Number(pct) })
      setSuccessMsg(`${model.name} staged at ${pct}%`)
      await load()
    } catch (err) {
      alert(getApiError(err))
    }
  }

  async function handlePromote(model) {
    if (!confirm(`Promote ${model.name} to production?`)) return
    try {
      await promoteModel(model.id)
      setSuccessMsg(`${model.name} promoted`)
      await load()
    } catch (err) {
      alert(getApiError(err))
    }
  }

  async function handleRollback(model) {
    if (!confirm(`Rollback ${model.name}?`)) return
    try {
      await rollbackModel(model.id)
      setSuccessMsg(`${model.name} rolled back`)
      await load()
    } catch (err) {
      alert(getApiError(err))
    }
  }

  return (
    <>
      <Header title="Model registry" subtitle="TFLite versions — stage, promote, rollback" />

      <div className="mb-6">
        <Button size="sm" onClick={() => setShowRegister((v) => !v)}>
          {showRegister ? 'Cancel register' : 'Register model'}
        </Button>
      </div>

      {successMsg && (
        <p className="mb-4 text-sm font-medium text-ak-brand bg-ak-light border border-ak-border rounded-xl px-4 py-3">
          {successMsg}
        </p>
      )}

      {showRegister && (
        <Card title="Register new version" className="mb-6">
          <form onSubmit={handleRegister} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            <Select label="Kind" value={form.kind} onChange={(e) => setForm((f) => ({ ...f, kind: e.target.value }))}>
              <option value="pest">pest</option>
              <option value="plant">plant</option>
            </Select>
            <Input label="Semver" value={form.semver} onChange={(e) => setForm((f) => ({ ...f, semver: e.target.value }))} />
            <Input label="Artifact URI" value={form.artifact_uri} onChange={(e) => setForm((f) => ({ ...f, artifact_uri: e.target.value }))} />
            <Input label="SHA256" value={form.sha256} onChange={(e) => setForm((f) => ({ ...f, sha256: e.target.value }))} />
            <Input label="Size (bytes)" type="number" value={form.size_bytes} onChange={(e) => setForm((f) => ({ ...f, size_bytes: e.target.value }))} />
            <div className="sm:col-span-2 flex gap-3">
              <Button type="submit">Register</Button>
              <Button type="button" variant="ghost" onClick={() => setShowRegister(false)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      {loading && <Loading />}
      {error && <PageError message={error} onRetry={load} />}

      {!loading && !error && (
        <div className="space-y-6">
          {models.map((model) => (
            <Card key={model.id} title={model.name} subtitle={`${model.kind} · ${model.status}`}>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge tone={STATUS_TONE[model.status] ?? 'muted'}>{model.status}</Badge>
                <code className="text-xs text-ak-muted">{model.id}</code>
              </div>
              <Table
                keyField="version_id"
                emptyMessage="No versions"
                columns={[
                  { key: 'semver', label: 'Version', render: (v) => v.semver },
                  {
                    key: 'status',
                    label: 'Status',
                    render: (v) => <Badge tone={STATUS_TONE[v.status] ?? 'muted'}>{v.status}</Badge>,
                  },
                  { key: 'rollout', label: 'Rollout', render: (v) => `${v.rollout_pct ?? 0}%` },
                  { key: 'uri', label: 'Artifact', render: (v) => <code className="text-xs">{v.artifact_uri}</code> },
                  {
                    key: 'acc',
                    label: 'Accuracy',
                    render: (v) => v.metrics?.accuracyProxy ?? '—',
                  },
                ]}
                rows={model.versions ?? []}
              />
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-ak-border">
                <Button size="sm" variant="secondary" onClick={() => handleStage(model)}>Stage</Button>
                <Button size="sm" variant="soft" onClick={() => handlePromote(model)}>Promote</Button>
                <Button size="sm" variant="ghost" onClick={() => handleRollback(model)}>Rollback</Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
