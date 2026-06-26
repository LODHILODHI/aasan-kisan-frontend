import { useEffect, useState } from 'react'
import { getWeatherFeeds, updateWeather } from '../api/admin'
import { getApiError } from '../api/client'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Select } from '../components/ui/Input'
import { Loading, PageError } from '../components/ui/Loading'
import { Table } from '../components/ui/Table'

const EMPTY_PAYLOAD = {
  currentTemp: 32,
  feelsLike: 34,
  condition: 'clear',
  warning: '',
}

export default function WeatherPage() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [successMsg, setSuccessMsg] = useState('')
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await getWeatherFeeds()
      const data = res.data ?? res
      const items = data.items ?? []
      setRows(Array.isArray(items) ? items : [])
      setTotal(data.total ?? items.length)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function openEdit(row) {
    const payload = row.payload ?? {
      currentTemp: row.current_temp,
      feelsLike: row.feels_like,
      condition: row.condition,
      warning: row.warning,
    }
    setModal({
      district: row.district,
      version: row.version ?? 1,
      name: row.name,
      payload: {
        currentTemp: payload.currentTemp ?? payload.current_temp ?? 32,
        feelsLike: payload.feelsLike ?? payload.feels_like ?? 34,
        condition: payload.condition ?? 'clear',
        warning: payload.warning ?? '',
      },
    })
    setSuccessMsg('')
  }

  function closeModal() {
    setModal(null)
  }

  async function saveModal() {
    if (!modal) return
    setSaving(true)
    try {
      const res = await updateWeather(modal.district, {
        version: modal.version,
        payload: {
          currentTemp: Number(modal.payload.currentTemp),
          feelsLike: Number(modal.payload.feelsLike),
          condition: modal.payload.condition,
          warning: modal.payload.warning || null,
        },
      })
      const updated = res.data ?? res
      setSuccessMsg(
        `${modal.district} saved — ${modal.payload.currentTemp}°C (version ${updated.version ?? modal.version})`,
      )
      closeModal()
      await load()
    } catch (err) {
      alert(getApiError(err))
    } finally {
      setSaving(false)
    }
  }

  function formatUpdated(iso) {
    if (!iso) return '—'
    try {
      return new Date(iso).toLocaleString()
    } catch {
      return iso
    }
  }

  return (
    <>
      <Header
        title="Weather feed"
        subtitle="All district forecasts — edit inline like Mandi feed"
      />

      {successMsg && (
        <p className="mb-4 text-sm font-medium text-ak-brand bg-ak-light border border-ak-border rounded-xl px-4 py-3">
          {successMsg}
        </p>
      )}

      {loading && <Loading />}
      {error && <PageError message={error} onRetry={load} />}

      {!loading && !error && (
        <Card title={`${total} districts`}>
          <Table
            emptyMessage="No weather feeds"
            keyField="district"
            columns={[
              {
                key: 'district',
                label: 'District',
                render: (r) => (
                  <div>
                    <div className="font-semibold text-ak-text">
                      {r.name?.en ?? r.district}
                      {r.name?.ur && (
                        <span className="font-arabic text-ak-muted font-normal ml-2">
                          {r.name.ur}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-ak-muted mt-0.5">{r.code}</div>
                  </div>
                ),
              },
              {
                key: 'region',
                label: 'Region',
                render: (r) => r.region?.en ?? '—',
              },
              {
                key: 'temp',
                label: 'Temp',
                render: (r) => {
                  const t = r.current_temp ?? r.payload?.currentTemp
                  return t != null ? `${t}°C` : '—'
                },
              },
              {
                key: 'feels',
                label: 'Feels',
                render: (r) => {
                  const t = r.feels_like ?? r.payload?.feelsLike
                  return t != null ? `${t}°C` : '—'
                },
              },
              {
                key: 'condition',
                label: 'Condition',
                render: (r) => r.condition ?? r.payload?.condition ?? '—',
              },
              {
                key: 'warning',
                label: 'Warning',
                render: (r) => {
                  const w = r.warning ?? r.payload?.warning
                  return w ? (
                    <Badge tone="warning">{w}</Badge>
                  ) : (
                    <span className="text-ak-muted">—</span>
                  )
                },
              },
              {
                key: 'updated',
                label: 'Updated',
                render: (r) => (
                  <span className="text-xs text-ak-muted whitespace-nowrap">
                    {formatUpdated(r.fetched_at)}
                  </span>
                ),
              },
              {
                key: 'action',
                label: 'Action',
                render: (r) => (
                  <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>
                    Edit
                  </Button>
                ),
              },
            ]}
            rows={rows}
          />
        </Card>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[var(--radius-ak-card)] shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-ak-text mb-1">
              Edit weather — {modal.name?.en ?? modal.district}
            </h3>
            {modal.name?.ur && (
              <p className="text-sm font-arabic text-ak-muted mb-4">{modal.name.ur}</p>
            )}
            <p className="text-xs text-ak-muted mb-5">
              District: <code className="font-mono">{modal.district}</code> · Version{' '}
              {modal.version}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Current temp (°C)"
                type="number"
                value={modal.payload.currentTemp}
                onChange={(e) =>
                  setModal((m) => ({
                    ...m,
                    payload: { ...m.payload, currentTemp: e.target.value },
                  }))
                }
              />
              <Input
                label="Feels like (°C)"
                type="number"
                value={modal.payload.feelsLike}
                onChange={(e) =>
                  setModal((m) => ({
                    ...m,
                    payload: { ...m.payload, feelsLike: e.target.value },
                  }))
                }
              />
              <Input
                label="Condition"
                value={modal.payload.condition}
                onChange={(e) =>
                  setModal((m) => ({
                    ...m,
                    payload: { ...m.payload, condition: e.target.value },
                  }))
                }
              />
              <Select
                label="Warning"
                value={modal.payload.warning ?? ''}
                onChange={(e) =>
                  setModal((m) => ({
                    ...m,
                    payload: { ...m.payload, warning: e.target.value },
                  }))
                }
              >
                <option value="">None</option>
                <option value="frost">Frost</option>
              </Select>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="ghost" className="flex-1" onClick={closeModal} disabled={saving}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={saveModal} disabled={saving}>
                {saving ? 'Saving…' : 'Save feed'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
