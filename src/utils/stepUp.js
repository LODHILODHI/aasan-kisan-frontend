import { adminStepUp } from '../api/admin'
import { getApiError } from '../api/client'

export async function buildStepUpHeaders(password) {
  const res = await adminStepUp({ password })
  return { 'X-Stepup-Token': res.stepup_token }
}

export async function runStepUpAction(password, action) {
  try {
    const headers = await buildStepUpHeaders(password)
    return await action(headers)
  } catch (err) {
    throw new Error(getApiError(err))
  }
}

/** Normalize API path like /cloud-recheck?farmerId=x to React route */
export function toAdminRoute(path) {
  if (!path) return null
  if (path.startsWith('/cloud-recheck')) return path
  if (path.startsWith('/v1/admin')) return path.replace('/v1/admin', '') || '/'
  return path
}
