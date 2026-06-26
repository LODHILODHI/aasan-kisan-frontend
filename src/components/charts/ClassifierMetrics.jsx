import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

function formatSpecies(key) {
  if (!key) return '—'
  return String(key)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
}

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div className="rounded-xl border border-ak-border bg-white px-3 py-2 shadow-[var(--shadow-ak-card)] text-sm">
      <div className="font-semibold text-ak-text capitalize">{formatSpecies(row.species_key)}</div>
      <div className="text-ak-muted">Detections: {row.count}</div>
      <div className="text-ak-muted">
        Avg confidence: {Math.round((row.avg_confidence ?? 0) * 100)}%
      </div>
    </div>
  )
}

export function ClassifierMetrics({ data }) {
  const species = (data?.by_species ?? []).map((row) => ({
    ...row,
    label: formatSpecies(row.species_key),
    confidencePct: Math.round((row.avg_confidence ?? 0) * 100),
  }))

  const lowRate = data?.low_confidence_rate
  const lowPct =
    lowRate != null ? `${Math.round(Number(lowRate) * 1000) / 10}%` : '—'

  if (!species.length) {
    return <p className="text-sm text-ak-muted py-8 text-center">No classifier data yet.</p>
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <SummaryPill label="Total detections" value={data?.total_detections} />
        <SummaryPill label="Below threshold" value={data?.below_threshold} tone="warning" />
        <SummaryPill label="Low confidence rate" value={lowPct} />
      </div>

      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={species} margin={{ top: 8, right: 12, left: 0, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dde9e0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#5a6b60', fontSize: 11 }}
              angle={-28}
              textAnchor="end"
              height={56}
              interval={0}
            />
            <YAxis
              yAxisId="count"
              allowDecimals={false}
              tick={{ fill: '#5a6b60', fontSize: 12 }}
              label={{
                value: 'Count',
                angle: -90,
                position: 'insideLeft',
                fill: '#9aa89e',
                fontSize: 11,
                dx: 8,
              }}
            />
            <YAxis
              yAxisId="confidence"
              orientation="right"
              domain={[0, 100]}
              tick={{ fill: '#5a6b60', fontSize: 12 }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar
              yAxisId="count"
              dataKey="count"
              fill="#137a47"
              radius={[6, 6, 0, 0]}
              maxBarSize={40}
              name="Detections"
            />
            <Line
              yAxisId="confidence"
              type="monotone"
              dataKey="confidencePct"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 0 }}
              name="Avg confidence"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-ak-muted px-1">
        <LegendDot color="#137a47" label="Detection count" />
        <LegendDot color="#0ea5e9" label="Avg confidence (%)" />
      </div>
    </div>
  )
}

function SummaryPill({ label, value, tone }) {
  const valueClass =
    tone === 'warning' ? 'text-ak-warning' : 'text-ak-text'
  return (
    <div className="rounded-xl border border-ak-border bg-ak-pale px-3 py-2.5 text-center sm:text-left">
      <div className="text-xs text-ak-muted">{label}</div>
      <div className={`mt-1 text-lg font-bold ${valueClass}`}>{value ?? '—'}</div>
    </div>
  )
}

function LegendDot({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}
