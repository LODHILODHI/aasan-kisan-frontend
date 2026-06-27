import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createFarmer } from '../../api/admin'
import { getApiError } from '../../api/client'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function AddFarmerModal({ open, onClose }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    phone: '',
    name: '',
    district: '',
    locale_code: 'ur',
    analytics: false,
    imageTraining: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await createFarmer({
        phone: form.phone.trim(),
        name: form.name.trim(),
        district: form.district.trim(),
        locale_code: form.locale_code,
        consent: {
          analytics: form.analytics,
          imageTraining: form.imageTraining,
        },
      })
      const created = res.data ?? res
      const farmerId = created.id ?? created.farmer_id
      onClose()
      if (farmerId) navigate(`/farmers/${farmerId}`)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-[var(--radius-ak-card)] shadow-xl max-w-lg w-full p-6"
      >
        <h3 className="text-lg font-bold text-ak-text">Add farmer</h3>
        <p className="text-sm text-ak-muted mt-1">
          Manual registration — farmer completes OTP on first login.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          <Input
            className="sm:col-span-2"
            label="Phone"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
            placeholder="03009998877"
            required
          />
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            required
          />
          <Input
            label="District"
            value={form.district}
            onChange={(e) => update('district', e.target.value)}
            required
          />
          <Input
            label="Locale"
            value={form.locale_code}
            onChange={(e) => update('locale_code', e.target.value)}
            placeholder="ur"
          />
        </div>

        <div className="flex flex-wrap gap-4 mt-4 text-sm">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.analytics}
              onChange={(e) => update('analytics', e.target.checked)}
            />
            Analytics consent
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.imageTraining}
              onChange={(e) => update('imageTraining', e.target.checked)}
            />
            Image training consent
          </label>
        </div>

        {error && <p className="mt-4 text-sm text-ak-danger">{error}</p>}

        <div className="flex gap-3 mt-6">
          <Button type="button" variant="ghost" className="flex-1" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={loading}>
            {loading ? 'Creating…' : 'Create farmer'}
          </Button>
        </div>
      </form>
    </div>
  )
}
