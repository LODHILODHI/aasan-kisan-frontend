import { useEffect, useState } from 'react'
import {
  createKbSource,
  getKbChunks,
  getKbSources,
  kbRetrieve,
} from '../api/admin'
import { getApiError } from '../api/client'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Select } from '../components/ui/Input'
import { Loading, PageError } from '../components/ui/Loading'
import { Table } from '../components/ui/Table'

export default function KbPage() {
  const [sources, setSources] = useState([])
  const [selected, setSelected] = useState(null)
  const [chunks, setChunks] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [chunksLoading, setChunksLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [newSource, setNewSource] = useState({ title: '', source_type: 'document' })
  const [retrieveQuery, setRetrieveQuery] = useState('cotton aphids')
  const [retrieveResult, setRetrieveResult] = useState(null)

  async function loadSources() {
    setLoading(true)
    setError('')
    try {
      const res = await getKbSources()
      const data = res.data ?? res
      setSources(data.items ?? data.sources ?? [])
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSources()
  }, [])

  async function loadChunks(source) {
    setSelected(source)
    setChunksLoading(true)
    try {
      const res = await getKbChunks(source.id)
      const data = res.data ?? res
      setChunks(data.items ?? data.chunks ?? [])
    } catch (err) {
      alert(getApiError(err))
      setChunks([])
    } finally {
      setChunksLoading(false)
    }
  }

  async function handleCreateSource(e) {
    e.preventDefault()
    try {
      await createKbSource(newSource)
      setSuccessMsg(`Source "${newSource.title}" created`)
      setNewSource({ title: '', source_type: 'document' })
      await loadSources()
    } catch (err) {
      alert(getApiError(err))
    }
  }

  async function handleRetrieve(e) {
    e.preventDefault()
    try {
      const res = await kbRetrieve({ query: retrieveQuery, locale: 'ur', top_k: 5 })
      setRetrieveResult(res.data ?? res)
    } catch (err) {
      alert(getApiError(err))
    }
  }

  return (
    <>
      <Header title="Knowledge base" subtitle="RAG sources, chunks, dry-run retrieve" />

      {successMsg && (
        <p className="mb-4 text-sm font-medium text-ak-brand bg-ak-light border border-ak-border rounded-xl px-4 py-3">
          {successMsg}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card title="Create source">
          <form onSubmit={handleCreateSource} className="space-y-3">
            <Input label="Title" value={newSource.title} onChange={(e) => setNewSource((s) => ({ ...s, title: e.target.value }))} required />
            <Select label="Type" value={newSource.source_type} onChange={(e) => setNewSource((s) => ({ ...s, source_type: e.target.value }))}>
              <option value="document">document</option>
              <option value="faq">faq</option>
            </Select>
            <Button type="submit">Add source</Button>
          </form>
        </Card>

        <Card title="Dry-run retrieve">
          <form onSubmit={handleRetrieve} className="space-y-3">
            <Input label="Query" value={retrieveQuery} onChange={(e) => setRetrieveQuery(e.target.value)} />
            <Button type="submit">Test retrieve</Button>
            {retrieveResult && (
              <pre className="text-xs bg-ak-pale p-3 rounded-xl overflow-auto max-h-48 border border-ak-border">
                {JSON.stringify(retrieveResult, null, 2)}
              </pre>
            )}
          </form>
        </Card>
      </div>

      {loading && <Loading />}
      {error && <PageError message={error} onRetry={loadSources} />}

      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title={`Sources (${sources.length})`}>
            <Table
              keyField="id"
              columns={[
                { key: 'title', label: 'Title', render: (r) => r.title },
                { key: 'type', label: 'Type', render: (r) => r.source_type ?? r.type },
                {
                  key: 'status',
                  label: 'Status',
                  render: (r) => <Badge tone={r.published ? 'success' : 'muted'}>{r.status ?? (r.published ? 'published' : 'draft')}</Badge>,
                },
                {
                  key: 'action',
                  label: '',
                  render: (r) => (
                    <Button size="sm" variant="secondary" onClick={() => loadChunks(r)}>
                      Chunks
                    </Button>
                  ),
                },
              ]}
              rows={sources}
              emptyMessage="No KB sources"
            />
          </Card>

          <Card title={selected ? `Chunks — ${selected.title}` : 'Chunks'}>
            {chunksLoading && <Loading />}
            {!chunksLoading && (
              <Table
                keyField="id"
                columns={[
                  {
                    key: 'text',
                    label: 'Chunk',
                    render: (r) => (
                      <span className="line-clamp-3 text-sm">{r.chunk_text ?? r.text}</span>
                    ),
                  },
                  { key: 'species', label: 'Species', render: (r) => r.mapped_species_key ?? '—' },
                ]}
                rows={chunks}
                emptyMessage={selected ? 'No chunks' : 'Select a source'}
              />
            )}
          </Card>
        </div>
      )}
    </>
  )
}
