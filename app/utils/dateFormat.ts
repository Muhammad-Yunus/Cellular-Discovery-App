/**
 * Format an ISO 8601 timestamp into a human-readable date string.
 *
 * Output examples (en-US locale):
 *   - "May 24, 2024, 14:32"
 *   - "May 24, 2024, 14:32:08"
 *
 * Returns the original `iso` string when the input cannot be parsed.
 */
export function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
}

/**
 * Format an ISO 8601 timestamp into a relative "time ago" string.
 *
 * Examples:
 *   - "just now"
 *   - "5 min ago"
 *   - "2 h ago"
 *   - "3 d ago"
 *   - "May 24, 2024" (older than 30 days)
 *
 * Returns '—' when the input is empty.
 */
export function formatRelativeTime(iso: string | undefined | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso

  const diffMs = Date.now() - d.getTime()
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHour = Math.round(diffMin / 60)
  const diffDay = Math.round(diffHour / 24)

  if (diffSec < 5) return 'just now'
  if (diffSec < 60) return `${diffSec} sec ago`
  if (diffMin < 60) return `${diffMin} min ago`
  if (diffHour < 24) return `${diffHour} h ago`
  if (diffDay < 30) return `${diffDay} d ago`

  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
