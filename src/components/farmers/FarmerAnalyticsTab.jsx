import { useEffect, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getFarmerAnalytics } from '../../api/admin'
import { getApiError } from '../../api/client'
import { Card } from '../ui/Card'
import { Loading, PageError } from '../ui/Loading'

const COLORS = ['#0b5d32', '#137a47', '#16a34a', '#57c77a', '#9fe3b6', '#0ea5e9', '#f59e0b']
const PERIODS = [7, 30, 90]

function formatSpecies(key) {
  if (!key) return '—'
  return String(key)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
}

function shortDate(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  } catch {
    return iso
  }
}

function seriesOf(chart) {
  return chart?.series ?? []
}

function ChartShell({ title, subtitle, children, empty }) {
  return (
    <Card title={title} subtitle={subtitle}>
      {empty ? (
        <p className="text-sm text-ak-muted py-12 text-center">No data in this period</p>
      ) : (
        children
      )}
    </Card>
  )
}

function DefaultTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-ak-border bg-white px-3 py-2 shadow-[var(--shadow-ak-card)] text-sm">
      {label && <div className="font-semibold text-ak-text mb-1">{label}</div>}
      {payload.map((p) => (
        <div key={p.name} className="text-ak-muted">
          {p.name}: {typeof p.value === 'number' && p.name?.includes('confidence')
            ? `${Math.round(p.value * (p.value <= 1 ? 100 : 1))}%`
            : p.value}
        </div>
      ))}
    </div>
  )
}

export function FarmerAnalyticsTab({ farmerId }) {
  const [days, setDays] = useState(30)
  const [payload, setPayload] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load(period = days) {
    setLoading(true)
    setError('')
    try {
      const res = await getFarmerAnalytics(farmerId, period)
      setPayload(res.data ?? res)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(days)
  }, [farmerId, days]) // eslint-disable-line react-hooks/exhaustive-deps

  const summary = payload?.summary ?? {}
  const charts = payload?.charts ?? {}

  if (loading) return <Loading />
  if (error) return <PageError message={error} onRetry={() => load(days)} />

  const scansByDay = seriesOf(charts.scans_by_day)
  const confidenceTrend = seriesOf(charts.confidence_trend).map((row) => ({
    ...row,
    avg_confidence_pct: row.avg_confidence != null ? row.avg_confidence * 100 : null,
    label: shortDate(row.date),
  }))
  const species = seriesOf(charts.species_breakdown).map((row) => ({
    ...row,
    label: formatSpecies(row.species_key ?? row.species),
  }))
  const severity = seriesOf(charts.severity_breakdown)
  const confidenceDist = seriesOf(charts.confidence_distribution)
  const reviewState = seriesOf(charts.review_state_breakdown)
  const syncState = seriesOf(charts.sync_state_breakdown)
  const plotCrops = seriesOf(charts.plot_crops).map((row) => ({
    ...row,
    label: row.crop ?? row.crop_name ?? row.species_key,
  }))
  const telemetryDay = seriesOf(charts.telemetry_by_day).map((row) => ({
    ...row,
    label: shortDate(row.date),
  }))
  const telemetryEvent = seriesOf(charts.telemetry_by_event)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ak-muted">
          {payload?.period_days ?? days} day period · chart hints from API
        </p>
        <div className="flex gap-1 p-1 rounded-xl bg-white border border-ak-border shadow-[var(--shadow-ak-card)]">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setDays(p)}
              className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                days === p
                  ? 'bg-ak-brand text-white'
                  : 'text-ak-muted hover:bg-ak-pale hover:text-ak-text'
              }`}
            >
              {p}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total scans" value={summary.total_scans} />
        <StatCard label="In period" value={summary.scans_in_period} />
        <StatCard
          label="Avg confidence"
          value={
            summary.avg_confidence != null
              ? `${Math.round(summary.avg_confidence * 100)}%`
              : '—'
          }
        />
        <StatCard label="Low confidence" value={summary.low_confidence_count} />
        <StatCard label="Plots" value={summary.plots_count} />
        <StatCard
          label="Area (acres)"
          value={summary.total_area_acres != null ? summary.total_area_acres : '—'}
        />
      </div>

      {summary.telemetry_events_in_period != null && (
        <p className="text-xs text-ak-muted -mt-2">
          Telemetry events in period: {summary.telemetry_events_in_period}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartShell
          title="Scans by day"
          subtitle={charts.scans_by_day?.description ?? 'Pest vs plant scans per day'}
          empty={!scansByDay.length}
        >
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scansByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dde9e0" />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip content={<DefaultTooltip />} />
                <Legend />
                <Bar dataKey="pest" stackId="scans" fill="#0b5d32" name="Pest" />
                <Bar dataKey="disease" stackId="scans" fill="#57c77a" name="Plant" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>

        <ChartShell
          title="Confidence trend"
          subtitle={charts.confidence_trend?.description ?? 'Daily average confidence'}
          empty={!confidenceTrend.length}
        >
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={confidenceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dde9e0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
                <Tooltip content={<DefaultTooltip />} />
                <Line
                  type="monotone"
                  dataKey="avg_confidence_pct"
                  stroke="#137a47"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Avg confidence %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>

        <ChartShell
          title="Species breakdown"
          subtitle={charts.species_breakdown?.description}
          empty={!species.length}
        >
          <DonutChart data={species} nameKey="label" valueKey="count" />
        </ChartShell>

        <ChartShell
          title="Severity"
          subtitle={charts.severity_breakdown?.description}
          empty={!severity.length}
        >
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dde9e0" vertical={false} />
                <XAxis dataKey="severity" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#137a47" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>

        <ChartShell
          title="Confidence distribution"
          subtitle={charts.confidence_distribution?.description}
          empty={!confidenceDist.length}
        >
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confidenceDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dde9e0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#16a34a" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <ChartShell
            title="Review state"
            subtitle={charts.review_state_breakdown?.description}
            empty={!reviewState.length}
          >
            <PieMini data={reviewState} nameKey="state" valueKey="count" />
          </ChartShell>
          <ChartShell
            title="Sync state"
            subtitle={charts.sync_state_breakdown?.description}
            empty={!syncState.length}
          >
            <PieMini data={syncState} nameKey="state" valueKey="count" />
          </ChartShell>
        </div>

        <ChartShell
          title="Plot crops"
          subtitle={charts.plot_crops?.description ?? 'Area by crop (acres)'}
          empty={!plotCrops.length}
        >
          <DonutChart data={plotCrops} nameKey="label" valueKey="area_acres" />
        </ChartShell>

        <ChartShell
          title="Telemetry by day"
          subtitle={charts.telemetry_by_day?.description ?? 'App activity (if consent)'}
          empty={!telemetryDay.length}
        >
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#dde9e0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="#0ea5e9"
                  fill="#0ea5e9"
                  fillOpacity={0.2}
                  name="Events"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartShell>

        {telemetryEvent.length > 0 && (
          <ChartShell
            title="Telemetry by event"
            subtitle={charts.telemetry_by_event?.description}
            empty={!telemetryEvent.length}
          >
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={telemetryEvent} layout="vertical" margin={{ left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dde9e0" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis
                    type="category"
                    dataKey="event_name"
                    width={120}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartShell>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white border border-ak-border rounded-[var(--radius-ak-card)] shadow-[var(--shadow-ak-card)] p-4">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ak-muted">{label}</div>
      <div className="text-xl font-extrabold text-ak-text mt-1">{value ?? '—'}</div>
    </div>
  )
}

function DonutChart({ data, nameKey, valueKey }) {
  return (
    <div className="h-[260px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={90}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

function PieMini({ data, nameKey, valueKey }) {
  return (
    <div className="h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={72}
            label={({ name, percent }) =>
              `${name} ${(percent * 100).toFixed(0)}%`
            }
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
