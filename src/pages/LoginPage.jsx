import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiError } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

const DEV_PASSWORD = 'admin123'

const DEV_USERS = [
  { email: 'admin@aasan.kisan', role: 'super_admin', useFor: 'Full access' },
  { email: 'agronomist@aasan.kisan', role: 'agronomist', useFor: 'Catalog, advice, cloud recheck' },
  { email: 'ops@aasan.kisan', role: 'ops_officer', useFor: 'Sync health, mandi/weather' },
  { email: 'support@aasan.kisan', role: 'support', useFor: 'Farmers, DSR, OTP' },
  { email: 'content@aasan.kisan', role: 'content_manager', useFor: 'Advice + l10n' },
  { email: 'auditor@aasan.kisan', role: 'auditor', useFor: 'Read-only audit' },
]

function LeafHero() {
  return (
    <div className="hidden lg:flex flex-col items-center justify-center flex-1 bg-ak-primary text-white p-12">
      <div className="max-w-md text-center">
        <div className="w-28 h-28 mx-auto mb-8 rounded-full bg-ak-light flex items-center justify-center">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden>
            <path
              d="M36 18c-12 0-20 9-20 20 0 1.4.2 2.8.6 4 6-.8 11.6-3.6 15.6-8.4 1.6-2 2.8-4.4 3.6-7 0 0 0-8.6 0-8.6z"
              fill="#137A47"
            />
            <path
              d="M36 18c12 0 20 9 20 20 0 1.4-.2 2.8-.6 4-6-.8-11.6-3.6-15.6-8.4-1.6-2-2.8-4.4-3.6-7 0 0 0-8.6 0-8.6z"
              fill="#16A34A"
            />
            <rect x="32" y="36" width="8" height="20" rx="4" fill="#0B5D32" />
          </svg>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight mb-2">Assan Kisan</h1>
        <p className="text-ak-accent text-lg font-medium">Har Kissan, Smart Kissan</p>
        <p className="text-white/70 mt-6 text-sm leading-relaxed">
          Admin panel for catalog, advice CMS, farmer support, mandi &amp; weather feeds.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@aasan.kisan')
  const [password, setPassword] = useState(DEV_PASSWORD)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [quickLoginEmail, setQuickLoginEmail] = useState(null)

  async function signIn(loginEmail, loginPassword = DEV_PASSWORD) {
    setError('')
    setSubmitting(true)
    try {
      await login(loginEmail, loginPassword)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setSubmitting(false)
      setQuickLoginEmail(null)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    await signIn(email, password)
  }

  async function handleQuickLogin(user) {
    setEmail(user.email)
    setPassword(DEV_PASSWORD)
    setQuickLoginEmail(user.email)
    await signIn(user.email, DEV_PASSWORD)
  }

  return (
    <div className="min-h-screen flex">
      <LeafHero />
      <div className="flex-1 flex items-center justify-center p-6 bg-ak-pale overflow-y-auto">
        <div className="w-full max-w-lg py-6">
          <div className="lg:hidden mb-8 text-center">
            <h1 className="text-2xl font-extrabold text-ak-text">Assan Kisan</h1>
            <p className="text-ak-muted text-sm">Admin Panel</p>
          </div>

          <div className="bg-white border border-ak-border rounded-[var(--radius-ak-card)] shadow-[var(--shadow-ak-card)] p-8">
            <h2 className="text-xl font-bold text-ak-text mb-1">Sign in</h2>
            <p className="text-sm text-ak-muted mb-6">Dev login — email &amp; password</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
              {error && (
                <p className="text-sm text-ak-danger bg-[#feecec] rounded-xl px-4 py-3">{error}</p>
              )}
              <Button type="submit" size="lg" className="w-full" disabled={submitting}>
                {submitting && !quickLoginEmail ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>
          </div>

          <div className="mt-6 bg-white border border-ak-border rounded-[var(--radius-ak-card)] shadow-[var(--shadow-ak-card)] p-6">
            <h3 className="text-sm font-bold text-ak-text uppercase tracking-wide">
              Dev quick login
            </h3>
            <p className="text-xs text-ak-muted mt-1 mb-4">
              Sab users — password: <code className="bg-ak-surface px-1.5 py-0.5 rounded">{DEV_PASSWORD}</code>
            </p>

            <div className="space-y-2">
              {DEV_USERS.map((user) => {
                const isLoading = submitting && quickLoginEmail === user.email
                return (
                  <button
                    key={user.email}
                    type="button"
                    disabled={submitting}
                    onClick={() => handleQuickLogin(user)}
                    className="w-full text-left rounded-[var(--radius-ak-btn)] border border-ak-border bg-ak-pale/50 px-4 py-3 transition-colors hover:bg-ak-light hover:border-ak-brand/40 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-ak-text">{user.email}</span>
                      <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-ak-brand bg-ak-light px-2 py-0.5 rounded-full">
                        {user.role.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-ak-muted mt-1">{user.useFor}</p>
                    {isLoading && (
                      <p className="text-xs text-ak-brand font-medium mt-1">Signing in…</p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
