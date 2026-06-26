import { NavLink } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { canAccessRoute } from '../../utils/rbac'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: '◫', permission: 'sync.read' },
  { to: '/analytics', label: 'Analytics', icon: '📊', permission: 'analytics.read' },
  { to: '/farmers', label: 'Farmers', icon: '👨‍🌾', permission: 'farmers.read_list' },
  { to: '/dsr', label: 'DSR Queue', icon: '🎫', permission: 'dsr.read_list' },
  { to: '/cloud-recheck', label: 'Cloud Recheck', icon: '☁', permission: 'cloud_recheck.read' },
  { to: '/ai/review', label: 'AI Review', icon: '🔬', permission: 'ai_review.read' },
  { to: '/models', label: 'Models', icon: '🧠', permission: 'models.read' },
  { to: '/catalog', label: 'Catalog', icon: '📋', permission: 'catalog.read' },
  { to: '/advice', label: 'Advice CMS', icon: '💬', permission: 'advice_content.read' },
  { to: '/kb', label: 'Knowledge Base', icon: '📚', permission: 'kb.read' },
  { to: '/mandi', label: 'Mandi Feed', icon: '📈', permission: 'mandi_feed.read' },
  { to: '/weather', label: 'Weather Feed', icon: '🌤', permission: 'weather_feed.read' },
  { to: '/l10n/locales', label: 'Locales', icon: '🌐', permission: 'l10n.read' },
  { to: '/l10n/strings', label: 'Strings', icon: '🔤', permission: 'l10n.read' },
  { to: '/users', label: 'Admin Users', icon: '👤', permission: 'admin_users.read' },
  { to: '/audit', label: 'Audit Log', icon: '📜', permission: 'audit.read' },
  { to: '/settings/threshold', label: 'Pest Threshold', icon: '⚙', permission: 'models.set_threshold' },
]

function LeafLogo() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden>
      <circle cx="18" cy="18" r="18" fill="#E8F5EC" />
      <path
        d="M18 10c-6 0-10 4.5-10 10 0 .7.1 1.4.3 2 3-.4 5.8-1.8 7.8-4.2.8-1 1.5-2.2 1.9-3.5 0 0 0-4.3 0-4.3z"
        fill="#137A47"
      />
      <path
        d="M18 10c6 0 10 4.5 10 10 0 .7-.1 1.4-.3 2-3-.4-5.8-1.8-7.8-4.2-.8-1-1.5-2.2-1.9-3.5 0 0 0-4.3 0-4.3z"
        fill="#16A34A"
      />
      <rect x="16" y="19" width="4" height="10" rx="2" fill="#0B5D32" />
    </svg>
  )
}

export function Sidebar() {
  const { adminUser } = useAuth()
  const grants = adminUser?.grants ?? []

  const visible = NAV.filter(
    (item) => canAccessRoute(grants, item.permission) || grants.some((g) => g.role === 'super_admin'),
  )

  return (
    <aside className="w-64 shrink-0 bg-ak-primary text-white flex flex-col min-h-screen">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <LeafLogo />
          <div>
            <div className="font-extrabold text-lg leading-tight tracking-tight">Assan Kisan</div>
            <div className="text-ak-accent text-xs font-medium">Admin Panel</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visible.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <span className="text-base w-5 text-center opacity-90">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-white/10 text-xs text-ak-accent">
        Har Kissan, Smart Kissan
      </div>
    </aside>
  )
}
