export const FARMER_AUDIT_ACTIONS = [
  { value: '', label: 'Any action' },
  { value: 'edit_profile', label: 'Edit profile' },
  { value: 'consent_override', label: 'Consent override' },
  { value: 'resend_otp', label: 'Resend OTP' },
  { value: 'suspend', label: 'Suspend' },
  { value: 'unsuspend', label: 'Unsuspend' },
  { value: 'force_erase', label: 'Force erase' },
  { value: 'create_farmer', label: 'Create farmer' },
  { value: 'add_note', label: 'Add note' },
  { value: 'revoke_session', label: 'Revoke session' },
  { value: 'delete_detection', label: 'Delete detection' },
  { value: 'file_dsr', label: 'File DSR' },
  { value: 'dsr_status_change', label: 'DSR status change' },
]

const ACTION_LABELS = Object.fromEntries(
  FARMER_AUDIT_ACTIONS.filter((a) => a.value).map((a) => [a.value, a.label]),
)

export function formatFarmerAuditAction(action) {
  if (!action) return '—'
  return ACTION_LABELS[action] ?? String(action).replace(/_/g, ' ')
}

export function formatAuditDetails(details) {
  if (details == null) return '—'
  if (typeof details === 'string') return details
  try {
    return JSON.stringify(details, null, 2)
  } catch {
    return String(details)
  }
}
