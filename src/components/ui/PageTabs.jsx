export function PageTabs({ tabs, active, onChange, className = '' }) {
  if (tabs.length <= 1) return null

  return (
    <div
      className={`flex flex-wrap gap-2 mb-6 p-1 bg-white border border-ak-border rounded-[var(--radius-ak-card)] shadow-[var(--shadow-ak-card)] ${className || 'w-fit'}`}
      role="tablist"
    >
      {tabs.map((tab) => {
        const selected = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={`px-5 py-2.5 text-sm font-bold rounded-xl transition-colors cursor-pointer ${
              selected
                ? 'bg-ak-brand text-white shadow-sm'
                : 'text-ak-muted hover:bg-ak-pale hover:text-ak-text'
            }`}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
