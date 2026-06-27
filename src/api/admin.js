import { api } from './client'

export async function devLogin(email, password) {
  const { data } = await api.post('/v1/admin/auth/dev-login', { email, password })
  return data
}

export async function logout() {
  await api.post('/v1/admin/auth/logout')
}

export async function getSyncHealth() {
  const { data } = await api.get('/v1/admin/sync/health')
  return data
}

export async function getAudit(params = {}) {
  const { data } = await api.get('/v1/admin/audit', { params })
  return data
}

export async function getFarmers(params = {}) {
  const { data } = await api.get('/v1/admin/farmers', { params })
  return data
}

export async function exportFarmersCsv(params = {}, headers = {}) {
  const res = await api.get('/v1/admin/farmers/export', {
    params,
    headers,
    responseType: 'blob',
  })
  return res
}

export async function getFarmer(id, headers = {}) {
  const { data } = await api.get(`/v1/admin/farmers/${id}`, { headers })
  return data
}

export async function getFarmerAnalytics(id, days = 30) {
  const { data } = await api.get(`/v1/admin/farmers/${id}/analytics`, {
    params: { days },
  })
  return data
}

export async function getFarmerAuditLog(id, params = {}) {
  const { data } = await api.get(`/v1/admin/farmers/${id}/audit-log`, { params })
  return data
}

export async function getFarmerActionsAuditLog(params = {}) {
  const { data } = await api.get('/v1/admin/audit-log', { params })
  return data
}

export async function createFarmer(body) {
  const { data } = await api.post('/v1/admin/farmers', body)
  return data
}

export async function patchFarmerProfile(id, body) {
  const { data } = await api.patch(`/v1/admin/farmers/${id}`, body)
  return data
}

export async function overrideFarmerConsent(id, body, headers = {}) {
  const { data } = await api.put(`/v1/admin/farmers/${id}/consent`, body, { headers })
  return data
}

export async function getFarmerNotes(id) {
  const { data } = await api.get(`/v1/admin/farmers/${id}/notes`)
  return data
}

export async function createFarmerNote(id, body) {
  const { data } = await api.post(`/v1/admin/farmers/${id}/notes`, body)
  return data
}

export async function getFarmerSessions(id) {
  const { data } = await api.get(`/v1/admin/farmers/${id}/sessions`)
  return data
}

export async function revokeFarmerSessions(id, body) {
  const { data } = await api.post(`/v1/admin/farmers/${id}/sessions/revoke`, body)
  return data
}

export async function suspendFarmer(id, body, headers = {}) {
  const { data } = await api.post(`/v1/admin/farmers/${id}/suspend`, body, { headers })
  return data
}

export async function unsuspendFarmer(id) {
  const { data } = await api.post(`/v1/admin/farmers/${id}/unsuspend`)
  return data
}

export async function forceEraseFarmer(id, body, headers = {}) {
  const { data } = await api.post(`/v1/admin/farmers/${id}/force-erase`, body, { headers })
  return data
}

export async function deleteDetection(id, headers = {}) {
  const { data } = await api.delete(`/v1/admin/detections/${id}`, { headers })
  return data
}

export async function adminStepUp(body) {
  const { data } = await api.post('/v1/admin/auth/stepup', body)
  return data
}

export async function resendOtp(farmerId) {
  const { data } = await api.post(`/v1/admin/farmers/${farmerId}/resend-otp`)
  return data
}

export async function fileDsr(farmerId, body) {
  const { data } = await api.post(`/v1/admin/farmers/${farmerId}/dsr`, body)
  return data
}

export async function getDsrStatus(requestId) {
  const { data } = await api.get(`/v1/admin/dsr/${requestId}`)
  return data
}

export async function getDetections(params = {}) {
  const { data } = await api.get('/v1/admin/detections', { params })
  return data
}

export async function getCloudRecheck(params = {}) {
  const { data } = await api.get('/v1/admin/cloud-recheck', { params })
  return data
}

export async function reviewCloudRecheck(id, body) {
  const { data } = await api.post(`/v1/admin/cloud-recheck/${id}/review`, body)
  return data
}

export async function getPestCatalog() {
  const { data } = await api.get('/v1/admin/catalog/pest')
  return data
}

export async function getPlantCatalog() {
  const { data } = await api.get('/v1/admin/catalog/plant')
  return data
}

export async function updateCatalogSeverity(kind, key, body) {
  const { data } = await api.put(`/v1/admin/catalog/${kind}/${key}/severity`, body)
  return data
}

export async function getAdvice(params = {}) {
  const { data } = await api.get('/v1/admin/advice', { params })
  return data
}

export async function getAdviceItem(id) {
  const { data } = await api.get(`/v1/admin/advice/${id}`)
  return data
}

export async function createAdvice(body, idempotencyKey) {
  const { data } = await api.post('/v1/admin/advice', body, {
    headers: { 'Idempotency-Key': idempotencyKey },
  })
  return data
}

export async function patchAdvice(id, body, version) {
  const { data } = await api.patch(`/v1/admin/advice/${id}`, body, {
    headers: { 'If-Match': String(version) },
  })
  return data
}

export async function adviceAction(id, action) {
  const { data } = await api.post(`/v1/admin/advice/${id}/${action}`)
  return data
}

export async function getMandi(params = {}) {
  const { data } = await api.get('/v1/admin/mandi', { params })
  return data
}

export async function updateMandi(crop, mandi, body) {
  const { data } = await api.put(`/v1/admin/mandi/${crop}/${mandi}`, body)
  return data
}

export async function refreshMandi(scope) {
  const { data } = await api.post('/v1/admin/mandi/refresh', null, {
    params: { scope },
  })
  return data
}

export async function getWeatherFeeds() {
  const { data } = await api.get('/v1/admin/weather/feeds')
  return data
}

export async function getWeatherDistricts() {
  const { data } = await api.get('/v1/admin/weather/districts')
  return data
}

export async function getWeather(params = {}) {
  const { data } = await api.get('/v1/admin/weather', { params })
  return data
}

export async function updateWeather(district, body) {
  const { data } = await api.put(`/v1/admin/weather/${district}`, body)
  return data
}

export async function getLocales() {
  const { data } = await api.get('/v1/admin/locales')
  return data
}

export async function updateLocale(code, body) {
  const { data } = await api.put(`/v1/admin/locales/${code}`, body)
  return data
}

export async function getStrings(params = {}) {
  const { data } = await api.get('/v1/admin/strings', { params })
  return data
}

export async function updateString(locale, key, body) {
  const { data } = await api.put(`/v1/admin/strings/${locale}/${key}`, body)
  return data
}

export async function approveString(locale, key) {
  const { data } = await api.post(`/v1/admin/strings/${locale}/${key}/approve`)
  return data
}

export async function getAdminUsers() {
  const { data } = await api.get('/v1/admin/users')
  return data
}

export async function getRoles() {
  const { data } = await api.get('/v1/admin/roles')
  return data
}

export async function getPestThreshold() {
  const { data } = await api.get('/v1/admin/config/pest-threshold')
  return data
}

export async function updatePestThreshold(body) {
  const { data } = await api.put('/v1/admin/config/pest-threshold', body)
  return data
}

// —— Analytics ——
export async function getAnalyticsOverview() {
  const { data } = await api.get('/v1/admin/analytics/overview')
  return data
}

export async function getAnalyticsConsent() {
  const { data } = await api.get('/v1/admin/analytics/consent')
  return data
}

export async function getAnalyticsTelemetry() {
  const { data } = await api.get('/v1/admin/analytics/telemetry')
  return data
}

export async function getAnalyticsClassifier() {
  const { data } = await api.get('/v1/admin/analytics/classifier')
  return data
}

// —— DSR queue ——
export async function getDsrQueue(params = {}) {
  const { data } = await api.get('/v1/admin/dsr', { params })
  return data
}

export async function patchDsr(requestId, body) {
  const { data } = await api.patch(`/v1/admin/dsr/${requestId}`, body)
  return data
}

export async function createContentRelease(body) {
  const { data } = await api.post('/v1/admin/content-releases', body)
  return data
}

export async function downloadArb(contentVersion) {
  const { data } = await api.get(`/v1/admin/content-releases/${contentVersion}/arb`)
  return data
}
