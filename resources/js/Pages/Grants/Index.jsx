import { useState, useCallback, useEffect } from 'react'
import { Head, router, usePage } from '@inertiajs/react'
import { Inbox } from 'lucide-react'
import AppLayout from '../../Layouts/AppLayout'
import GrantCard from '../../Components/GrantCard'
import Controls from '../../Components/Controls'
import FilterSidebar from '../../Components/FilterSidebar'
import GrantModal from '../../Components/GrantModal'
import Pagination from '../../Components/Pagination'
import { useGrantFilters } from '../../hooks/useGrantFilters'

/**
 * Grants/Index — server-paginated grants dashboard.
 *
 * Inertia props:
 *   grants         — array of 24 grant objects for the current page
 *   meta           — { total, per_page, current_page, last_page, from, to }
 *   counts         — { total, applied }  (full-table counts, not filtered)
 *   presentSources — array of distinct source strings in the DB
 *   filters        — server-echoed active filter values
 */
export default function GrantsIndex() {
    const { grants = [], meta = {}, counts = {}, presentSources = [] } = usePage().props

    const {
        filters, setSearch,
        setStatusFilter, setSourceFilter, setSortBy,
        setStarredOnly, setPage, setMinScore, setDeadlineWindow,
        setClaimFilter, setExcludeMine, resetFilters,
    } = useGrantFilters()

    const [selected,       setSelected]       = useState(null)
    const [lastSelectedId, setLastSelectedId] = useState(null)
    const [viewMode,       setViewMode]       = useState('grid')

    // Sidebar UI state — desktop collapse + mobile drawer, independent of
    // the filters themselves (purely a layout concern).
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)

    // Optimistic update: when a grant is patched in the modal, update
    // the local copy so the card reflects the change without a reload.
    const [localGrants, setLocalGrants] = useState(grants)
    useEffect(() => { setLocalGrants(grants) }, [grants])

    const handleUpdate = useCallback((updated) => {
        setLocalGrants(prev => prev.map(g => g.id === updated.id ? { ...g, ...updated } : g))
        if (selected?.id === updated.id) {
            setSelected(prev => ({ ...prev, ...updated }))
        }
    }, [selected])

    function handleSelect(grant) {
        setLastSelectedId(grant._id)
        setSelected(grant)
    }

    // Thin top-bar progress indicator on Inertia navigations
    const [loading, setLoading] = useState(false)
    useEffect(() => {
        const off1 = router.on('start',  () => setLoading(true))
        const off2 = router.on('finish', () => setLoading(false))
        return () => { off1(); off2() }
    }, [])

    // Stats for the AppLayout navbar pills
    const navStats = {
        total:   counts.total,
        applied: counts.applied,
        from:    meta.from,
        to:      meta.to,
        shown:   meta.total,   // total matching current filters
    }

    return (
        <>
            <Head title="Grants Dashboard" />

            {/* Loading bar */}
            {loading && (
                <div className="fixed top-0 left-0 right-0 z-[100] h-[2px] bg-[#C8EFE2] overflow-hidden">
                    <div className="h-full bg-[#006825]"
                        style={{ animation: 'loadbar 1.2s ease-in-out infinite' }} />
                </div>
            )}

            <AppLayout stats={navStats} committedSearch={filters.search} onSearch={setSearch}>
                <div className="flex gap-5 items-start">
                    <FilterSidebar
                        open={mobileFiltersOpen}
                        onClose={() => setMobileFiltersOpen(false)}
                        collapsed={sidebarCollapsed}
                        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
                        presentSources={new Set(presentSources)}
                        filters={filters}
                        statusCounts={{
                            relevant: counts.relevant,
                            applied:  counts.applied,
                            ignored:  counts.ignored,
                            reviewed: counts.reviewed,
                        }}
                        claimCounts={{
                            mine:      counts.mine,
                            available: counts.available,
                            claimed:   counts.claimed,
                        }}
                        onStatusFilter={setStatusFilter}
                        onSourceFilter={setSourceFilter}
                        onSort={setSortBy}
                        onStarredFilter={setStarredOnly}
                        onMinScore={setMinScore}
                        onDeadlineWindow={setDeadlineWindow}
                        onClaimFilter={setClaimFilter}
                        onExcludeMine={setExcludeMine}
                        onReset={resetFilters}
                    />

                    {/* FilterSidebar is position:fixed (so it never scrolls with
                        the page), which pulls it out of this flex row entirely.
                        This spacer reserves the same width so the grants column
                        doesn't slide under it — and takes zero space itself
                        when the sidebar is collapsed. */}
                    {!sidebarCollapsed && (
                        <div className="hidden md:block shrink-0 w-[260px]" aria-hidden="true" />
                    )}

                    <div className="flex-1 min-w-0">
                        <Controls
                            filters={filters}
                            onStatusFilter={setStatusFilter}
                            onSourceFilter={setSourceFilter}
                            onSort={setSortBy}
                            onStarredFilter={setStarredOnly}
                            onMinScore={setMinScore}
                            onDeadlineWindow={setDeadlineWindow}
                            onClaimFilter={setClaimFilter}
                            onExcludeMine={setExcludeMine}
                            onSearch={setSearch}
                            onReset={resetFilters}
                            viewMode={viewMode}
                            onViewModeChange={setViewMode}
                            onOpenMobileFilters={() => setMobileFiltersOpen(true)}
                            sidebarCollapsed={sidebarCollapsed}
                            onOpenSidebar={() => setSidebarCollapsed(false)}
                        />

                        {localGrants.length === 0 ? (
                            <EmptyState
                                hasFilters={
                                    filters.search ||
                                    filters.sourceFilter !== 'all' ||
                                    filters.statusFilter !== 'all' ||
                                    filters.starredOnly ||
                                    filters.minScore > 0 ||
                                    filters.deadlineWindow !== 'any' ||
                                    filters.claimFilter !== 'any' ||
                                    filters.excludeMine
                                }
                                onReset={resetFilters}
                            />
                        ) : viewMode === 'grid' ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {localGrants.map((grant) => (
                                        <GrantCard
                                            key={grant._id}
                                            grant={grant}
                                            onSelect={() => handleSelect(grant)}
                                            isLastSelected={grant._id === lastSelectedId}
                                            onUpdate={handleUpdate}
                                        />
                                    ))}
                                </div>
                                <Pagination
                                    page={meta.current_page}
                                    totalPages={meta.last_page}
                                    totalItems={meta.total}
                                    from={meta.from}
                                    to={meta.to}
                                    setPage={setPage}
                                />
                            </>
                        ) : (
                            <>
                                <GrantsTable
                                    grants={localGrants}
                                    onSelect={handleSelect}
                                    lastSelectedId={lastSelectedId}
                                />
                                <Pagination
                                    page={meta.current_page}
                                    totalPages={meta.last_page}
                                    totalItems={meta.total}
                                    from={meta.from}
                                    to={meta.to}
                                    setPage={setPage}
                                />
                            </>
                        )}
                    </div>
                </div>

                {selected && (
                    <GrantModal
                        grant={selected}
                        onClose={() => setSelected(null)}
                        onUpdate={handleUpdate}
                    />
                )}
            </AppLayout>

            {/* Loading bar keyframes */}
            <style>{`
                @keyframes loadbar {
                    0%   { transform: translateX(-100%); width: 60%; }
                    50%  { transform: translateX(66%);   width: 60%; }
                    100% { transform: translateX(200%);  width: 60%; }
                }
            `}</style>
        </>
    )
}

/** Table view */
function GrantsTable({ grants, onSelect, lastSelectedId }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-[#C2E8DB]">
            <table className="w-full text-[12px] font-sans">
                <thead>
                    <tr className="bg-[#C8EFE2] text-[#8A898C] font-mono text-[10px] uppercase tracking-widest">
                        <th className="px-4 py-3 text-left">Title</th>
                        <th className="px-4 py-3 text-left">Amount</th>
                        <th className="px-4 py-3 text-left">Deadline</th>
                        <th className="px-4 py-3 text-left">Source</th>
                        <th className="px-4 py-3 text-left">Match</th>
                    </tr>
                </thead>
                <tbody>
                    {grants.map(grant => (
                        <tr key={grant._id}
                            onClick={() => onSelect(grant)}
                            className={`border-t border-[#C2E8DB] cursor-pointer hover:bg-[#C8EFE2]/40 transition-colors
                                ${grant._id === lastSelectedId ? 'bg-[#C8EFE2]/40' : 'bg-white'}`}>
                            <td className="px-4 py-3 max-w-[340px] truncate text-[#233B22] font-medium">{grant.title}</td>
                            <td className="px-4 py-3 font-mono text-[#006825] whitespace-nowrap">{grant.amount || '—'}</td>
                            <td className="px-4 py-3 text-[#5D5961] whitespace-nowrap">{grant.deadline || '—'}</td>
                            <td className="px-4 py-3 text-[#5D5961]">
                                {grant.source === 'duckduckgo' ? 'web' : grant.source || '—'}
                            </td>
                            <td className="px-4 py-3 font-mono text-[#006825]">
                                {grant.relevance_score ? `${grant.relevance_score}%` : '—'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function EmptyState({ hasFilters, onReset }) {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-24">
            <div className="w-12 h-12 rounded-2xl bg-[#C8EFE2] border border-[#C2E8DB] flex items-center justify-center">
                <Inbox size={22} className="text-[#006825]" />
            </div>
            <div className="text-center">
                <p className="text-[#233B22] font-medium mb-1">No grants found</p>
                <p className="font-mono text-[12px] text-[#8A898C]">
                    {hasFilters ? 'Try adjusting your filters.' : 'No data available.'}
                </p>
            </div>
            {hasFilters && (
                <button onClick={onReset}
                    className="flex items-center gap-2 bg-[#C8EFE2] border border-[#C2E8DB] text-[#006825] rounded-lg px-4 py-2 text-[13px] hover:bg-[#C2E8DB] transition-all">
                    Clear filters
                </button>
            )}
        </div>
    )
}
