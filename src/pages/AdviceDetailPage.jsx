import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { adviceAction, createAdvice, getAdviceItem, patchAdvice } from '../api/admin'
import { getApiError } from '../api/client'
import { Header } from '../components/layout/Header'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input, Select } from '../components/ui/Input'
import { Loading, PageError } from '../components/ui/Loading'

const EMPTY_FORM = {
  speciesKey: '',
  kind: 'pest',
  l10nLabelKey: '',
  l10nAdviceKey: '',
  labelText: '',
  adviceText: '',
}

export default function AdviceDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'new'
  const [item, setItem] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isNew) return
    setLoading(true)
    getAdviceItem(id)
      .then((res) => {
        const data = res.data ?? res
        setItem(data)
        const ur = data.translations?.find((t) => t.locale === 'ur') ?? data.translations?.[0]
        setForm({
          speciesKey: data.species_key ?? data.speciesKey ?? '',
          kind: data.kind ?? 'pest',
          l10nLabelKey: data.l10n_label_key ?? data.l10nLabelKey ?? '',
          l10nAdviceKey: data.l10n_advice_key ?? data.l10nAdviceKey ?? '',
          labelText: ur?.label_text ?? ur?.labelText ?? '',
          adviceText: ur?.advice_text ?? ur?.adviceText ?? '',
        })
      })
      .catch((err) => setError(getApiError(err)))
      .finally(() => setLoading(false))
  }, [id, isNew])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const body = {
        speciesKey: form.speciesKey,
        kind: form.kind,
        l10nLabelKey: form.l10nLabelKey,
        l10nAdviceKey: form.l10nAdviceKey,
        translations: [
          {
            locale: 'ur',
            labelText: form.labelText,
            adviceText: form.adviceText,
            translationState: 'machine_draft',
          },
        ],
      }
      if (isNew) {
        const res = await createAdvice(body, crypto.randomUUID())
        const newId = res.data?.id ?? res.id
        navigate(`/advice/${newId}`, { replace: true })
      } else {
        await patchAdvice(id, body, item.version ?? item.data?.version ?? 1)
        const res = await getAdviceItem(id)
        setItem(res.data ?? res)
      }
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setSaving(false)
    }
  }

  async function workflow(action) {
    try {
      await adviceAction(id, action)
      const res = await getAdviceItem(id)
      setItem(res.data ?? res)
    } catch (err) {
      alert(getApiError(err))
    }
  }

  return (
    <>
      <div className="mb-4">
        <Link to="/advice" className="text-sm font-semibold text-ak-brand hover:underline">
          ← Back to advice list
        </Link>
      </div>

      <Header
        title={isNew ? 'New advice' : `Advice: ${form.speciesKey || id}`}
        subtitle={item?.status ? `Status: ${item.status}` : 'Create catalog-linked advice'}
      />

      {loading && <Loading />}
      {error && <PageError message={error} />}

      {!loading && (
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Content" className="lg:col-span-2">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Species key"
                  value={form.speciesKey}
                  onChange={(e) => update('speciesKey', e.target.value)}
                  required
                />
                <Select label="Kind" value={form.kind} onChange={(e) => update('kind', e.target.value)}>
                  <option value="pest">Pest</option>
                  <option value="disease">Disease</option>
                  <option value="general">General</option>
                </Select>
              </div>
              <Input
                label="l10n label key"
                value={form.l10nLabelKey}
                onChange={(e) => update('l10nLabelKey', e.target.value)}
              />
              <Input
                label="l10n advice key"
                value={form.l10nAdviceKey}
                onChange={(e) => update('l10nAdviceKey', e.target.value)}
              />
              <Input
                label="Label (Urdu)"
                value={form.labelText}
                onChange={(e) => update('labelText', e.target.value)}
              />
              <label className="block">
                <span className="block text-sm font-semibold text-ak-text mb-1.5">Advice text (Urdu)</span>
                <textarea
                  className="w-full min-h-[120px] px-4 py-3 rounded-[var(--radius-ak-btn)] border border-ak-border outline-none focus:border-ak-brand"
                  value={form.adviceText}
                  onChange={(e) => update('adviceText', e.target.value)}
                />
              </label>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : isNew ? 'Create' : 'Save draft'}
              </Button>
            </div>
          </Card>

          {!isNew && item && (
            <Card title="Workflow">
              <div className="space-y-2">
                {['submit', 'approve', 'reject', 'publish', 'archive'].map((action) => (
                  <Button
                    key={action}
                    variant={action === 'reject' || action === 'archive' ? 'ghost' : 'secondary'}
                    className="w-full capitalize"
                    type="button"
                    onClick={() => workflow(action)}
                  >
                    {action}
                  </Button>
                ))}
              </div>
            </Card>
          )}
        </form>
      )}
    </>
  )
}
