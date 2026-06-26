import { useAuth } from '../../auth/AuthContext'
import { Button } from '../ui/Button'

export function Header({ title, subtitle }) {
  const { adminUser, logout } = useAuth()
  const role = adminUser?.grants?.[0]?.role?.replace(/_/g, ' ') ?? 'admin'

  return (
    <header className="flex items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-extrabold text-ak-text tracking-tight">{title}</h1>
        {subtitle && <p className="text-ak-muted text-sm mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-4">
        <div className="text-right hidden sm:block">
          <div className="text-sm font-semibold text-ak-text">{adminUser?.email}</div>
          <div className="text-xs text-ak-muted capitalize">{role}</div>
        </div>
        <Button variant="ghost" size="sm" onClick={logout} className="!text-ak-muted">
          Logout
        </Button>
      </div>
    </header>
  )
}
