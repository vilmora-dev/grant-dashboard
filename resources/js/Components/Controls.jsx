import { SOURCE_LABELS } from '../hooks/useFilteredGrants'
import { LayoutGrid, List, Filter, X, RefreshCw } from 'lucide-react'

const STATUS_LABELS = { relevant: 'Relevant', applied: 'Applied', ignored: 'Ignored', reviewed: 'Reviewed' }
const CLAIM_LABELS  = { mine: 'My Grants', available: 'Available', claimed: 'Claimed' }
const SORT_LABELS   = { newest: 'Newest', deadline: 'By Deadline', amount: 'By Amount', title: 'By Title', source: 'By Source' }
const DEADLINE_LABELS = { week: 'Closing this week', month: 'Closing this month', expired: 'Expired' }

/** One removable filter chip */
function Chip({ label, onRemove }) {
    return (
        <span className="inline-flex items-center gap-1.5 bg-[#C8EFE2] border border-[#C2E8DB] text-[#233B22] rounded-full pl-3 pr-1.5 py-1 text-[12px] whitespace-nowrap">
            {label}
            <button onClick={onRemove}
                title={`Remove "${label}" filter`}
                className="w-4 h-4 flex items-center justify-center rounded-full text-[#8A898C] hover:bg-[#006825] hover:text-white transition-colors">
                <X size={10} />
            </button>
        </span>
    )
}

/**
 * Controls — slim active-filter chip bar.
 *
 * All actual filter inputs now live in FilterSidebar.jsx. This component
 * only renders: a Filters button (opens the sidebar on mobile, with an
 * active-filter count badge), one removable chip per active non-default
 * filter, and the grid/table view toggle.
 *
 * On desktop, the sidebar itself renders nothing at all when collapsed —
 * so the only way back in is the "Filters" button here, which appears
 * only while sidebarCollapsed is true and disappears once it's open
 * (closing happens from inside the sidebar itself).
 */
export default function Controls({
    filters,
    onStatusFilter, onSourceFilter, onSort,
    onStarredFilter, onMinScore, onDeadlineWindow,
    onClaimFilter, onExcludeMine, onSearch,
    onReset,
    viewMode, onViewModeChange,
    onOpenMobileFilters,
    sidebarCollapsed, onOpenSidebar,
}) {
    const chips = []

    if (filters.statusFilter !== 'relevant') {
        chips.push({ key: 'status', label: STATUS_LABELS[filters.statusFilter] ?? filters.statusFilter, onRemove: () => onStatusFilter('relevant') })
    }
    if (filters.claimFilter !== 'any') {
        chips.push({ key: 'claim', label: CLAIM_LABELS[filters.claimFilter] ?? filters.claimFilter, onRemove: () => onClaimFilter('any') })
    }
    if (filters.claimFilter === 'claimed' && filters.excludeMine) {
        chips.push({ key: 'exclude_mine', label: 'Excluding my grants', onRemove: () => onExcludeMine(false) })
    }
    if (filters.sourceFilter !== 'all') {
        chips.push({ key: 'source', label: SOURCE_LABELS[filters.sourceFilter] ?? filters.sourceFilter, onRemove: () => onSourceFilter('all') })
    }
    if (filters.sortBy !== 'match') {
        chips.push({ key: 'sort', label: `Sort: ${SORT_LABELS[filters.sortBy] ?? filters.sortBy}`, onRemove: () => onSort('match') })
    }
    if (filters.starredOnly) {
        chips.push({ key: 'starred', label: 'Starred', onRemove: () => onStarredFilter(false) })
    }
    if (filters.minScore > 0) {
        chips.push({ key: 'min_score', label: `Match ≥ ${filters.minScore}%`, onRemove: () => onMinScore(0) })
    }
    if (filters.deadlineWindow !== 'any') {
        chips.push({ key: 'deadline', label: DEADLINE_LABELS[filters.deadlineWindow] ?? filters.deadlineWindow, onRemove: () => onDeadlineWindow('any') })
    }
    if (filters.search) {
        chips.push({ key: 'search', label: `"${filters.search}"`, onRemove: () => onSearch('') })
    }

    const hasActive = chips.length > 0

    return (
        <div className="flex items-center gap-2 flex-wrap justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
                {/* Filters button — opens the sidebar drawer on mobile */}
                <button onClick={onOpenMobileFilters}
                    className={`md:hidden flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] transition-all
                        ${hasActive ? 'bg-[#006825] border-[#006825] text-white' : 'bg-white border-[#C2E8DB] text-[#006825]'}`}>
                    <Filter size={13} /> Filters
                    {hasActive && (
                        <span className="inline-flex items-center justify-center font-mono text-[9px] font-semibold bg-white/25 rounded-full min-w-[16px] px-1 leading-none">
                            {chips.length}
                        </span>
                    )}
                </button>

                {/* Filters button — desktop only, and only while the sidebar
                    is collapsed (it renders nothing in that state, so this
                    is the sole way to reopen it). Disappears once open. */}
                {sidebarCollapsed && (
                    <button onClick={onOpenSidebar}
                        title="Show filters"
                        className={`hidden md:flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] transition-all
                            ${hasActive ? 'bg-[#006825] border-[#006825] text-white' : 'bg-white border-[#C2E8DB] text-[#006825] hover:border-[#006825]/40'}`}>
                        <Filter size={13} /> Filters
                        {hasActive && (
                            <span className="inline-flex items-center justify-center font-mono text-[9px] font-semibold bg-white/25 rounded-full min-w-[16px] px-1 leading-none">
                                {chips.length}
                            </span>
                        )}
                    </button>
                )}

                {/* Active filter chips */}
                {chips.map(c => (
                    <Chip key={c.key} label={c.label} onRemove={c.onRemove} />
                ))}

                {hasActive && (
                    <button onClick={onReset}
                        className="hidden md:inline-flex items-center gap-1.5 text-[#8A898C] hover:text-[#d93050] rounded-lg px-2 py-1.5 text-[12px] transition-all">
                        <RefreshCw size={11} /> Clear all
                    </button>
                )}
            </div>

            {/* Grid/table view toggle */}
            <div className="flex items-center gap-0.5 p-1 rounded-lg bg-[#006825]/10 border border-[#C2E8DB] shrink-0">
                {[{ id: 'grid', Icon: LayoutGrid }, { id: 'table', Icon: List }].map(({ id, Icon }) => (
                    <button key={id} onClick={() => onViewModeChange(id)}
                        className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${viewMode === id ? 'bg-[#006825] text-white' : 'text-[#8A898C] hover:text-[#006825]'}`}>
                        <Icon size={13} />
                    </button>
                ))}
            </div>
        </div>
    )
}
