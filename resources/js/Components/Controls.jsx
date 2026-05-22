import { useState } from 'react'
import { SOURCE_GROUPS, SOURCE_LABELS } from '../hooks/useFilteredGrants'
import { LayoutGrid, RefreshCw, List, Star, Filter, X, ListOrdered } from 'lucide-react'

/** Small count badge used inside status buttons */
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

/**
 * Match % slider.
 * - dragVal  = local state, updates on every pixel of drag (instant label)
 * - onCommit = called only on mouseup/touchend (triggers server fetch)
 */
function MatchSlider({ value, onCommit }) {
    const [dragVal, setDragVal] = useState(value)

    // Keep dragVal in sync when server echoes a new value (e.g. after reset)
    // Use a simple controlled approach: if not dragging, follow prop
    const displayed = dragVal

    const pct    = displayed
    const active = displayed > 0

    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#8A898C] uppercase tracking-widest">Min Match</span>
                <span className={`font-mono text-[11px] font-semibold tabular-nums transition-colors
                    ${active ? 'text-[#006825]' : 'text-[#8A898C]'}`}>
                    {pct > 0 ? `${pct}%+` : 'Any'}
                </span>
            </div>

            <div className="relative flex items-center h-7">
                {/* Track background */}
                <div className="absolute inset-x-0 h-[3px] rounded-full bg-[#C2E8DB]" />
                {/* Filled portion */}
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
                    onTouchEnd={e => onCommit(Number(e.changedTouches[0] ? dragVal : dragVal))}
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

            {/* Step markers */}
            <div className="flex justify-between px-0.5">
                {[0, 25, 50, 75, 100].map(v => (
                    <button
                        key={v}
                        onClick={() => { setDragVal(v); onCommit(v) }}
                        className={`font-mono text-[9px] transition-colors
                            ${v === displayed
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

export default function Controls({
    presentSources, filters, statusCounts = {},
    onStatusFilter, onSourceFilter, onSort,
    onStarredFilter, onMinScore, onDeadlineWindow, onReset,
    viewMode, onViewModeChange,
}) {
    const [filtersOpen, setFiltersOpen] = useState(false)

    const hasActive = filters.search
        || filters.sourceFilter    !== 'all'
        || filters.sortBy          !== 'match'
        || filters.statusFilter    !== 'relevant'
        || filters.starredOnly     !== false
        || filters.minScore        > 0
        || filters.deadlineWindow  !== 'any'

    const selectCls = 'bg-white border border-[#C2E8DB] rounded-lg px-3 py-2 text-[12px] text-[#233B22] outline-none cursor-pointer focus:border-[#006825] transition-colors'

    // Status options with their count + active styling
    const STATUS_OPTIONS = [
        { val: 'relevant', label: 'Relevant', count: statusCounts.relevant, activeText: 'text-[#006825]' },
        { val: 'applied',  label: 'Applied',  count: statusCounts.applied,  activeText: 'text-[#072F98]' },
        { val: 'ignored',  label: 'Ignored',  count: statusCounts.ignored,  activeText: 'text-[#8A898C]' },
    ]

    /** Shared button group for status — used in both desktop and mobile */
    function StatusGroup({ fullWidth = false }) {
        return (
            <div className={`flex bg-[#006825]/10 border border-[#C2E8DB] rounded-lg p-1 gap-0.5 ${fullWidth ? 'w-full' : ''}`}>
                {STATUS_OPTIONS.map(({ val, label, count, activeText }) => {
                    const active = filters.statusFilter === val
                    return (
                        <button key={val} onClick={() => onStatusFilter(val)}
                            className={`flex items-center justify-center gap-1.5 rounded-md text-[12px] transition-all whitespace-nowrap
                                px-2.5 py-1.5
                                ${fullWidth ? 'flex-1' : ''}
                                ${active
                                    ? `bg-white shadow-sm ${activeText} font-medium`
                                    : 'text-[#8A898C] hover:text-[#006825]'
                                }`}>
                            {label}
                            <CountPill n={count} active={active} color={activeText} />
                        </button>
                    )
                })}
            </div>
        )
    }

    // Deadline select — shared between desktop and mobile
    const DeadlineSelect = ({ fullWidth = false }) => (
        <select
            value={filters.deadlineWindow}
            onChange={e => onDeadlineWindow(e.target.value)}
            className={`${selectCls} ${fullWidth ? 'w-full' : 'pr-7'} ${filters.deadlineWindow !== 'any' ? 'border-[#F5601D] text-[#F5601D]' : ''}`}
        >
            <option value="any">Any deadline</option>
            <option value="week">Closing this week</option>
            <option value="month">Closing this month</option>
            <option value="expired">Expired</option>
        </select>
    )

    const filterRows = (
        <div className="flex flex-col gap-3 w-full">
            {/* Status */}
            <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] text-[#8A898C] uppercase tracking-widest">Status</span>
                <StatusGroup fullWidth />
            </div>

            {/* Min Match slider */}
            <MatchSlider value={filters.minScore} onCommit={onMinScore} />

            {/* Deadline window */}
            <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] text-[#8A898C] uppercase tracking-widest">Deadline</span>
                <DeadlineSelect fullWidth />
            </div>

            {/* Source */}
            <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] text-[#8A898C] uppercase tracking-widest">Source</span>
                <select value={filters.sourceFilter} onChange={e => onSourceFilter(e.target.value)}
                    className={`w-full ${selectCls}`}>
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

            {/* Toggles */}
            <div className="flex gap-2">
                <button onClick={() => onStarredFilter(!filters.starredOnly)}
                    className={`flex-1 px-3 py-2 rounded-md text-[12px] border transition-all inline-flex items-center justify-center gap-1.5
                        ${filters.starredOnly ? 'bg-[#fffbe6] border-[#d4a017] text-[#d4a017]' : 'bg-white text-[#8A898C] border-[#C2E8DB] hover:border-[#006825]/30'}`}>
                    <Star size={11} strokeWidth={filters.starredOnly ? 0 : 2} fill={filters.starredOnly ? 'currentColor' : 'none'} />
                    Starred
                </button>
            </div>

            {hasActive && (
                <button onClick={() => { onReset(); setFiltersOpen(false) }}
                    className="flex items-center justify-center gap-1.5 bg-[#d93050]/08 border border-[#d93050]/25 text-[#d93050] rounded-lg px-3 py-2 text-[12px] hover:bg-[#d93050]/15 transition-all w-full">
                    <RefreshCw size={11} /> Reset all filters
                </button>
            )}
        </div>
    )

    return (
        <>
            {/* Desktop layout */}
            <div className="hidden md:flex items-center gap-2 flex-wrap justify-between mb-4">
                <div className="flex flex-row gap-2 flex-wrap items-center">
                    {/* Status button group with counts */}
                    <StatusGroup />

                    {/* Starred toggle */}
                    <button onClick={() => onStarredFilter(!filters.starredOnly)}
                        className={`px-3 py-2.5 rounded-md text-[12px] border transition-all inline-flex items-center gap-1.5
                            ${filters.starredOnly ? 'bg-[#fffbe6] border-[#d4a017] text-[#d4a017]' : 'bg-white text-[#8A898C] border-[#C2E8DB] hover:border-[#006825]/30'}`}>
                        <Star size={11} strokeWidth={filters.starredOnly ? 0 : 2} fill={filters.starredOnly ? 'currentColor' : 'none'} />
                        Starred
                    </button>

                    {/* Deadline window */}
                    <DeadlineSelect />

                    {/* Source select */}
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

                    {/* Sort select */}
                    <div className="relative flex items-center">
                        <ListOrdered size={11} className="absolute left-2.5 text-[#8A898C] pointer-events-none z-10" />
                        <select value={filters.sortBy} onChange={e => onSort(e.target.value)}
                            className={`${selectCls} px-7`}>
                            <option value="match">By Match %</option>
                            <option value="newest">Newest</option>
                            <option value="deadline">By Deadline</option>
                            <option value="amount">By Amount</option>
                            <option value="title">By Title</option>
                            <option value="source">By Source</option>
                        </select>
                    </div>

                    {/* Min match slider — inline on desktop, compact form */}
                    <div className="flex items-center gap-2 bg-white border border-[#C2E8DB] rounded-lg px-3 py-1.5 min-w-[160px]">
                        <span className="font-mono text-[10px] text-[#8A898C] uppercase tracking-widest whitespace-nowrap shrink-0">
                            Match
                        </span>
                        <input
                            type="range"
                            min={0} max={100} step={5}
                            value={filters.minScore}
                            onChange={e => {
                                // Visual-only update handled by the server echo after commit
                                // We need a local ref here — handled by onMinScore debounce
                                onMinScore(Number(e.target.value))
                            }}
                            className="flex-1 h-[3px] appearance-none bg-[#C2E8DB] rounded-full cursor-pointer
                                [&::-webkit-slider-thumb]:appearance-none
                                [&::-webkit-slider-thumb]:w-3.5
                                [&::-webkit-slider-thumb]:h-3.5
                                [&::-webkit-slider-thumb]:rounded-full
                                [&::-webkit-slider-thumb]:bg-[#006825]
                                [&::-webkit-slider-thumb]:border-2
                                [&::-webkit-slider-thumb]:border-white
                                [&::-webkit-slider-thumb]:shadow-[0_1px_3px_rgba(0,104,37,0.4)]
                                [&::-moz-range-thumb]:w-3.5
                                [&::-moz-range-thumb]:h-3.5
                                [&::-moz-range-thumb]:rounded-full
                                [&::-moz-range-thumb]:bg-[#006825]
                                [&::-moz-range-thumb]:border-2
                                [&::-moz-range-thumb]:border-white"
                        />
                        <span className={`font-mono text-[11px] tabular-nums w-8 text-right shrink-0
                            ${filters.minScore > 0 ? 'text-[#006825] font-semibold' : 'text-[#8A898C]'}`}>
                            {filters.minScore > 0 ? `${filters.minScore}%` : 'Any'}
                        </span>
                    </div>
                </div>

                <div className="flex flex-row gap-2 items-center">
                    {hasActive && (
                        <button onClick={onReset}
                            className="flex items-center gap-1.5 bg-[#d93050]/08 border border-[#d93050]/25 text-[#d93050] rounded-lg px-3 py-2 text-[12px] hover:bg-[#d93050]/15 transition-all">
                            <RefreshCw size={11} /> Reset
                        </button>
                    )}

                    <div className="flex items-center gap-0.5 p-1 rounded-lg bg-[#006825]/10 border border-[#C2E8DB]">
                        {[{ id: 'grid', Icon: LayoutGrid }, { id: 'table', Icon: List }].map(({ id, Icon }) => (
                            <button key={id} onClick={() => onViewModeChange(id)}
                                className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${viewMode === id ? 'bg-[#006825] text-white' : 'text-[#8A898C] hover:text-[#006825]'}`}>
                                <Icon size={13} />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile layout */}
            <div className="flex md:hidden items-center gap-2 mb-4 justify-between">
                <div className="flex gap-2">
                    <button onClick={() => setFiltersOpen(true)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] transition-all
                            ${hasActive ? 'bg-[#006825] border-[#006825] text-white' : 'bg-white border-[#C2E8DB] text-[#006825]'}`}>
                        <Filter size={13} /> Filters
                    </button>
                    <div className="relative flex items-center">
                        <ListOrdered size={11} className="absolute left-2.5 text-[#8A898C] pointer-events-none z-10" />
                        <select value={filters.sortBy} onChange={e => onSort(e.target.value)}
                            className={`${selectCls} px-7`}>
                            <option value="match">By Match %</option>
                            <option value="newest">Newest</option>
                            <option value="deadline">By Deadline</option>
                            <option value="amount">By Amount</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center gap-0.5 p-1 rounded-lg bg-[#006825]/10 border border-[#C2E8DB]">
                    {[{ id: 'grid', Icon: LayoutGrid }, { id: 'table', Icon: List }].map(({ id, Icon }) => (
                        <button key={id} onClick={() => onViewModeChange(id)}
                            className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${viewMode === id ? 'bg-[#006825] text-white' : 'text-[#8A898C] hover:text-[#006825]'}`}>
                            <Icon size={13} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Mobile filter sheet */}
            {filtersOpen && (
                <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={() => setFiltersOpen(false)}>
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
                    <div className="relative bg-white rounded-t-2xl p-5 flex flex-col gap-4 shadow-2xl max-h-[85vh] overflow-y-auto"
                        onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h2 className="font-serif font-semibold text-[15px] text-[#233B22]">Filters</h2>
                            <button onClick={() => setFiltersOpen(false)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#C8EFE2] border border-[#C2E8DB] text-[#006825]">
                                <X size={14} />
                            </button>
                        </div>
                        {filterRows}
                        <button onClick={() => setFiltersOpen(false)}
                            className="w-full py-3 rounded-xl bg-[#006825] text-white text-[14px] font-medium">
                            Done
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
