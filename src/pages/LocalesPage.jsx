import { useEffect, useState } from 'react'
import { getLocales, updateLocale } from '../api/admin'
import { getApiError } from '../api/client'
import { localizedLabel } from '../utils/format'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Loading, PageError } from '../components/ui/Loading'
import { Table } from '../components/ui/Table'

function LocaleName({ name }) {
  const label = localizedLabel(name)
  if (label && typeof label === 'object' && label.combined) {
    return (
      <span>
        {label.en}
        <span className="font-arabic text-ak-muted ml-2">({label.ur})</span>
      </span>
    )
  }
  return <span>{label}</span>
}

export default function LocalesPage() {
  const [locales, setLocales] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)
  const [successMsg, setSuccessMsg] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await getLocales()
      const data = res.data ?? res
      const list = data.locales ?? data.items ?? data
      setLocales(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function toggle(row) {
    const code = row.code ?? row.locale
    setToggling(code)
    setSuccessMsg('')
    try {
      await updateLocale(code, {
        translated: !row.translated,
        version: row.version ?? 1,
      })
      setSuccessMsg(
        `${code} → IN APP: ${row.translated ? 'no' : 'yes'} (farmer language picker)`,
      )
      await load()
    } catch (err) {
      alert(getApiError(err))
    } finally {
      setToggling(null)
    }
  }

  return (
    <>
      <Header
        title="Locales"
        subtitle="Toggle languages visible in farmer app picker (IN APP = translated)"
      />

      {successMsg && (
        <p className="mb-4 text-sm font-medium text-ak-brand bg-ak-light border border-ak-border rounded-xl px-4 py-3">
          {successMsg}
        </p>
      )}

      {loading && <Loading />}
      {error && <PageError message={error} onRetry={load} />}

      {!loading && !error && (
        <Card title={`${locales.length} locales`}>
          <Table
            keyField="code"
            columns={[
              { key: 'code', label: 'Code', render: (r) => (
                <code className="font-semibold text-ak-brand">{r.code ?? r.locale}</code>
              )},
              { key: 'name', label: 'Name', render: (r) => <LocaleName name={r.name ?? r.label} /> },
              {
                key: 'rtl',
                label: 'RTL',
                render: (r) => (
                  <Badge tone={r.rtl ? 'info' : 'muted'}>{r.rtl ? 'yes' : 'no'}</Badge>
                ),
              },
              {
                key: 'translated',
                label: 'In app',
                render: (r) => (
                  <Badge tone={r.translated ? 'success' : 'muted'}>
                    {r.translated ? 'yes' : 'no'}
                  </Badge>
                ),
              },
              {
                key: 'note',
                label: 'Note',
                render: (r) => (
                  <span className="text-xs text-ak-muted line-clamp-2 max-w-xs">{r.note ?? '—'}</span>
                ),
              },
              {
                key: 'action',
                label: '',
                render: (r) => {
                  const code = r.code ?? r.locale
                  return (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => toggle(r)}
                      disabled={toggling === code}
                    >
                      {toggling === code ? '…' : 'Toggle'}
                    </Button>
                  )
                },
              },
            ]}
            rows={locales}
            emptyMessage="No locales configured"
          />
        </Card>
      )}
    </>
  )
}
