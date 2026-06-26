/**
 * Coerce API field values to renderable primitives.
 * Audit/sync payloads often nest { type, id } objects.
 */
export function cellValue(value, fallback = '—') {
  if (value == null || value === '') return fallback
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  if (typeof value === 'number' || typeof value === 'string') return value
  if (value instanceof Date) return value.toLocaleString()
  if (Array.isArray(value)) return value.map((v) => cellValue(v, '')).filter(Boolean).join(', ') || fallback
  if (typeof value === 'object') {
    if (value.type != null && value.id != null) {
      return `${value.type}:${value.id}`
    }
    if (value.type != null) return String(value.type)
    if (value.id != null) return String(value.id)
    if (value.email != null) return String(value.email)
    if (value.en != null || value.ur != null) {
      const en = value.en ?? ''
      const ur = value.ur ?? ''
      return [en, ur].filter(Boolean).join(' · ') || fallback
    }
    if (value.name != null && typeof value.name === 'string') return String(value.name)
    try {
      return JSON.stringify(value)
    } catch {
      return fallback
    }
  }
  return String(value)
}

export function localizedLabel(value, fallback = '—') {
  if (value == null || value === '') return fallback
  if (typeof value === 'string') return value
  if (typeof value === 'object' && (value.en != null || value.ur != null)) {
    const en = value.en ?? ''
    const ur = value.ur ?? ''
    if (en && ur) return { en, ur, combined: true }
    return en || ur || fallback
  }
  return cellValue(value, fallback)
}

export function stringKey(row) {
  return row?.key ?? row?.string_key ?? row?.l10n_key ?? ''
}

export function stringText(row) {
  return row?.value ?? row?.text ?? ''
}

export function stringState(row) {
  return row?.status ?? row?.state ?? row?.translation_state ?? '—'
}

export function rowKey(value, index) {
  if (value == null) return index
  if (typeof value === 'object') {
    if (value.id != null) return String(value.id)
    return index
  }
  return String(value)
}
