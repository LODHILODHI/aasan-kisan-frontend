import { AuthImage } from './AuthImage'
import {
  canShowDetectionImage,
  detectionImageAlt,
  getDetectionImagePath,
} from '../../utils/detectionImage'

const SIZES = {
  thumb: 'h-12 w-12 rounded-lg object-cover border border-ak-border',
  large: 'max-h-56 w-full rounded-xl object-contain border border-ak-border bg-white',
}

export function DetectionPhoto({ row, size = 'thumb', className }) {
  if (!canShowDetectionImage(row)) {
    return (
      <span className="text-xs text-ak-subtle" title="No image training consent">
        —
      </span>
    )
  }

  return (
    <AuthImage
      src={getDetectionImagePath(row)}
      alt={detectionImageAlt(row)}
      className={className ?? SIZES[size] ?? SIZES.thumb}
    />
  )
}

export function DetectionImagePanel({ row, title = 'Detection photo' }) {
  if (!canShowDetectionImage(row)) return null

  return (
    <div className="rounded-xl border border-ak-border bg-ak-pale p-3">
      <p className="mb-2 text-xs text-ak-muted">{title}</p>
      <DetectionPhoto row={row} size="large" />
    </div>
  )
}
