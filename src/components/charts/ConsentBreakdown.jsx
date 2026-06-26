import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const COLORS = ['#0b5d32', '#137a47', '#16a34a', '#57c77a']

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-xl border border-ak-border bg-white px-3 py-2 shadow-[var(--shadow-ak-card)] text-sm">
      <div className="font-semibold text-ak-text">{row.label}</div>
      <div className="text-ak-muted">
        {row.value} farmers ({row.pct}%)
      </div>
    </div>
  )
}

export function ConsentBreakdown({ data }) {
  const total = data?.farmers_total ?? 0
  const rows = [
    { key: 'analytics', label: 'Analytics enabled', value: data?.analytics_enabled ?? 0 },
    { key: 'image', label: 'Image training enabled', value: data?.image_training_enabled ?? 0 },
    { key: 'disabled', label: 'Both disabled', value: data?.both_disabled ?? 0 },
  ].map((row) => ({
    ...row,
    pct: total > 0 ? Math.round((row.value / total) * 100) : 0,
  }))

  if (!total) {
    return <p className="text-sm text-ak-muted py-8 text-center">No farmer consent data yet.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4 px-1">
        <span className="text-sm text-ak-muted">Total farmers</span>
        <span className="text-2xl font-extrabold text-ak-text">{total}</span>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dde9e0" horizontal={false} />
            <XAxis type="number" domain={[0, total]} tick={{ fill: '#5a6b60', fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="label"
              width={148}
              tick={{ fill: '#5a6b60', fontSize: 11 }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(232, 245, 236, 0.5)' }} />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={28}>
              {rows.map((row, i) => (
                <Cell key={row.key} fill={COLORS[i % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1">
        {rows.map((row, i) => (
          <div
            key={row.key}
            className="rounded-xl border border-ak-border bg-ak-pale px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-xs text-ak-muted leading-tight">{row.label}</span>
            </div>
            <div className="mt-1 text-lg font-bold text-ak-text">{row.value}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
