const tones = {
  default: 'bg-ak-surface text-ak-text',
  success: 'bg-ak-light text-ak-brand',
  warning: 'bg-[#fef7e8] text-[#92400e]',
  danger: 'bg-[#feecec] text-ak-danger',
  info: 'bg-[#e0f2fe] text-[#0369a1]',
  muted: 'bg-ak-surface text-ak-muted',
}

export function Badge({ tone = 'default', className = '', children }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
