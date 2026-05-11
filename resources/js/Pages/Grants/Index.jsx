import { useState, useCallback } from 'react'
import { Head, router } from '@inertiajs/react'
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react'
import AppLayout from '../../Layouts/AppLayout'
import GrantCard from '../../Components/GrantCard'
import Controls from '../../Components/Controls'
import GrantModal from '../../Components/GrantModal'
import ConfigPage from '../Config/Index'
import { useFilteredGrants } from '../../hooks/useFilteredGrants'

/**
 * Grants/Index — the main grants dashboard.
 *
 * Receives `webGrants` and `govGrants` as Inertia props from GrantController::index().
 * All filtering, sorting, and modal state is managed client-side.
 */
export default function GrantsIndex({ webGrants = [], govGrants = [] }) {
    const {
        filtered, filters, stats, sources,
        setSearch, setCashFilter, setAIFilter, setStatusFilter,
        setSourceFilter, setSortBy, setStarredOnly, resetFilters,
    } = useFilteredGrants([webGrants, govGrants])

    const [selected,       setSelected]       = useState(null)
    const [lastSelectedId, setLastSelectedId] = useState(null)
    const [viewMode,       setViewMode]       = useState('grid')

    // Local grants state so optimistic updates work without a page reload
    const [localWeb, setLocalWeb] = useState(webGrants)
    const [localGov, setLocalGov] = useState(govGrants)

    const { filtered: localFiltered, stats: localStats, sources: localSources } = useFilteredGrants([localWeb, localGov])

    function handleSelect(grant) {
        setLastSelectedId(grant._id)
        setSelected(grant)
    }

    const handleUpdate = useCallback((updated) => {
        if (updated._table === 'grants_gov') {
            setLocalGov(prev => prev.map(g => g.id === updated.id ? { ...g, ...updated } : g))
        } else {
            setLocalWeb(prev => prev.map(g => g.id === updated.id ? { ...g, ...updated } : g))
        }
        if (selected?.id === updated.id) {
            setSelected(prev => ({ ...prev, ...updated }))
        }
    }, [selected])

    // Reuse filter hooks with the local (possibly updated) state
    const {
        filtered: lf, filters: lFilters, stats: lStats, sources: lSources,
        setSearch: lSetSearch, setCashFilter: lSetCash, setAIFilter: lSetAI,
        setStatusFilter: lSetStatus, setSourceFilter: lSetSource,
        setSortBy: lSetSort, setStarredOnly: lSetStarred, resetFilters: lReset,
    } = useFilteredGrants([localWeb, localGov])

    return (
        <>
            <Head title="Grants Dashboard" />
            <AppLayout
                stats={lStats}
                search={lFilters.search}
                onSearch={lSetSearch}
            >
                <Controls
                    sources={lSources}
                    filters={lFilters}
                    onCashFilter={lSetCash}
                    onAIFilter={lSetAI}
                    onStatusFilter={lSetStatus}
                    onSourceFilter={lSetSource}
                    onSort={lSetSort}
                    onStarredFilter={lSetStarred}
                    onReset={lReset}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                />

                {lf.length === 0 ? (
                    <EmptyState
                        hasFilters={lFilters.search || lFilters.cashFilter !== 'all' || lFilters.sourceFilter !== 'all'}
                        onReset={lReset}
                    />
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {lf.map((grant, i) => (
                            <GrantCard
                                key={grant._id}
                                grant={grant}
                                index={i}
                                onSelect={() => handleSelect(grant)}
                                isLastSelected={grant._id === lastSelectedId}
                                onUpdate={handleUpdate}
                            />
                        ))}
                    </div>
                ) : (
                    <GrantsTable grants={lf} onSelect={handleSelect} lastSelectedId={lastSelectedId} />
                )}

                {selected && (
                    <GrantModal
                        grant={selected}
                        onClose={() => setSelected(null)}
                        onUpdate={handleUpdate}
                    />
                )}

            </AppLayout>
        </>
    )
}

/** Simple table view (lightweight, no pagination) */
function GrantsTable({ grants, onSelect, lastSelectedId }) {
    return (
        <div className="overflow-x-auto rounded-xl border border-[#b2d8d8]">
            <table className="w-full text-[12px] font-sans">
                <thead>
                    <tr className="bg-[#def2f1] text-[#5a9090] font-mono text-[10px] uppercase tracking-widest">
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
                            className={`border-t border-[#b2d8d8] cursor-pointer hover:bg-[#f4fafa] transition-colors
                                ${grant._id === lastSelectedId ? 'bg-[#f4fafa]' : ''}`}>
                            <td className="px-4 py-3 max-w-[340px] truncate text-[#0d2b2b] font-medium">{grant.title}</td>
                            <td className="px-4 py-3 font-mono text-[#3aafa9] whitespace-nowrap">{grant.amount || '—'}</td>
                            <td className="px-4 py-3 text-[#5a9090] whitespace-nowrap">{grant.deadline || '—'}</td>
                            <td className="px-4 py-3 text-[#5a9090]">
                                {grant.source === 'duckduckgo' ? 'web' : grant.source || '—'}
                            </td>
                            <td className="px-4 py-3 font-mono text-[#3aafa9]">
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
            <div className="w-12 h-12 rounded-2xl bg-[#def2f1] border border-[#b2d8d8] flex items-center justify-center">
                <Inbox size={22} className="text-[#5a9090]" />
            </div>
            <div className="text-center">
                <p className="text-[#0d2b2b] font-medium mb-1">No grants found</p>
                <p className="font-mono text-[12px] text-[#5a9090]">
                    {hasFilters ? 'Try adjusting your filters.' : 'No data available.'}
                </p>
            </div>
            {hasFilters && (
                <button onClick={onReset}
                    className="flex items-center gap-2 bg-[#def2f1] border border-[#8ec8c7] text-[#2b6e6b] rounded-lg px-4 py-2 text-[13px] hover:text-[#0d2b2b] transition-all">
                    Clear filters
                </button>
            )}
        </div>
    )
}

/**
 * Inline Config Page — rendered inside a modal overlay on the grants dashboard.
 * For a full config page experience, navigate to /config instead.
 */
function ConfigPageInline({ onClose }) {
    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="font-serif font-bold text-[20px] text-[#0d2b2b]">Configuration</h2>
                <button onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#def2f1] border border-[#b2d8d8] text-[#5a9090] hover:text-[#0d2b2b]">
                    ✕
                </button>
            </div>
            <p className="text-[13px] text-[#5a9090] mb-4">
                For the full config interface,{' '}
                <a href="/config" className="text-[#3aafa9] underline">open the Config page</a>.
            </p>
        </div>
    )
}
