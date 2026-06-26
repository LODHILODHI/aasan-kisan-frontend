import { useEffect, useState } from 'react'
import { getMandi, refreshMandi, updateMandi } from '../api/admin'
import { getApiError } from '../api/client'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Loading, PageError } from '../components/ui/Loading'
import { Table } from '../components/ui/Table'

export default function MandiPage() {
  const [crop, setCrop] = useState('')
  const [mandi, setMandi] = useState('')
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await getMandi({
        crop: crop || undefined,
        mandi: mandi || undefined,
      })
      const list = res.data?.items ?? res.data ?? []
      setRows(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function saveRow(row) {
    const price = prompt('New price per maund', row.price_per_maund ?? row.pricePerMaund)
    if (price == null) return
    try {
      await updateMandi(row.crop_key ?? row.crop, row.mandi_name ?? row.mandi, {
        price_per_maund: Number(price),
        change_pct: row.change_pct ?? 0,
        version: row.version ?? 1,
      })
      load()
    } catch (err) {
      alert(getApiError(err))
    }
  }

  async function handleRefresh() {
    try {
      const res = await refreshMandi(crop || 'all')
      alert(`Refresh job: ${res.job_id ?? JSON.stringify(res)}`)
    } catch (err) {
      alert(getApiError(err))
    }
  }

  return (
    <>
      <Header title="Mandi feed" subtitle="Edit crop prices shown in farmer app" />

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <Input label="Crop" value={crop} onChange={(e) => setCrop(e.target.value)} placeholder="wheat" />
          <Input label="Mandi" value={mandi} onChange={(e) => setMandi(e.target.value)} placeholder="Multan" />
          <Button onClick={load} disabled={loading}>
            Filter
          </Button>
          <Button variant="secondary" onClick={handleRefresh}>
            Refresh feed
          </Button>
        </div>
      </Card>

      {loading && <Loading />}
      {error && <PageError message={error} onRetry={load} />}

      {!loading && !error && (
        <Card title={`${rows.length} price rows`}>
          <Table
            columns={[
              { key: 'crop', label: 'Crop', render: (r) => r.crop_key ?? r.crop },
              { key: 'mandi', label: 'Mandi', render: (r) => r.mandi_name ?? r.mandi },
              {
                key: 'price',
                label: 'Price / maund',
                render: (r) => r.price_per_maund ?? r.pricePerMaund ?? '—',
              },
              {
                key: 'change',
                label: 'Change %',
                render: (r) => (r.change_pct != null ? `${r.change_pct}%` : '—'),
              },
              {
                key: 'edit',
                label: '',
                render: (r) => (
                  <Button size="sm" variant="secondary" onClick={() => saveRow(r)}>
                    Edit
                  </Button>
                ),
              },
            ]}
            rows={rows}
            emptyMessage="No mandi rows"
          />
        </Card>
      )}
    </>
  )
}
