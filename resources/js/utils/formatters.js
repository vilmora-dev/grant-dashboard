/**
 * Shared formatting utilities — ported from the Vite frontend.
 */

/** Parse a single dollar amount string into a number, or NaN. */
function _parseDollar(str) {
    return parseFloat(String(str).replace(/[^0-9.]/g, ''))
}

/** Compact-format a single number: $1.5M, $150K, $500 */
function _compactNum(num) {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`
    if (num >= 1_000)     return `$${(num / 1_000).toFixed(0)}K`
    return `$${num.toFixed(0)}`
}

/** Full-format a single number as USD currency. */
function _fullNum(num) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(num)
}

export function formatAmount(raw) {
    if (!raw || raw === 'See website' || raw === 'null') return null
    const s = String(raw)

    // "from $150,000 to $1,500,000"
    const rangeMatch = s.match(/from\s+([^\s]+)\s+to\s+([^\s]+)/i)
    if (rangeMatch) {
        const floor   = _parseDollar(rangeMatch[1])
        const ceiling = _parseDollar(rangeMatch[2])
        if (!isNaN(floor) && !isNaN(ceiling)) return `${_compactNum(floor)} – ${_compactNum(ceiling)}`
    }

    // "X – Y" (legacy separator)
    const dashMatch = s.match(/^(.+?)\s*[–—-]\s*(.+)$/)
    if (dashMatch) {
        const floor   = _parseDollar(dashMatch[1])
        const ceiling = _parseDollar(dashMatch[2])
        if (!isNaN(floor) && !isNaN(ceiling)) return `${_compactNum(floor)} – ${_compactNum(ceiling)}`
    }

    const num = _parseDollar(s)
    if (isNaN(num)) return s
    return _compactNum(num)
}

export function formatAmountFull(raw) {
    if (!raw || raw === 'See website' || raw === 'null') return null
    const s = String(raw)

    // "from $150,000 to $1,500,000"
    const rangeMatch = s.match(/from\s+([^\s]+)\s+to\s+([^\s]+)/i)
    if (rangeMatch) {
        const floor   = _parseDollar(rangeMatch[1])
        const ceiling = _parseDollar(rangeMatch[2])
        if (!isNaN(floor) && !isNaN(ceiling)) return `${_fullNum(floor)} – ${_fullNum(ceiling)}`
    }

    // "X – Y" (legacy separator)
    const dashMatch = s.match(/^(.+?)\s*[–—-]\s*(.+)$/)
    if (dashMatch) {
        const floor   = _parseDollar(dashMatch[1])
        const ceiling = _parseDollar(dashMatch[2])
        if (!isNaN(floor) && !isNaN(ceiling)) return `${_fullNum(floor)} – ${_fullNum(ceiling)}`
    }

    const num = _parseDollar(s)
    if (isNaN(num)) return s
    return _fullNum(num)
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
