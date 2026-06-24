import { useCallback, useRef } from 'react'
import { router, usePage } from '@inertiajs/react'

/**
 * URL-driven filter state for the grants dashboard.
 *
 * All filter values come from Inertia's server-echoed `filters` prop,
 * so the URL is always the source of truth. Each setter fires a partial
 * Inertia reload (only: ['grants', 'meta', 'filters']) so the page never
 * fully reloads - it just swaps the data props.
 *
 * Search is debounced 300ms to avoid hammering the server on every keystroke.
 */
export function useGrantFilters() {
    const { filters = {} } = usePage().props

    // Stable debounce refs
    const searchTimer    = useRef(null)
    const minScoreTimer  = useRef(null)

    /**
     * Fire a partial Inertia GET with the given param overrides.
     * Always resets `page` to 1 when a filter changes (not when page changes).
     */
    const navigate = useCallback((changes, resetPage = true) => {
        const params = {
            ...filters,
            ...(resetPage ? { page: 1 } : {}),
            ...changes,
        }
        // Strip defaults so the URL stays clean
        if (!params.ai_analyzed)                    delete params.ai_analyzed
        if (!params.starred)                        delete params.starred
        if (!params.search)                         delete params.search
        if (!params.min_score || params.min_score === 0) delete params.min_score
        if (!params.deadline_window || params.deadline_window === 'any') delete params.deadline_window
        if (!params.claim || params.claim === 'any') delete params.claim
        // exclude_mine only means anything alongside claim=claimed
        if (!params.exclude_mine || params.claim !== 'claimed') delete params.exclude_mine

        router.get('/dashboard', params, {
            preserveState:  true,
            preserveScroll: true,
            replace:        true,
            only:           ['grants', 'meta', 'filters'],
        })
    }, [filters])

    // Setters

    function setSearch(v) {
        clearTimeout(searchTimer.current)
        searchTimer.current = setTimeout(() => navigate({ search: v }), 300)
    }

    function setStatusFilter(v)    { navigate({ status: v }) }
    function setSourceFilter(v)    { navigate({ source: v }) }
    function setSortBy(v)          { navigate({ sort: v }) }
    function setStarredOnly(v)     { navigate({ starred: v }) }
    function setPage(p)            { navigate({ page: p }, false) }
    function setDeadlineWindow(v)  { navigate({ deadline_window: v }) }

    // Switching claim filter away from 'claimed' clears exclude_mine too,
    // since the toggle only makes sense in that context.
    function setClaimFilter(v) {
        navigate(v === 'claimed' ? { claim: v } : { claim: v, exclude_mine: false })
    }
    function setExcludeMine(v)     { navigate({ exclude_mine: v }) }

    // Debounced - slider fires on every pixel of drag; only hit server on release
    function setMinScore(v) {
        clearTimeout(minScoreTimer.current)
        minScoreTimer.current = setTimeout(() => navigate({ min_score: v }), 400)
    }

    function resetFilters() {
        navigate({
            status:          'relevant',
            source:          'all',
            sort:            'match',
            search:          '',
            starred:         false,
            min_score:       0,
            deadline_window: 'any',
            claim:           'any',
            exclude_mine:    false,
            page:            1,
        }, false)
    }

    // Normalised filter object (matches Controls.jsx expectations)
    const normalisedFilters = {
        search:          filters.search          ?? '',
        statusFilter:    filters.status          ?? 'relevant',
        sourceFilter:    filters.source          ?? 'all',
        sortBy:          filters.sort            ?? 'match',
        starredOnly:     filters.starred         ?? false,
        minScore:        filters.min_score       ?? 0,
        deadlineWindow:  filters.deadline_window ?? 'any',
        claimFilter:     filters.claim           ?? 'any',
        excludeMine:     filters.exclude_mine    ?? false,
    }

    return {
        filters: normalisedFilters,
        setSearch,
        setStatusFilter,
        setSourceFilter,
        setSortBy,
        setStarredOnly,
        setPage,
        setMinScore,
        setDeadlineWindow,
        setClaimFilter,
        setExcludeMine,
        resetFilters,
    }
}
