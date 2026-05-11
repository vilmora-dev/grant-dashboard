import { useState } from 'react'
import { LayoutGrid, ChevronDown, SlidersHorizontal, RefreshCw, List, Star, Filter, X } from 'lucide-react'

export default function Controls({
    sources, filters,
    onCashFilter, onAIFilter, onStatusFilter, onSourceFilter, onSort, onStarredFilter, onReset,
    viewMode, onViewModeChange,
}) {
    const [filtersOpen, setFiltersOpen] = useState(false)

    const hasActive = filters.search
        || filters.cashFilter   !== 'all'
        || filters.ai_analyzed  !== false
        || filters.sourceFilter !== 'all'
        || filters.sortBy       !== 'match'
        || filters.statusFilter !== 'relevant'
        || filters.starredOnly  !== false

    const filterRows = (
        <div className="flex flex-col gap-3 w-full">
            {/* Type */}
            <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] text-[#5a9090] uppercase tracking-widest">Type</span>
                <div className="flex bg-[#def2f1] border border-[#b2d8d8] rounded-lg p-1 gap-0.5">
                    {[['all','All'],['cash','$ Cash'],['nocash','Non-Cash']].map(([val, label]) => (
                        <button key={val} onClick={() => onCashFilter(val)}
                            className={`flex-1 px-3 py-1.5 rounded-md text-[12px] transition-all whitespace-nowrap
                                ${filters.cashFilter === val
                                    ? val === 'cash' ? 'bg-white text-[#d4a017] shadow-sm' : 'bg-white text-[#0d2b2b] shadow-sm'
                                    : 'text-[#5a9090] hover:text-[#2b6e6b]'}`}>
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] text-[#5a9090] uppercase tracking-widest">Status</span>
                <div className="relative">
                    <select value={filters.statusFilter} onChange={e => onStatusFilter(e.target.value)}
                        className="w-full bg-[#def2f1] border border-[#b2d8d8] rounded-lg pl-3 pr-7 py-2 text-[12px] text-[#2b6e6b] outline-none appearance-none cursor-pointer focus:border-[#3aafa9]">
                        <option value="relevant">Relevant</option>
                        <option value="applied">Applied</option>
                        <option value="ignored">Ignored</option>
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5a9090] pointer-events-none" />
                </div>
            </div>

            {/* Source */}
            <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] text-[#5a9090] uppercase tracking-widest">Source</span>
                <div className="relative">
                    <select value={filters.sourceFilter} onChange={e => onSourceFilter(e.target.value)}
                        className="w-full bg-[#def2f1] border border-[#b2d8d8] rounded-lg pl-3 pr-7 py-2 text-[12px] text-[#2b6e6b] outline-none appearance-none cursor-pointer focus:border-[#3aafa9]">
                        {sources.map(s => (
                            <option key={s} value={s}>{s === 'all' ? 'All Sources' : s === 'duckduckgo' ? 'Web search' : s}</option>
                        ))}
                    </select>
                    <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5a9090] pointer-events-none" />
                </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-2">
                <button onClick={() => onAIFilter(!filters.ai_analyzed)}
                    className={`flex-1 px-3 py-2 rounded-md text-[12px] border transition-all
                        ${filters.ai_analyzed ? 'bg-[#def2f1] border-[#3aafa9] text-[#3aafa9]' : 'bg-[#def2f1] text-[#5a9090] border-[#b2d8d8] hover:border-[#8ec8c7]'}`}>
                    AI analyzed
                </button>
                <button onClick={() => onStarredFilter(!filters.starredOnly)}
                    className={`flex-1 px-3 py-2 rounded-md text-[12px] border transition-all inline-flex items-center justify-center gap-1.5
                        ${filters.starredOnly ? 'bg-[#fffbe6] border-[#d4a017] text-[#d4a017]' : 'bg-[#def2f1] text-[#5a9090] border-[#b2d8d8] hover:border-[#8ec8c7]'}`}>
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
                <div className="flex flex-row gap-2 flex-wrap">
                    {/* Cash pills */}
                    <div className="flex bg-[#def2f1] border border-[#b2d8d8] rounded-lg p-1 gap-0.5">
                        {[['all','All'],['cash','$ Cash'],['nocash','Non-Cash']].map(([val, label]) => (
                            <button key={val} onClick={() => onCashFilter(val)}
                                className={`px-3 py-1.5 rounded-md text-[12px] transition-all whitespace-nowrap
                                    ${filters.cashFilter === val
                                        ? val === 'cash' ? 'bg-white text-[#d4a017] shadow-sm' : 'bg-white text-[#0d2b2b] shadow-sm'
                                        : 'text-[#5a9090] hover:text-[#2b6e6b]'}`}>
                                {label}
                            </button>
                        ))}
                    </div>

                    <button onClick={() => onAIFilter(!filters.ai_analyzed)}
                        className={`px-3 py-1.5 rounded-md text-[12px] border transition-all
                            ${filters.ai_analyzed ? 'bg-[#def2f1] border-[#3aafa9] text-[#3aafa9]' : 'bg-[#def2f1] text-[#5a9090] border-[#b2d8d8] hover:border-[#8ec8c7]'}`}>
                        AI analyzed
                    </button>

                    <button onClick={() => onStarredFilter(!filters.starredOnly)}
                        className={`px-3 py-1.5 rounded-md text-[12px] border transition-all inline-flex items-center gap-1.5
                            ${filters.starredOnly ? 'bg-[#fffbe6] border-[#d4a017] text-[#d4a017]' : 'bg-[#def2f1] text-[#5a9090] border-[#b2d8d8] hover:border-[#8ec8c7]'}`}>
                        <Star size={11} strokeWidth={filters.starredOnly ? 0 : 2} fill={filters.starredOnly ? 'currentColor' : 'none'} />
                        Starred
                    </button>

                    <div className="relative">
                        <select value={filters.sourceFilter} onChange={e => onSourceFilter(e.target.value)}
                            className="bg-[#def2f1] border border-[#b2d8d8] rounded-lg pl-3 pr-7 py-2 text-[12px] text-[#2b6e6b] outline-none appearance-none cursor-pointer focus:border-[#3aafa9]">
                            {sources.map(s => <option key={s} value={s}>{s === 'all' ? 'All Sources' : s === 'duckduckgo' ? 'Web search' : s}</option>)}
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5a9090] pointer-events-none" />
                    </div>

                    <div className="relative">
                        <SlidersHorizontal size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5a9090] pointer-events-none" />
                        <select value={filters.sortBy} onChange={e => onSort(e.target.value)}
                            className="bg-[#def2f1] border border-[#b2d8d8] rounded-lg pl-7 pr-7 py-2 text-[12px] text-[#2b6e6b] outline-none appearance-none cursor-pointer focus:border-[#3aafa9]">
                            <option value="match">By Match %</option>
                            <option value="newest">Newest</option>
                            <option value="deadline">By Deadline</option>
                            <option value="amount">By Amount</option>
                            <option value="title">By Title</option>
                            <option value="source">By Source</option>
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5a9090] pointer-events-none" />
                    </div>
                </div>

                <div className="flex flex-row gap-2">
                    {hasActive && (
                        <button onClick={onReset}
                            className="flex items-center gap-1.5 bg-[#d93050]/08 border border-[#d93050]/25 text-[#d93050] rounded-lg px-3 py-2 text-[12px] hover:bg-[#d93050]/15 transition-all">
                            <RefreshCw size={11} /> Reset
                        </button>
                    )}
                    <div className="relative">
                        <select value={filters.statusFilter} onChange={e => onStatusFilter(e.target.value)}
                            className="bg-[#def2f1] border border-[#b2d8d8] rounded-lg pl-3 pr-7 py-2 text-[12px] text-[#2b6e6b] outline-none appearance-none cursor-pointer focus:border-[#3aafa9]">
                            <option value="relevant">Relevant</option>
                            <option value="applied">Applied</option>
                            <option value="ignored">Ignored</option>
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5a9090] pointer-events-none" />
                    </div>
                    <div className="flex items-center gap-0.5 p-1 rounded-lg bg-[#def2f1] border border-[#b2d8d8]">
                        {[{ id: 'grid', Icon: LayoutGrid }, { id: 'table', Icon: List }].map(({ id, Icon }) => (
                            <button key={id} onClick={() => onViewModeChange(id)}
                                className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${viewMode === id ? 'bg-[#3aafa9] text-white' : 'text-[#5a9090] hover:text-[#2b6e6b]'}`}>
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
                            ${hasActive ? 'bg-[#3aafa9] border-[#3aafa9] text-white' : 'bg-[#def2f1] border-[#b2d8d8] text-[#5a9090]'}`}>
                        <Filter size={13} /> Filters
                    </button>
                    <div className="relative">
                        <SlidersHorizontal size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5a9090] pointer-events-none" />
                        <select value={filters.sortBy} onChange={e => onSort(e.target.value)}
                            className="bg-[#def2f1] border border-[#b2d8d8] rounded-lg pl-7 pr-7 py-2 text-[12px] text-[#2b6e6b] outline-none appearance-none cursor-pointer">
                            <option value="match">By Match %</option>
                            <option value="newest">Newest</option>
                            <option value="deadline">By Deadline</option>
                            <option value="amount">By Amount</option>
                        </select>
                        <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#5a9090] pointer-events-none" />
                    </div>
                </div>
                <div className="flex items-center gap-0.5 p-1 rounded-lg bg-[#def2f1] border border-[#b2d8d8]">
                    {[{ id: 'grid', Icon: LayoutGrid }, { id: 'table', Icon: List }].map(({ id, Icon }) => (
                        <button key={id} onClick={() => onViewModeChange(id)}
                            className={`w-7 h-7 flex items-center justify-center rounded-md transition-all ${viewMode === id ? 'bg-[#3aafa9] text-white' : 'text-[#5a9090]'}`}>
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
                            <h2 className="font-serif font-semibold text-[15px] text-[#0d2b2b]">Filters</h2>
                            <button onClick={() => setFiltersOpen(false)}
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#def2f1] border border-[#b2d8d8] text-[#5a9090]">
                                <X size={14} />
                            </button>
                        </div>
                        {filterRows}
                        <button onClick={() => setFiltersOpen(false)}
                            className="w-full py-3 rounded-xl bg-[#3aafa9] text-white text-[14px] font-medium">
                            Done
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
