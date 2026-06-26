export function Input({ label, error, className = '', id, ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <label className={`block ${className}`} htmlFor={inputId}>
      {label && (
        <span className="block text-sm font-semibold text-ak-text mb-1.5">{label}</span>
      )}
      <input
        id={inputId}
        className={`w-full h-14 px-4 rounded-[var(--radius-ak-btn)] border text-ak-text bg-white placeholder:text-ak-subtle outline-none transition-colors ${
          error
            ? 'border-ak-danger focus:border-ak-danger'
            : 'border-ak-border focus:border-ak-brand focus:ring-2 focus:ring-ak-light'
        }`}
        {...props}
      />
      {error && <span className="block text-sm text-ak-danger mt-1">{error}</span>}
    </label>
  )
}

export function Select({ label, error, className = '', id, children, ...props }) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <label className={`block ${className}`} htmlFor={selectId}>
      {label && (
        <span className="block text-sm font-semibold text-ak-text mb-1.5">{label}</span>
      )}
      <select
        id={selectId}
        className={`w-full h-14 px-4 rounded-[var(--radius-ak-btn)] border text-ak-text bg-white outline-none transition-colors ${
          error ? 'border-ak-danger' : 'border-ak-border focus:border-ak-brand'
        }`}
        {...props}
      >
        {children}
      </select>
      {error && <span className="block text-sm text-ak-danger mt-1">{error}</span>}
    </label>
  )
}
