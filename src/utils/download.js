export function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function parseContentDispositionFilename(header, fallback) {
  if (!header) return fallback
  const match = header.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)
  if (!match?.[1]) return fallback
  try {
    return decodeURIComponent(match[1].replace(/"/g, ''))
  } catch {
    return match[1].replace(/"/g, '')
  }
}
