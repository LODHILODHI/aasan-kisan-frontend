import { useEffect, useState } from 'react'
import { approveString, getStrings, updateString } from '../api/admin'
import { getApiError } from '../api/client'
import { stringKey, stringState, stringText } from '../utils/format'
import { Header } from '../components/layout/Header'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Select } from '../components/ui/Input'
import { Loading, PageError } from '../components/ui/Loading'
import { Table } from '../components/ui/Table'

const LOCALE_OPTIONS = ['ur', 'en', 'pa', 'skr', 'sd', 'ps', 'bal']

function isAdviceKey(key) {
  return /advice/i.test(key)
}

export default function StringsPage() {
  const [locale, setLocale] = useState('ur')
  const [prefix, setPrefix] = useState('pest')
  const [strings, setStrings] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [successMsg, setSuccessMsg] = useState('')
  const [editing, setEditing] = useState(null)
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await getStrings({ locale, prefix: prefix || undefined })
      const data = res.data ?? res
      const list = data.items ?? data.strings ?? (Array.isArray(data) ? data : [])
      setStrings(Array.isArray(list) ? list : [])
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function openEdit(row) {
    setEditing(row)
    setEditText(stringText(row))
  }

  function closeEdit() {
    setEditing(null)
    setEditText('')
  }

  async function saveEdit() {
    if (!editing) return
    const key = stringKey(editing)
    setSaving(true)
    try {
      const res = await updateString(locale, key, {
        value: editText,
        version: editing.version ?? 1,
      })
      const data = res.data ?? res
      setSuccessMsg(
        data.status === 'pending_approval' || res.status === 202
          ? `${key} saved — pending agronomist approval`
          : `${key} updated`,
      )
      closeEdit()
      await load()
    } catch (err) {
      alert(getApiError(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleApprove(row) {
    const key = stringKey(row)
    try {
      await approveString(locale, key)
      setSuccessMsg(`${key} approved`)
      await load()
    } catch (err) {
      alert(getApiError(err))
    }
  }

  return (
    <>
      <Header
        title="l10n strings"
        subtitle="Search keys, edit text — Advice keys need agronomist approve"
      />

      <Card className="mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <Select label="Locale" value={locale} onChange={(e) => setLocale(e.target.value)}>
            {LOCALE_OPTIONS.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
          <Input
            label="Key prefix"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value)}
            placeholder="pest"
            className="min-w-[160px] flex-1"
          />
          <Button onClick={load} disabled={loading}>
            Search
          </Button>
        </div>
      </Card>

      {successMsg && (
        <p className="mb-4 text-sm font-medium text-ak-brand bg-ak-light border border-ak-border rounded-xl px-4 py-3">
          {successMsg}
        </p>
      )}

      {loading && <Loading />}
      {error && <PageError message={error} onRetry={load} />}

      {!loading && !error && (
        <Card title={`${strings.length} strings`}>
          <Table
            keyField="key"
            columns={[
              {
                key: 'key',
                label: 'Key',
                render: (r) => (
                  <code className="text-xs font-semibold text-ak-brand bg-ak-light px-2 py-0.5 rounded break-all">
                    {stringKey(r)}
                  </code>
                ),
              },
              {
                key: 'value',
                label: 'Text',
                render: (r) => (
                  <span className="line-clamp-2 max-w-md font-arabic text-ak-text">
                    {stringText(r) || '—'}
                  </span>
                ),
              },
              {
                key: 'state',
                label: 'State',
                render: (r) => {
                  const state = stringState(r)
                  return (
                    <Badge
                      tone={
                        state === 'published'
                          ? 'success'
                          : state === 'pending_approval'
                            ? 'warning'
                            : 'muted'
                      }
                    >
                      {state}
                    </Badge>
                  )
                },
              },
              {
                key: 'actions',
                label: '',
                render: (r) => (
                  <div className="flex flex-wrap gap-1">
                    <Button size="sm" variant="secondary" onClick={() => openEdit(r)}>
                      Edit
                    </Button>
                    {isAdviceKey(stringKey(r)) && stringState(r) === 'pending_approval' && (
                      <Button size="sm" variant="soft" onClick={() => handleApprove(r)}>
                        Approve
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
            rows={strings}
            emptyMessage="No strings match filter"
          />
        </Card>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[var(--radius-ak-card)] shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-bold text-ak-text mb-1">Edit string</h3>
            <code className="text-xs text-ak-muted break-all">{stringKey(editing)}</code>
            <p className="text-sm text-ak-muted mt-2 mb-4">
              Locale: <strong>{locale}</strong>
              {isAdviceKey(stringKey(editing)) && (
                <span className="text-ak-warning"> · Advice key may need approval</span>
              )}
            </p>
            <label className="block text-sm font-semibold text-ak-text mb-1.5">Text</label>
            <textarea
              className="w-full min-h-[120px] px-4 py-3 rounded-[var(--radius-ak-btn)] border border-ak-border font-arabic outline-none focus:border-ak-brand"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
            />
            <div className="flex gap-3 mt-6">
              <Button variant="ghost" className="flex-1" onClick={closeEdit} disabled={saving}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
