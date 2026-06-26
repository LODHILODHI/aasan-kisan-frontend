import { useEffect, useState } from 'react'
import { getPestCatalog, getPlantCatalog, updateCatalogSeverity } from '../api/admin'
import { getApiError } from '../api/client'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Input'
import { Loading, PageError } from '../components/ui/Loading'
import { Table } from '../components/ui/Table'

const SEVERITIES = ['low', 'medium', 'high', 'critical']

function speciesKey(row) {
  return row.key ?? row.species_key ?? row.speciesKey
}

function normalizeSpecies(row) {
  return { ...row, key: speciesKey(row) }
}

export default function CatalogPage() {
  const [tab, setTab] = useState('pest')
  const [pest, setPest] = useState([])
  const [plant, setPlant] = useState({ diseases: [], nutrients: [] })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [pestRes, plantRes] = await Promise.all([getPestCatalog(), getPlantCatalog()])
      const pestData = pestRes.data ?? pestRes
      const plantData = plantRes.data ?? plantRes
      const pestList = pestData.species ?? pestData.items ?? pestData.pests ?? []
      setPest((Array.isArray(pestList) ? pestList : []).map(normalizeSpecies))
      setPlant({
        diseases: (plantData.diseases ?? []).map(normalizeSpecies),
        nutrients: (plantData.nutrients ?? []).map(normalizeSpecies),
      })
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function changeSeverity(kind, row, newSeverity) {
    const key = speciesKey(row)
    if (!key || newSeverity === row.severity) return

    setSavingKey(key)
    setSuccessMsg('')
    try {
      const res = await updateCatalogSeverity(kind, key, {
        severity: newSeverity,
        version: row.version ?? 1,
      })
      const updated = res.data ?? res
      setSuccessMsg(
        `${key} severity → ${updated.severity ?? newSeverity} (version ${updated.version ?? '—'})`,
      )
      await load()
    } catch (err) {
      alert(getApiError(err))
    } finally {
      setSavingKey(null)
    }
  }

  const plantRows = [...plant.diseases, ...plant.nutrients]

  return (
    <>
      <Header
        title="Catalog"
        subtitle="Species severity for pest & plant detection — optimistic locking via version"
      />

      <div className="flex gap-2 mb-6">
        {['pest', 'plant'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full text-sm font-semibold capitalize transition-colors cursor-pointer ${
              tab === t ? 'bg-ak-brand text-white' : 'bg-white text-ak-muted border border-ak-border'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {successMsg && (
        <p className="mb-4 text-sm font-medium text-ak-brand bg-ak-light border border-ak-border rounded-xl px-4 py-3">
          {successMsg}
        </p>
      )}

      {loading && <Loading />}
      {error && <PageError message={error} onRetry={load} />}

      {!loading && !error && (
        <Card title={tab === 'pest' ? 'Pest catalog' : 'Plant catalog'}>
          <Table
            columns={[
              {
                key: 'key',
                label: 'Species key',
                render: (r) => (
                  <code className="text-sm font-semibold text-ak-brand bg-ak-light px-2 py-0.5 rounded">
                    {speciesKey(r)}
                  </code>
                ),
              },
              {
                key: 'severity',
                label: 'Severity',
                render: (r) => (
                  <Badge
                    tone={
                      r.severity === 'critical'
                        ? 'danger'
                        : r.severity === 'high'
                          ? 'warning'
                          : 'success'
                    }
                  >
                    {r.severity}
                  </Badge>
                ),
              },
              { key: 'version', label: 'Version', render: (r) => r.version ?? 1 },
              {
                key: 'edit',
                label: 'Change',
                render: (r) => {
                  const key = speciesKey(r)
                  return (
                    <Select
                      value={r.severity}
                      disabled={savingKey === key}
                      onChange={(e) =>
                        changeSeverity(tab === 'pest' ? 'pest' : 'disease', r, e.target.value)
                      }
                      className="!mb-0 min-w-[140px]"
                    >
                      {SEVERITIES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </Select>
                  )
                },
              },
            ]}
            rows={tab === 'pest' ? pest : plantRows}
            emptyMessage="No catalog entries"
            keyField="key"
          />
        </Card>
      )}
    </>
  )
}
