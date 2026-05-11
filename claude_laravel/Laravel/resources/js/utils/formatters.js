/**
 * Shared formatting utilities — ported from the Vite frontend.
 */

export function formatAmount(raw) {
    if (!raw || raw === 'See website' || raw === 'null') return null
    const cleaned = String(raw).replace(/[^0-9.]/g, '')
    const num = parseFloat(cleaned)
    if (isNaN(num)) return raw
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000)     return `$${(num / 1_000).toFixed(0)}K`
    return `$${num.toFixed(0)}`
}

export function formatAmountFull(raw) {
    if (!raw || raw === 'See website' || raw === 'null') return null
    const cleaned = String(raw).replace(/[^0-9.]/g, '')
    const num = parseFloat(cleaned)
    if (isNaN(num)) return raw
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num)
}

/**
 * Parse a deadline string and return { label, diff } where diff is days
 * until deadline (negative = expired), or null if unparseable.
 */
export function formatDeadline(raw) {
    if (!raw || raw === 'See website' || raw === 'null' || raw === 'Rolling') {
        return { label: raw || 'Unknown', diff: null }
    }
    const date = new Date(raw)
    if (isNaN(date.getTime())) return { label: raw, diff: null }
    const diff = Math.round((date - Date.now()) / 86_400_000)
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return { label, diff }
}

/** Map a deadline diff to an urgency key. */
export function urgencyClass(diff) {
    if (diff == null)  return 'neutral'
    if (diff < 0)      return 'expired'
    if (diff <= 7)     return 'urgent'
    if (diff <= 30)    return 'soon'
    return 'ok'
}

/** Strip HTML tags, returning plain text. */
export function stripHtml(html) {
    if (!html) return ''
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
}
