import { useState } from 'react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'

export function StepUpModal({
  open,
  title = 'Confirm sensitive action',
  description,
  requireReason = true,
  reasonLabel = 'Reason / ticket ID',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const [password, setPassword] = useState('')
  const [reason, setReason] = useState('')

  if (!open) return null

  function handleSubmit(e) {
    e.preventDefault()
    onConfirm({ password, reason: reason.trim() })
  }

  function handleClose() {
    setPassword('')
    setReason('')
    onCancel()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-[60]">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-[var(--radius-ak-card)] shadow-xl max-w-md w-full p-6"
      >
        <h3 className="text-lg font-bold text-ak-text">{title}</h3>
        {description && <p className="text-sm text-ak-muted mt-2">{description}</p>}

        <div className="mt-5 space-y-4">
          {requireReason && (
            <Input
              label={reasonLabel}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="ticket-1042"
              required
            />
          )}
          <Input
            label="Admin password (step-up)"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your login password"
            required
            autoComplete="current-password"
          />
        </div>

        <div className="flex gap-3 mt-6">
          <Button type="button" variant="ghost" className="flex-1" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            variant="danger"
            disabled={loading || !password || (requireReason && !reason.trim())}
          >
            {loading ? 'Confirming…' : 'Confirm'}
          </Button>
        </div>
      </form>
    </div>
  )
}
