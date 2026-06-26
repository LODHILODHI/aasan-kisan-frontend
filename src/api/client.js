import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

let accessToken = null
let refreshToken = null
let onUnauthorized = null

export function setTokens(access, refresh) {
  accessToken = access
  refreshToken = refresh
  if (access) {
    sessionStorage.setItem('ak_access_token', access)
  } else {
    sessionStorage.removeItem('ak_access_token')
  }
  if (refresh) {
    sessionStorage.setItem('ak_refresh_token', refresh)
  } else {
    sessionStorage.removeItem('ak_refresh_token')
  }
}

export function loadStoredTokens() {
  accessToken = sessionStorage.getItem('ak_access_token')
  refreshToken = sessionStorage.getItem('ak_refresh_token')
  return { accessToken, refreshToken }
}

export function clearTokens() {
  setTokens(null, null)
}

export function setOnUnauthorized(fn) {
  onUnauthorized = fn
}

function requestId() {
  return crypto.randomUUID()
}

api.interceptors.request.use((config) => {
  config.headers['X-Request-Id'] = requestId()
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

let refreshing = null

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (
      error.response?.status === 401 &&
      refreshToken &&
      !original._retry &&
      !original.url?.includes('/admin/auth/')
    ) {
      original._retry = true
      if (!refreshing) {
        refreshing = api
          .post('/v1/admin/auth/refresh', { refresh_token: refreshToken })
          .then((res) => {
            const { access_token, refresh_token } = res.data
            setTokens(access_token, refresh_token)
            return access_token
          })
          .catch(() => {
            clearTokens()
            onUnauthorized?.()
            return null
          })
          .finally(() => {
            refreshing = null
          })
      }
      const token = await refreshing
      if (token) {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)

export function getAccessToken() {
  if (!accessToken) {
    accessToken = sessionStorage.getItem('ak_access_token')
  }
  return accessToken
}

export function resolveApiUrl(path) {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${API_BASE}${path}`
}

export function getApiError(error) {
  return (
    error.response?.data?.error?.detail ||
    error.response?.data?.error?.code ||
    error.message ||
    'Request failed'
  )
}
