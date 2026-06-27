const ROLE_PERMISSIONS = {
  super_admin: ['*'],
  ops_officer: [
    'farmers.read_list',
    'farmers.read_single',
    'farmers.edit_profile',
    'farmers.create',
    'farmers.suspend',
    'farmers.unsuspend',
    'farmers.notes.read',
    'farmers.notes.write',
    'farmers.sessions.read',
    'farmers.sessions.revoke',
    'sync.read',
    'mandi_feed.read',
    'mandi_feed.refresh',
    'weather_feed.read',
    'weather_feed.refresh',
    'cloud_recheck.read',
    'audit.read',
    'analytics.read',
    'dsr.read_list',
    'dsr.execute',
  ],
  agronomist: [
    'catalog.read',
    'catalog.edit_severity',
    'advice_content.read',
    'advice_content.edit',
    'advice_content.approve',
    'advice_content.publish',
    'cloud_recheck.read',
    'cloud_recheck.review',
    'detections.read',
    'models.set_threshold',
    'analytics.read',
  ],
  content_manager: [
    'catalog.read',
    'advice_content.read',
    'advice_content.edit',
    'advice_content.publish',
    'l10n.read',
    'l10n.edit',
  ],
  support: [
    'farmers.read_list',
    'farmers.read_single',
    'farmers.read_pii',
    'farmers.edit_profile',
    'farmers.consent_override',
    'farmers.notes.read',
    'farmers.notes.write',
    'farmers.sessions.read',
    'farmers.sessions.revoke',
    'otp.resend',
    'farmers.dsr_file',
    'dsr.read_list',
  ],
  auditor: [
    'audit.read',
    'farmers.read_list',
    'farmers.read_single',
    'farmers.notes.read',
    'mandi_feed.read',
    'weather_feed.read',
    'catalog.read',
    'advice_content.read',
    'sync.read',
    'analytics.read',
    'dsr.read_list',
  ],
}

export function derivePermissions(grants = []) {
  const perms = new Set()
  for (const { role } of grants) {
    const rolePerms = ROLE_PERMISSIONS[role] || []
    for (const p of rolePerms) perms.add(p)
  }
  return perms
}

export function hasPermission(grants, permission) {
  const perms = derivePermissions(grants)
  return perms.has('*') || perms.has(permission)
}

export function canAccessRoute(grants, routePermission) {
  if (!routePermission) return true
  return hasPermission(grants, routePermission)
}
