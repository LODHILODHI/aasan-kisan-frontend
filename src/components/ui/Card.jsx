export function Card({ className = '', children, title, subtitle, action }) {
  return (
    <div
      className={`bg-white border border-ak-border rounded-[var(--radius-ak-card)] shadow-[var(--shadow-ak-card)] ${className}`}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-0">
          <div>
            {title && (
              <h3 className="text-lg font-bold text-ak-text tracking-tight">{title}</h3>
            )}
            {subtitle && (
              <p className="text-sm text-ak-muted mt-0.5">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={title || action ? 'p-6 pt-4' : 'p-6'}>{children}</div>
    </div>
  )
}
