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

// Labels for each source value
export const SOURCE_LABELS = {
    grants_gov:       'Grants.gov',
    ca_portal:        'CA Grants Portal',
    simpler_grants:   'Simpler.Grants.gov',
    fema:             'FEMA HMA',
    terra_viva:       'Terra Viva Grants',
    federal_register: 'Federal Register – EPA',
    web:              'Web',
}

// Group sources by scrape_method for the dropdown
export const SOURCE_GROUPS = {
    rss: { label: 'RSS Feeds',   sources: ['terra_viva', 'federal_register'] },
    api: { label: 'API Sources', sources: ['grants_gov', 'simpler_grants', 'ca_portal', 'fema'] },
    web: { label: 'Web',         sources: ['web'] },
}

/**
 * Client-side filtering and sorting for the unified grants table.
 *
 * @param {Array} grants  Flat array of grant objects from grants_unified
 */
export function useFilteredGrants(grants = []) {
    const [filters, setFilters] = useState(DEFAULT_FILTERS)

    const all = useMemo(() => grants.filter(Boolean), [grants])

    // Collect which source values actually exist in the data (for dropdown)
    const presentSources = useMemo(() => {
        return new Set(all.map(g => g.source).filter(Boolean))
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
            list = list.filter(g => g.offers_cash)
        } else if (filters.cashFilter === 'nocash') {
            list = list.filter(g => !g.offers_cash)
        }

        // AI filter
        if (filters.ai_analyzed) {
            list = list.filter(g => g.ai_analyzed)
        }

        // Starred filter
        if (filters.starredOnly) {
            list = list.filter(g => g.starred)
        }

        // Source filter — supports both specific source and scrape_method group
        if (filters.sourceFilter !== 'all') {
            if (['rss', 'api', 'web'].includes(filters.sourceFilter)) {
                list = list.filter(g => g.scrape_method === filters.sourceFilter)
            } else {
                list = list.filter(g => g.source === filters.sourceFilter)
            }
        }

        // Search
        if (filters.search.trim()) {
            const q = filters.search.toLowerCase()
            list = list.filter(g =>
                (g.title || '').toLowerCase().includes(q) ||
                stripHtml(g.description || '').toLowerCase().includes(q) ||
                (g.eligibility || '').toLowerCase().includes(q) ||
                (g.agency_name || '').toLowerCase().includes(q) ||
                (SOURCE_LABELS[g.source] || g.source || '').toLowerCase().includes(q)
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
        filtered, filters, stats, presentSources,
        setSearch, setCashFilter, setAIFilter,
        setStatusFilter, setSourceFilter, setSortBy, setStarredOnly,
        resetFilters,
    }
}
