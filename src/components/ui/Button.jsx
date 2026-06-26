const variants = {
  primary:
    'bg-ak-brand text-white shadow-[var(--shadow-ak-btn)] hover:bg-ak-primary active:bg-ak-deep',
  secondary:
    'bg-white text-ak-brand border-2 border-ak-brand hover:bg-ak-light',
  soft: 'bg-ak-light text-ak-primary hover:bg-ak-surface',
  danger: 'bg-ak-danger text-white hover:bg-red-700',
  ghost: 'bg-transparent text-ak-muted hover:bg-ak-surface hover:text-ak-text',
}

const sizes = {
  sm: 'h-10 px-4 text-sm rounded-xl',
  md: 'h-14 px-5 text-base rounded-[var(--radius-ak-btn)] font-bold',
  lg: 'h-[60px] px-6 text-lg rounded-[var(--radius-ak-btn)] font-bold',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 font-[inherit] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
