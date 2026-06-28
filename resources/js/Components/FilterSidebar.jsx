import { useState } from 'react'
import { SOURCE_GROUPS, SOURCE_LABELS } from '../hooks/useFilteredGrants'
import {
    RefreshCw, Star, X, ChevronsLeft,
    SlidersHorizontal, UserCheck, Users, UserX,
} from 'lucide-react'

/** Small count badge used inside status/claim buttons */
function CountPill({ n, active, color }) {
    if (n == null) return null
    return (
        <span className={`inline-flex items-center justify-center font-mono text-[9px] font-semibold
            px-1.5 py-0.5 rounded min-w-[18px] leading-none transition-all
            ${active
                ? `bg-white/25 ${color}`
                : 'bg-[#C2E8DB]/60 text-[#8A898C]'
            }`}>
            {n.toLocaleString()}
        </span>
    )
}

/** Section label used above each filter group */
function SectionLabel({ children }) {
    return (
        <span className="font-mono text-[10px] text-[#8A898C] uppercase tracking-widest">
            {children}
        </span>
    )
}

/**
 * Match % slider — local drag state for an instant label, commits to the
 * server only on release (mouseup/touchend) via onCommit.
 */
function MatchSlider({ value, onCommit }) {
    const [dragVal, setDragVal] = useState(value)
    const pct    = dragVal
    const active = dragVal > 0

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <SectionLabel>Min Match</SectionLabel>
                <span className={`font-mono text-[11px] font-semibold tabular-nums transition-colors
                    ${active ? 'text-[#006825]' : 'text-[#8A898C]'}`}>
                    {pct > 0 ? `${pct}%+` : 'Any'}
                </span>
            </div>

            <div className="relative flex items-center h-7">
                <div className="absolute inset-x-0 h-[3px] rounded-full bg-[#C2E8DB]" />
                <div
                    className="absolute left-0 h-[3px] rounded-full bg-[#006825] transition-none"
                    style={{ width: `${pct}%` }}
                />
                <input
                    type="range"
                    min={0} max={100} step={5}
                    value={dragVal}
                    onChange={e => setDragVal(Number(e.target.value))}
                    onMouseUp={e  => onCommit(Number(e.target.value))}
                    onTouchEnd={() => onCommit(dragVal)}
                    className="relative w-full h-[3px] appearance-none bg-transparent cursor-pointer
                        [&::-webkit-slider-thumb]:appearance-none
                        [&::-webkit-slider-thumb]:w-4
                        [&::-webkit-slider-thumb]:h-4
                        [&::-webkit-slider-thumb]:rounded-full
                        [&::-webkit-slider-thumb]:bg-[#006825]
                        [&::-webkit-slider-thumb]:border-2
                        [&::-webkit-slider-thumb]:border-white
                        [&::-webkit-slider-thumb]:shadow-[0_1px_4px_rgba(0,104,37,0.35)]
                        [&::-webkit-slider-thumb]:transition-transform
                        [&::-webkit-slider-thumb]:hover:scale-110
                        [&::-moz-range-thumb]:w-4
                        [&::-moz-range-thumb]:h-4
                        [&::-moz-range-thumb]:rounded-full
                        [&::-moz-range-thumb]:bg-[#006825]
                        [&::-moz-range-thumb]:border-2
                        [&::-moz-range-thumb]:border-white
                        [&::-moz-range-thumb]:shadow-[0_1px_4px_rgba(0,104,37,0.35)]"
                />
            </div>

            <div className="flex justify-between px-0.5">
                {[0, 25, 50, 75, 100].map(v => (
                    <button
                        key={v}
                        onClick={() => { setDragVal(v); onCommit(v) }}
                        className={`font-mono text-[9px] transition-colors
                            ${v === dragVal
                                ? 'text-[#006825] font-semibold'
                                : 'text-[#C2E8DB] hover:text-[#8A898C]'}`}
                    >
                        {v === 0 ? 'Any' : `${v}%`}
                    </button>
                ))}
            </div>
        </div>
    )
}

export default function FilterSidebar({
    open, onClose,
    collapsed, onToggleCollapse,
    presentSources, filters, statusCounts = {}, claimCounts = {},
    onStatusFilter, onSourceFilter, onSort,
    onStarredFilter, onMinScore, onDeadlineWindow,
    onClaimFilter, onExcludeMine,
    onReset,
}) {
    const hasActive = filters.search
        || filters.sourceFilter    !== 'all'
        || filters.sortBy          !== 'match'
        || filters.statusFilter    !== 'all'
        || filters.starredOnly     !== false
        || filters.minScore        > 0
        || filters.deadlineWindow  !== 'any'
        || filters.claimFilter     !== 'any'
        || filters.excludeMine     !== false

    const selectCls = 'bg-white border border-[#C2E8DB] rounded-lg px-3 py-2 text-[12px] text-[#233B22] outline-none cursor-pointer focus:border-[#006825] transition-colors w-full'

    const STATUS_OPTIONS = [
        { val: 'all',      label: 'All',      count: statusCounts.total    },
        { val: 'relevant', label: 'New',      count: statusCounts.relevant },
        { val: 'reviewed', label: 'Reviewed', count: statusCounts.reviewed },
        { val: 'applied',  label: 'Applied',  count: statusCounts.applied  },
        { val: 'ignored',  label: 'Ignored',  count: statusCounts.ignored  },
    ]

    // Claim-status options — visual language matches the lavender claim
    // badge already used in GrantCard.jsx (#D4D9FF / #4a5296 + UserCheck).
    const CLAIM_OPTIONS = [
        { val: 'mine',      label: 'My Grants', count: claimCounts.mine,      Icon: UserCheck },
        { val: 'available', label: 'Available', count: claimCounts.available, Icon: Users     },
        { val: 'claimed',   label: 'Claimed',    count: claimCounts.claimed,   Icon: UserCheck },
    ]
    const claimActiveCls = 'bg-[#D4D9FF]/30 border-[#D4D9FF] text-[#4a5296] font-medium'

    const body = (
        <div className="flex flex-col gap-5 w-full">
            {/* Status */}
            <div className="flex flex-col gap-1.5">
                <SectionLabel>Status</SectionLabel>
                <select
                    value={filters.statusFilter}
                    onChange={e => onStatusFilter(e.target.value)}
                    className={selectCls}
                >
                    {STATUS_OPTIONS.map(({ val, label, count }) => (
                        <option key={val} value={val}>
                            {label}{count != null ? ` (${count.toLocaleString()})` : ''}
                        </option>
                    ))}
                </select>
            </div>

            {/* Claim status */}
            <div className="flex flex-col gap-1.5">
                <SectionLabel>Claim Status</SectionLabel>
                <div className="flex flex-col gap-1">
                    {CLAIM_OPTIONS.map(({ val, label, count, Icon }) => {
                        const active = filters.claimFilter === val
                        return (
                            <button key={val} onClick={() => onClaimFilter(active ? 'any' : val)}
                                className={`flex items-center justify-between gap-1.5 rounded-md text-[12px] border transition-all px-2.5 py-1.5
                                    ${active ? claimActiveCls : 'bg-white text-[#8A898C] border-[#C2E8DB] hover:border-[#D4D9FF]'}`}>
                                <span className="inline-flex items-center gap-1.5">
                                    <Icon size={12} />
                                    {label}
                                </span>
                                <CountPill n={count} active={active} color="text-[#4a5296]" />
                            </button>
                        )
                    })}

                    {/* Contextual "exclude my grants" toggle — only meaningful
                        when viewing the Claimed list. */}
                    {filters.claimFilter === 'claimed' && (
                        <button onClick={() => onExcludeMine(!filters.excludeMine)}
                            className={`flex items-center gap-1.5 rounded-md text-[11px] border transition-all px-2.5 py-1.5 ml-3 mt-0.5
                                ${filters.excludeMine
                                    ? 'bg-[#d93050]/08 border-[#d93050]/25 text-[#d93050]'
                                    : 'bg-white text-[#8A898C] border-[#C2E8DB] hover:border-[#d93050]/25'}`}>
                            <UserX size={11} />
                            Exclude my grants
                        </button>
                    )}
                </div>
            </div>

            {/* Min Match slider */}
            <MatchSlider value={filters.minScore} onCommit={onMinScore} />

            {/* Deadline window */}
            <div className="flex flex-col gap-1.5">
                <SectionLabel>Deadline</SectionLabel>
                <select
                    value={filters.deadlineWindow}
                    onChange={e => onDeadlineWindow(e.target.value)}
                    className={`${selectCls} ${filters.deadlineWindow !== 'any' ? 'border-[#F5601D] text-[#F5601D]' : ''}`}
                >
                    <option value="any">Any deadline</option>
                    <option value="week">Closing this week</option>
                    <option value="month">Closing this month</option>
                    <option value="expired">Expired</option>
                </select>
            </div>

            {/* Source */}
            <div className="flex flex-col gap-1.5">
                <SectionLabel>Source</SectionLabel>
                <select value={filters.sourceFilter} onChange={e => onSourceFilter(e.target.value)}
                    className={selectCls}>
                    <option value="all">All Sources</option>
                    {Object.entries(SOURCE_GROUPS).map(([method, group]) =>
                        group.sources.some(s => presentSources.has(s)) && (
                            <optgroup key={method} label={group.label}>
                                {group.sources.filter(s => presentSources.has(s)).map(s => (
                                    <option key={s} value={s}>{SOURCE_LABELS[s] || s}</option>
                                ))}
                            </optgroup>
                        )
                    )}
                </select>
            </div>

            {/* Sort */}
            <div className="flex flex-col gap-1.5">
                <SectionLabel>Sort By</SectionLabel>
                <select value={filters.sortBy} onChange={e => onSort(e.target.value)}
                    className={selectCls}>
                    <option value="match">By Match %</option>
                    <option value="newest">Newest</option>
                    <option value="deadline">By Deadline</option>
                    <option value="amount">By Amount</option>
                    <option value="title">By Title</option>
                    <option value="source">By Source</option>
                </select>
            </div>

            {/* Starred toggle */}
            <button onClick={() => onStarredFilter(!filters.starredOnly)}
                className={`px-3 py-2 rounded-md text-[12px] border transition-all inline-flex items-center justify-center gap-1.5
                    ${filters.starredOnly ? 'bg-[#fffbe6] border-[#d4a017] text-[#d4a017]' : 'bg-white text-[#8A898C] border-[#C2E8DB] hover:border-[#006825]/30'}`}>
                <Star size={11} strokeWidth={filters.starredOnly ? 0 : 2} fill={filters.starredOnly ? 'currentColor' : 'none'} />
                Starred
            </button>

            {hasActive && (
                <button onClick={onReset}
                    className="flex items-center justify-center gap-1.5 bg-[#d93050]/08 border border-[#d93050]/25 text-[#d93050] rounded-lg px-3 py-2 text-[12px] hover:bg-[#d93050]/15 transition-all w-full">
                    <RefreshCw size={11} /> Reset all filters
                </button>
            )}
        </div>
    )

    return (
        <>
            {/* ── Desktop: persistent rail, renders nothing at all when collapsed.
                The reopen control lives in Controls.jsx above the grants;
                the only way to close it is the button inside the rail itself. ── */}
            {!collapsed && (
                // Fixed to the viewport (never scrolls with the page) — only the
                // content inside scrolls when it overflows. `left` mirrors
                // AppLayout's `max-w-[1600px] mx-auto px-4 md:px-8` main container
                // so the rail lines up with the grants column at every width
                // instead of drifting once the viewport exceeds 1600px.
                <aside className="hidden md:flex flex-col shrink-0 fixed top-[80px] h-[calc(100vh-6rem)]
                    bg-white border border-[#C2E8DB] rounded-2xl overflow-hidden w-[260px] z-10"
                    style={{ left: 'max(1rem, calc((100vw - 1600px) / 2 + 2rem))' }}>
                    <div className="flex items-center justify-between shrink-0 border-b border-[#C2E8DB] p-3">
                        <span className="inline-flex items-center gap-1.5 font-serif font-semibold text-[13px] text-[#233B22]">
                            <SlidersHorizontal size={13} className="text-[#006825]" /> Filters
                        </span>
                        <button onClick={onToggleCollapse}
                            title="Collapse filters"
                            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#8A898C] hover:bg-[#C8EFE2] hover:text-[#006825] transition-colors shrink-0">
                            <ChevronsLeft size={14} />
                        </button>
                    </div>
                    <div className="p-4 overflow-y-auto">
                        {body}
                    </div>
                </aside>
            )}

            {/* ── Mobile: slide-in overlay drawer ── */}
            {open && (
                <div className="fixed inset-0 z-50 flex md:hidden" onClick={onClose}>
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
                    <div className="relative bg-white w-[85%] max-w-[320px] h-full p-5 flex flex-col gap-4 shadow-2xl overflow-y-auto"
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between shrink-0">
                            <h2 className="font-serif font-semibold text-[15px] text-[#233B22]">Filters</h2>
                            <button onClick={onClose}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#C8EFE2] border border-[#C2E8DB] text-[#006825]">
                                <X size={14} />
                            </button>
                        </div>
                        {body}
                        <button onClick={onClose}
                            className="w-full py-3 rounded-xl bg-[#006825] text-white text-[14px] font-medium shrink-0">
                            Done
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
