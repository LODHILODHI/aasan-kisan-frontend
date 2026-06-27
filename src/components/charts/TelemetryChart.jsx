import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-xl border border-ak-border bg-white px-3 py-2 shadow-[var(--shadow-ak-card)] text-sm">
      <div className="font-semibold text-ak-text">{row.event_name}</div>
      <div className="text-ak-muted">{row.count} events</div>
    </div>
  )
}

export function TelemetryChart({ data }) {
  const events = data?.by_event ?? []
  const total = data?.events_7d ?? events.reduce((sum, row) => sum + (row.count ?? 0), 0)

  if (!events.length) {
    return <p className="text-sm text-ak-muted py-8 text-center">No telemetry in the last 7 days.</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between gap-4 px-1">
        <span className="text-sm text-ak-muted">Events (7 days)</span>
        <span className="text-2xl font-extrabold text-ak-text">{total}</span>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={events} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dde9e0" horizontal={false} />
            <XAxis type="number" allowDecimals={false} tick={{ fill: '#5a6b60', fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="event_name"
              width={148}
              tick={{ fill: '#5a6b60', fontSize: 11 }}
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(232, 245, 236, 0.5)' }} />
            <Bar dataKey="count" fill="#137a47" radius={[0, 8, 8, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
