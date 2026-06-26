import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  api,
  clearTokens,
  loadStoredTokens,
  setOnUnauthorized,
  setTokens,
} from '../api/client'
import * as adminApi from '../api/admin'
import { derivePermissions } from '../utils/rbac'

const AuthContext = createContext(null)

const USER_KEY = 'ak_admin_user'

function readStoredUser() {
  try {
    const raw = sessionStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [adminUser, setAdminUser] = useState(readStoredUser)
  const [hasToken, setHasToken] = useState(() => Boolean(sessionStorage.getItem('ak_access_token')))
  const [loading, setLoading] = useState(true)

  const persistUser = useCallback((user) => {
    setAdminUser(user)
    if (user) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user))
    } else {
      sessionStorage.removeItem(USER_KEY)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await adminApi.logout()
    } catch {
      /* ignore */
    }
    clearTokens()
    setHasToken(false)
    persistUser(null)
  }, [persistUser])

  useEffect(() => {
    setOnUnauthorized(() => {
      clearTokens()
      setHasToken(false)
      persistUser(null)
    })

    const { accessToken, refreshToken } = loadStoredTokens()
    const user = readStoredUser()

    if (!user || !refreshToken) {
      setLoading(false)
      return
    }

    if (accessToken) {
      setHasToken(true)
      setLoading(false)
      return
    }

    api
      .post('/v1/admin/auth/refresh', { refresh_token: refreshToken })
      .then((res) => {
        setTokens(res.data.access_token, res.data.refresh_token)
        setHasToken(true)
      })
      .catch(() => {
        clearTokens()
        setHasToken(false)
        persistUser(null)
      })
      .finally(() => setLoading(false))
  }, [persistUser])

  const login = useCallback(
    async (email, password) => {
      const data = await adminApi.devLogin(email, password)
      setTokens(data.access_token, data.refresh_token)
      setHasToken(true)
      persistUser(data.admin_user)
      return data.admin_user
    },
    [persistUser],
  )

  const permissions = useMemo(
    () => derivePermissions(adminUser?.grants),
    [adminUser],
  )

  const value = useMemo(
    () => ({
      adminUser,
      permissions,
      loading,
      isAuthenticated: Boolean(adminUser && hasToken),
      login,
      logout,
    }),
    [adminUser, permissions, loading, hasToken, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
