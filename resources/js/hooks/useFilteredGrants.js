import { useState, useMemo } from 'react'
import { formatDeadline, urgencyClass, stripHtml } from '../utils/formatters'

const DEFAULT_FILTERS = {
    search:       '',
    cashFilter:   'all',
    statusFilter: 'relevant',
    sourceFilter: 'all',
    sortBy:       'match',
    ai_analyzed:  false,
    starredOnly:  false,
}

/**
 * Client-side filtering and sorting — mirrors useFilteredGrants.js in the Vite frontend.
 *
 * @param {Array[]} rawSources  Array of arrays: [webGrants, govGrants]
 */
export function useFilteredGrants(rawSources) {
    const [filters, setFilters] = useState(DEFAULT_FILTERS)

    // Merge all sources into one flat list
    const all = useMemo(() => {
        return rawSources.flat().filter(Boolean)
    }, [rawSources])

    // Unique source values for the source filter dropdown
    const sources = useMemo(() => {
        const vals = new Set(all.map(g => g.source || 'unknown').filter(Boolean))
        return ['all', ...Array.from(vals).sort()]
    }, [all])

    const filtered = useMemo(() => {
        let list = [...all]

        // Status filter
        if (filters.statusFilter === 'relevant') {
            list = list.filter(g => !g.ignore && !g.applied)
        } else if (filters.statusFilter === 'applied') {
            list = list.filter(g => g.applied)
        } else if (filters.statusFilter === 'ignored') {
            list = list.filter(g => g.ignore)
        }

        // Cash filter
        if (filters.cashFilter === 'cash') {
            list = list.filter(g => g.offers_cash || g.is_cash_grant)
        } else if (filters.cashFilter === 'nocash') {
            list = list.filter(g => !g.offers_cash && !g.is_cash_grant)
        }

        // AI filter
        if (filters.ai_analyzed) {
            list = list.filter(g => g.ai_analyzed)
        }

        // Starred filter
        if (filters.starredOnly) {
            list = list.filter(g => g.starred)
        }

        // Source filter
        if (filters.sourceFilter !== 'all') {
            list = list.filter(g => g.source === filters.sourceFilter)
        }

        // Search
        if (filters.search.trim()) {
            const q = filters.search.toLowerCase()
            list = list.filter(g =>
                (g.title || '').toLowerCase().includes(q) ||
                stripHtml(g.description || '').toLowerCase().includes(q) ||
                (g.eligibility || '').toLowerCase().includes(q) ||
                (g.source || '').toLowerCase().includes(q)
            )
        }

        // Sort
        list.sort((a, b) => {
            switch (filters.sortBy) {
                case 'match':
                    return (b.relevance_score ?? 0) - (a.relevance_score ?? 0)
                case 'newest':
                    return new Date(b.scraped_at ?? 0) - new Date(a.scraped_at ?? 0)
                case 'deadline': {
                    const da = formatDeadline(a.deadline)?.diff ?? Infinity
                    const db = formatDeadline(b.deadline)?.diff ?? Infinity
                    return da - db
                }
                case 'amount': {
                    const parse = v => parseFloat(String(v ?? '').replace(/[^0-9.]/g, '')) || 0
                    return parse(b.amount) - parse(a.amount)
                }
                case 'title':
                    return (a.title ?? '').localeCompare(b.title ?? '')
                case 'source':
                    return (a.source ?? '').localeCompare(b.source ?? '')
                default:
                    return 0
            }
        })

        return list
    }, [all, filters])

    const stats = useMemo(() => ({
        total:   all.length,
        applied: all.filter(g => g.applied).length,
        shown:   filtered.length,
    }), [all, filtered])

    function setSearch(v)       { setFilters(f => ({ ...f, search: v })) }
    function setCashFilter(v)   { setFilters(f => ({ ...f, cashFilter: v })) }
    function setAIFilter(v)     { setFilters(f => ({ ...f, ai_analyzed: v })) }
    function setStatusFilter(v) { setFilters(f => ({ ...f, statusFilter: v })) }
    function setSourceFilter(v) { setFilters(f => ({ ...f, sourceFilter: v })) }
    function setSortBy(v)       { setFilters(f => ({ ...f, sortBy: v })) }
    function setStarredOnly(v)  { setFilters(f => ({ ...f, starredOnly: v })) }
    function resetFilters()     { setFilters(DEFAULT_FILTERS) }

    return {
        filtered, filters, stats, sources,
        setSearch, setCashFilter, setAIFilter,
        setStatusFilter, setSourceFilter, setSortBy, setStarredOnly,
        resetFilters,
    }
}
