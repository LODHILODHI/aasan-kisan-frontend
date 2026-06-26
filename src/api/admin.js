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

export async function getFarmer(id, headers = {}) {
  const { data } = await api.get(`/v1/admin/farmers/${id}`, { headers })
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

// —— Phase 3: Models ——
export async function getModels() {
  const { data } = await api.get('/v1/admin/models')
  return data
}

export async function registerModel(body) {
  const { data } = await api.post('/v1/admin/models', body)
  return data
}

export async function stageModel(id, body) {
  const { data } = await api.post(`/v1/admin/models/${id}/stage`, body)
  return data
}

export async function promoteModel(id, body = {}) {
  const { data } = await api.post(`/v1/admin/models/${id}/promote`, body)
  return data
}

export async function rollbackModel(id, body = {}) {
  const { data } = await api.post(`/v1/admin/models/${id}/rollback`, body)
  return data
}

// —— Phase 3: AI review ——
export async function getAiReviewItems(params = {}) {
  const { data } = await api.get('/v1/admin/ai/review/items', { params })
  return data
}

export async function assignAiReviewItem(id) {
  const { data } = await api.post(`/v1/admin/ai/review/items/${id}/assign`)
  return data
}

export async function labelAiReviewItem(id, body) {
  const { data } = await api.post(`/v1/admin/ai/review/items/${id}/label`, body)
  return data
}

export async function adjudicateAiReviewItem(id, body) {
  const { data } = await api.post(`/v1/admin/ai/review/items/${id}/adjudicate`, body)
  return data
}

// —— Phase 3: Knowledge base ——
export async function getKbSources() {
  const { data } = await api.get('/v1/admin/kb/sources')
  return data
}

export async function createKbSource(body) {
  const { data } = await api.post('/v1/admin/kb/sources', body)
  return data
}

export async function getKbChunks(sourceId) {
  const { data } = await api.get(`/v1/admin/kb/sources/${sourceId}/chunks`)
  return data
}

export async function kbRetrieve(body) {
  const { data } = await api.post('/v1/admin/kb/retrieve', body)
  return data
}

// —— Phase 3: Analytics ——
export async function getAnalyticsOverview() {
  const { data } = await api.get('/v1/admin/analytics/overview')
  return data
}

export async function getAnalyticsConsent() {
  const { data } = await api.get('/v1/admin/analytics/consent')
  return data
}

export async function getAnalyticsClassifier() {
  const { data } = await api.get('/v1/admin/analytics/classifier')
  return data
}

// —— Phase 3: DSR queue ——
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
