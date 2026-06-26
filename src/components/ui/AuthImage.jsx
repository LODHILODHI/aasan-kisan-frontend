import { useEffect, useState } from 'react'
import { getAccessToken } from '../../api/client'

export function AuthImage({ src, alt = '', className = '', placeholder = '—' }) {
  const [url, setUrl] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!src) return undefined

    let objectUrl = null
    let cancelled = false

    const token = getAccessToken()
    if (!token) {
      setFailed(true)
      setUrl(null)
      return undefined
    }

    setUrl(null)
    setFailed(false)

    fetch(src, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error(`Image fetch failed (${res.status})`)
        return res.blob()
      })
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [src])

  if (failed) {
    return <span className="text-xs text-ak-subtle">{placeholder}</span>
  }

  if (!url) {
    return (
      <span
        className="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-ak-border bg-ak-pale text-xs text-ak-subtle"
        aria-hidden
      >
        …
      </span>
    )
  }

  return <img src={url} alt={alt} className={className} loading="lazy" />
}
