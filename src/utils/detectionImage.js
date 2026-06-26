import { resolveApiUrl } from '../api/client'

export function canShowDetectionImage(row) {
  if (!row) return false

  if (row.image_available === true && row.image_url) return true

  if (row.has_image && row.consent_training) {
    return Boolean(row.image_url || row.image_uri || row.detection_id)
  }

  return false
}

export function getDetectionImagePath(row) {
  if (!row) return ''

  if (row.image_url) return resolveApiUrl(row.image_url)
  if (row.image_uri) return resolveApiUrl(row.image_uri)
  if (row.detection_id) {
    return resolveApiUrl(`/v1/admin/detections/${row.detection_id}/image`)
  }

  return ''
}

export function detectionImageAlt(row) {
  return row?.species_key ?? row?.speciesKey ?? 'Detection'
}
