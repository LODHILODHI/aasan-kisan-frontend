export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ak-muted">
      <div className="w-10 h-10 rounded-full border-[3px] border-ak-light border-t-ak-brand animate-spin" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}

export function PageError({ message, onRetry }) {
  return (
    <div className="rounded-[var(--radius-ak-card)] border border-red-200 bg-[#feecec] p-6 text-center">
      <p className="text-ak-danger font-medium">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 text-sm font-semibold text-ak-brand underline cursor-pointer"
        >
          Try again
        </button>
      )}
    </div>
  )
}
