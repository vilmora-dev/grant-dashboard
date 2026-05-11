import { useState, useCallback } from 'react'
import { Head, router } from '@inertiajs/react'
import { Plus, Trash2, RefreshCw, ToggleLeft, ToggleRight, X, AlertCircle } from 'lucide-react'
import AppLayout from '../../Layouts/AppLayout'

/**
 * Config/Index — scraper configuration page.
 *
 * Receives `initiatives`, `keywords`, and `orgProfile` as Inertia props
 * from ConfigController::index(). All mutations go through axios PATCH/POST/DELETE
 * calls that return JSON, then refresh Inertia page data.
 */

// =================================================================
// Shared primitives
// =================================================================

function Btn({ onClick, danger, small, children, disabled, type = 'button' }) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-sans transition-all disabled:opacity-40 ${
                danger
                    ? 'border-[#d93050]/30 text-[#d93050] hover:bg-[#d93050]/10'
                    : small
                    ? 'border-[#b2d8d8] text-[#2b6e6b] hover:text-[#0d2b2b] hover:border-[#8ec8c7]'
                    : 'border-[#3aafa9]/30 text-[#3aafa9] hover:bg-[#3aafa9]/10'
            }`}
        >
            {children}
        </button>
    )
}

function Input({ value, onChange, placeholder, type = 'text', className = '' }) {
    return (
        <input
            type={type}
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={`bg-[#def2f1] border border-[#b2d8d8] rounded-md px-2.5 py-1.5 text-[12px] font-sans text-[#0d2b2b] placeholder-[#5a9090] outline-none focus:border-[#3aafa9] focus:shadow-[0_0_0_2px_rgba(58,175,169,0.12)] transition-all ${className}`}
        />
    )
}

function Select({ value, onChange, children, className = '' }) {
    return (
        <select
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            className={`bg-[#def2f1] border border-[#b2d8d8] rounded-md px-2.5 py-1.5 text-[12px] font-sans text-[#0d2b2b] outline-none focus:border-[#3aafa9] transition-colors appearance-none cursor-pointer ${className}`}
        >
            {children}
        </select>
    )
}

function ErrorBanner({ message }) {
    if (!message) return null
    return (
        <div className="flex items-center gap-2 bg-[#d93050]/10 border border-[#d93050]/20 rounded-lg px-3 py-2 text-[#d93050] text-[12px] font-sans mb-4">
            <AlertCircle size={14} className="shrink-0" />
            {message}
        </div>
    )
}

// =================================================================
// Array editor — add/remove string tags (ddg_searching, ddg_sites)
// =================================================================

function ArrayEditor({ items, onChange, placeholder }) {
    const [draft, setDraft] = useState('')
    const add = () => {
        const v = draft.trim()
        if (!v || items.includes(v)) return
        onChange([...items, v])
        setDraft('')
    }
    const remove = (i) => onChange(items.filter((_, idx) => idx !== i))
    const onKey = (e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }
    return (
        <div>
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-[28px]">
                {items.map((item, i) => (
                    <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#3aafa9]/10 border border-[#3aafa9]/20 text-[11px] font-mono text-[#2b6e6b]">
                        {item}
                        <button onClick={() => remove(i)} className="text-[#5a9090] hover:text-[#d93050] transition-colors ml-0.5">
                            <X size={10} />
                        </button>
                    </span>
                ))}
                {items.length === 0 && (
                    <span className="text-[10px] font-mono text-[#8ec8c7] italic">none — using defaults</span>
                )}
            </div>
            <div className="flex gap-2">
                <Input value={draft} onChange={setDraft} placeholder={placeholder} onKeyDown={onKey} className="flex-1" />
                <Btn small onClick={add}><Plus size={12} /> Add</Btn>
            </div>
        </div>
    )
}

// =================================================================
// Delete Confirmation Modal
// =================================================================

function DeleteConfirmModal({ initiative, onConfirm, onCancel }) {
    const [typed, setTyped] = useState('')
    const match = typed.trim() === initiative.slug

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0d2b2b]/40 backdrop-blur-sm">
            <div className="w-full max-w-md mx-4 bg-white border border-[#d93050]/30 rounded-2xl shadow-[0_24px_64px_rgba(217,48,80,0.15)] p-6">
                <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#d93050]/10 flex items-center justify-center shrink-0 mt-0.5">
                        <AlertCircle size={16} className="text-[#d93050]" />
                    </div>
                    <div>
                        <h3 className="font-serif font-bold text-[14px] text-[#0d2b2b] mb-1">
                            Delete "{initiative.display_name}"?
                        </h3>
                        <p className="text-[12px] text-[#5a9090] font-sans leading-relaxed">
                            This will permanently delete the initiative and{' '}
                            <strong className="text-[#d93050]">all keywords assigned exclusively to it</strong>.
                            Keywords shared across multiple initiatives will only lose this initiative link.
                        </p>
                    </div>
                </div>
                <div className="mb-4 p-3 bg-[#def2f1] border border-[#b2d8d8] rounded-lg">
                    <p className="text-[11px] font-mono text-[#5a9090] mb-1.5">
                        Type the slug to confirm: <strong className="text-[#0d2b2b]">{initiative.slug}</strong>
                    </p>
                    <Input value={typed} onChange={setTyped} placeholder={initiative.slug} className="w-full font-mono" />
                </div>
                <div className="flex gap-2 justify-end">
                    <Btn small onClick={onCancel}>Cancel</Btn>
                    <button
                        onClick={() => match && onConfirm()}
                        disabled={!match}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg border text-[12px] font-sans transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-[#d93050] border-[#d93050] text-white hover:bg-[#b82040] enabled:cursor-pointer"
                    >
                        <Trash2 size={13} /> Delete initiative
                    </button>
                </div>
            </div>
        </div>
    )
}

// =================================================================
// Initiative Card
// =================================================================

function InitiativeCard({ initiative, keywords, onToggleActive, onDelete }) {
    const kwList = keywords.filter(k => k.initiative_id === initiative.id && k.is_active)
    const preview = kwList.slice(0, 3)
    const extra   = kwList.length - preview.length

    return (
        <div className={`border rounded-xl p-4 transition-all ${
            initiative.is_active ? 'border-[#b2d8d8] bg-white' : 'border-[#e0eaea] bg-[#f4fafa] opacity-60'
        }`}>
            <div className="flex items-start justify-between gap-2 mb-1">
                <div className="min-w-0">
                    <h3 className="font-serif font-bold text-[14px] text-[#0d2b2b] leading-tight">{initiative.display_name}</h3>
                    <span className="font-mono text-[10px] text-[#5a9090]">{initiative.slug}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => onToggleActive(initiative)} className="text-[#2b6e6b] hover:text-[#3aafa9] transition-colors" title={initiative.is_active ? 'Deactivate' : 'Activate'}>
                        {initiative.is_active ? <ToggleRight size={20} className="text-[#3aafa9]" /> : <ToggleLeft size={20} />}
                    </button>
                    <button onClick={() => onDelete(initiative)} className="text-[#5a9090] hover:text-[#d93050] transition-colors p-1" title="Delete initiative">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>
            {initiative.description && (
                <p className="text-[11px] text-[#2b6e6b] font-sans leading-relaxed mb-3 line-clamp-2">{initiative.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {preview.map(k => (
                    <span key={k.id} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#3aafa9]/8 border border-[#3aafa9]/20 text-[#2b6e6b]">{k.keyword}</span>
                ))}
                {extra > 0 && <span className="text-[10px] font-mono text-[#5a9090]">+{extra} more</span>}
                {kwList.length === 0 && <span className="text-[10px] font-mono text-[#8ec8c7] italic">no active keywords</span>}
                <span className="ml-auto text-[10px] font-mono text-[#5a9090]">{kwList.length} keyword{kwList.length !== 1 ? 's' : ''}</span>
            </div>
        </div>
    )
}

// =================================================================
// Helpers for CSRF + axios calls
// =================================================================

function csrf() {
    return document.querySelector('meta[name="csrf-token"]')?.content ?? ''
}

async function apiCall(method, url, data = null) {
    const opts = {
        method: method.toUpperCase(),
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': csrf(),
            'X-Requested-With': 'XMLHttpRequest',
        },
    }
    if (data !== null) opts.body = JSON.stringify(data)
    const res = await fetch(url, opts)
    // 204 No Content (typical for DELETE) has no body — skip JSON parsing
    if (res.status === 204 || res.headers.get('content-length') === '0') {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return null
    }
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || json.error || `HTTP ${res.status}`)
    return json
}

// =================================================================
// TAB: Initiatives (cards + keyword table)
// =================================================================

function InitiativesTab({ initiatives, keywords, onRefresh }) {
    const emptyIni = { slug: '', display_name: '', description: '' }
    const [iniForm,      setIniForm]      = useState(emptyIni)
    const [iniErr,       setIniErr]       = useState(null)
    const [iniBusy,      setIniBusy]      = useState(false)
    const [showIniForm,  setShowIniForm]  = useState(false)
    const [deleteTarget, setDeleteTarget] = useState(null)

    // Local optimistic state mirrored from props
    const [localInitiatives, setLocalInitiatives] = useState(initiatives)
    const [localKeywords,    setLocalKeywords]    = useState(keywords)

    // Keep in sync if parent refreshes
    useState(() => { setLocalInitiatives(initiatives) }, [initiatives])
    useState(() => { setLocalKeywords(keywords) }, [keywords])

    const emptyKw = { keyword: '', initiative_id: '', priority: 5 }
    const [kwForm,   setKwForm]   = useState(emptyKw)
    const [kwErr,    setKwErr]    = useState(null)
    const [kwBusy,   setKwBusy]   = useState(false)
    const [kwFilter, setKwFilter] = useState('')

    // Initiative CRUD
    const handleCreateIni = async () => {
        if (!iniForm.slug.trim() || !iniForm.display_name.trim()) { setIniErr('Slug and display name are required.'); return }
        setIniBusy(true); setIniErr(null)
        try {
            const created = await apiCall('POST', '/api/initiatives', {
                slug:         iniForm.slug.trim().toLowerCase().replace(/\s+/g, '-'),
                display_name: iniForm.display_name.trim(),
                description:  iniForm.description.trim() || null,
                is_active:    true,
            })
            setLocalInitiatives(prev => [...prev, created])
            setIniForm(emptyIni)
            setShowIniForm(false)
        } catch (e) { setIniErr(e.message) }
        finally     { setIniBusy(false) }
    }

    const handleToggleActive = async (ini) => {
        const next = !ini.is_active
        setLocalInitiatives(prev => prev.map(i => i.id === ini.id ? { ...i, is_active: next } : i))
        try {
            await apiCall('PATCH', `/api/initiatives/${ini.id}`, { is_active: next })
        } catch (e) {
            setLocalInitiatives(prev => prev.map(i => i.id === ini.id ? { ...i, is_active: ini.is_active } : i))
            setIniErr(e.message)
        }
    }

    const handleDeleteConfirm = async () => {
        const target = deleteTarget
        setDeleteTarget(null)
        setLocalInitiatives(prev => prev.filter(i => i.id !== target.id))
        try {
            await apiCall('DELETE', `/api/initiatives/${target.id}`)
            setLocalKeywords(prev => prev.filter(k => k.initiative_id !== target.id))
        } catch (e) {
            setLocalInitiatives(prev => [...prev, target])
            setIniErr(e.message)
        }
    }

    // Keyword CRUD
    const handleCreateKw = async () => {
        if (!kwForm.keyword.trim() || !kwForm.initiative_id) { setKwErr('Keyword and Initiative are required.'); return }
        setKwBusy(true); setKwErr(null)
        try {
            const created = await apiCall('POST', '/api/keywords', {
                keyword:      kwForm.keyword.trim(),
                initiative_id: parseInt(kwForm.initiative_id),
                priority:     parseInt(kwForm.priority) || 5,
            })
            setLocalKeywords(prev => [...prev, created])
            setKwForm(emptyKw)
        } catch (e) { setKwErr(e.message) }
        finally     { setKwBusy(false) }
    }

    const toggleKwActive = async (kw) => {
        const next = !kw.is_active
        setLocalKeywords(prev => prev.map(k => k.id === kw.id ? { ...k, is_active: next } : k))
        try {
            await apiCall('PATCH', `/api/keywords/${kw.id}`, { is_active: next })
        } catch (e) {
            setLocalKeywords(prev => prev.map(k => k.id === kw.id ? { ...k, is_active: kw.is_active } : k))
            setKwErr(e.message)
        }
    }

    const handleDeleteKw = async (id) => {
        if (!confirm('Delete this keyword?')) return
        const removed = localKeywords.find(k => k.id === id)
        setLocalKeywords(prev => prev.filter(k => k.id !== id))
        try {
            await apiCall('DELETE', `/api/keywords/${id}`)
        } catch (e) {
            if (removed) setLocalKeywords(prev => [...prev, removed])
            setKwErr(e.message)
        }
    }

    const iniById = Object.fromEntries(localInitiatives.map(i => [i.id, i]))

    // When a filter is active, show individual rows for that initiative only (no grouping needed).
    // When showing all, group by keyword text so shared keywords appear once with all their initiative badges.
    const filteredKw = kwFilter ? localKeywords.filter(k => k.initiative_id === parseInt(kwFilter)) : localKeywords

    // Build grouped rows for the "all" view: one entry per unique keyword string,
    // carrying all the individual DB rows that share that string.
    const groupedRows = (() => {
        if (kwFilter) {
            // Filtered view: one row per DB record (unambiguous)
            return filteredKw.map(kw => ({ keyword: kw.keyword, rows: [kw] }))
        }
        const map = new Map()
        for (const kw of localKeywords) {
            if (!map.has(kw.keyword)) map.set(kw.keyword, [])
            map.get(kw.keyword).push(kw)
        }
        return Array.from(map.entries()).map(([keyword, rows]) => ({ keyword, rows }))
    })()

    return (
        <div>
            {deleteTarget && (
                <DeleteConfirmModal
                    initiative={deleteTarget}
                    onConfirm={handleDeleteConfirm}
                    onCancel={() => setDeleteTarget(null)}
                />
            )}

            {/* Initiative cards */}
            <div className="flex items-center justify-between mb-3">
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#5a9090]">Initiatives — {localInitiatives.length}</p>
                <Btn small onClick={() => setShowIniForm(v => !v)}><Plus size={12} /> New initiative</Btn>
            </div>

            {showIniForm && (
                <div className="mb-4 p-3 bg-[#def2f1] border border-[#b2d8d8] rounded-xl">
                    <ErrorBanner message={iniErr} />
                    <div className="flex flex-wrap gap-2">
                        <Input value={iniForm.slug} onChange={v => setIniForm(f => ({ ...f, slug: v }))} placeholder="slug (e.g. ai-climate-tools)" className="w-44 font-mono" />
                        <Input value={iniForm.display_name} onChange={v => setIniForm(f => ({ ...f, display_name: v }))} placeholder="Display name" className="flex-1 min-w-[180px]" />
                        <Input value={iniForm.description} onChange={v => setIniForm(f => ({ ...f, description: v }))} placeholder="Short description (optional)" className="w-full" />
                        <div className="flex gap-2 w-full justify-end">
                            <Btn small onClick={() => { setShowIniForm(false); setIniForm(emptyIni); setIniErr(null) }}>Cancel</Btn>
                            <Btn onClick={handleCreateIni} disabled={iniBusy}><Plus size={13} /> Add initiative</Btn>
                        </div>
                    </div>
                </div>
            )}
            {!showIniForm && iniErr && <ErrorBanner message={iniErr} />}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                {localInitiatives.map(ini => (
                    <InitiativeCard
                        key={ini.id}
                        initiative={ini}
                        keywords={localKeywords}
                        onToggleActive={handleToggleActive}
                        onDelete={setDeleteTarget}
                    />
                ))}
                {localInitiatives.length === 0 && (
                    <div className="col-span-2 text-center py-8 text-[12px] text-[#5a9090] font-sans">No initiatives yet — add one above.</div>
                )}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
                <div className="flex-1 border-t border-[#b2d8d8]" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#5a9090]">Keywords</span>
                <div className="flex-1 border-t border-[#b2d8d8]" />
            </div>

            <ErrorBanner message={kwErr} />

            {/* Add keyword form */}
            <div className="flex flex-wrap gap-2 mb-4 p-3 bg-[#def2f1] border border-[#b2d8d8] rounded-xl">
                <Input value={kwForm.keyword} onChange={v => setKwForm(f => ({ ...f, keyword: v }))} placeholder="keyword" className="flex-1 min-w-[140px]" />
                <Select value={kwForm.initiative_id} onChange={v => setKwForm(f => ({ ...f, initiative_id: v }))} className="flex-1 min-w-[160px]">
                    <option value="">Select initiative…</option>
                    {localInitiatives.map(i => <option key={i.id} value={i.id}>{i.display_name}</option>)}
                </Select>
                <Input value={kwForm.priority} onChange={v => setKwForm(f => ({ ...f, priority: v }))} placeholder="priority" type="number" className="w-20" />
                <Btn onClick={handleCreateKw} disabled={kwBusy}><Plus size={13} /> Add</Btn>
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#5a9090]">Filter:</span>
                <button
                    onClick={() => setKwFilter('')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors ${kwFilter === '' ? 'bg-[#3aafa9]/10 border-[#3aafa9]/30 text-[#3aafa9]' : 'border-[#b2d8d8] text-[#5a9090] hover:text-[#2b6e6b]'}`}
                >
                    All ({localKeywords.length})
                </button>
                {localInitiatives.map(ini => (
                    <button
                        key={ini.id}
                        onClick={() => setKwFilter(String(ini.id))}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors ${kwFilter === String(ini.id) ? 'bg-[#3aafa9]/10 border-[#3aafa9]/30 text-[#3aafa9]' : 'border-[#b2d8d8] text-[#5a9090] hover:text-[#2b6e6b]'}`}
                    >
                        {ini.slug} ({localKeywords.filter(k => k.initiative_id === ini.id).length})
                    </button>
                ))}
            </div>

            {/* Keyword table */}
            <div className="overflow-x-auto rounded-xl border border-[#b2d8d8]">
                <table className="w-full text-[12px] font-sans">
                    <thead>
                        <tr className="bg-[#def2f1] text-[#5a9090] font-mono text-[10px] uppercase tracking-widest">
                            <th className="px-4 py-3 text-left">Keyword</th>
                            <th className="px-4 py-3 text-left">Initiative(s)</th>
                            <th className="px-4 py-3 text-left w-10">Pri</th>
                            <th className="px-4 py-3 text-left w-14">Score</th>
                            <th className="px-4 py-3 text-left">Active</th>
                            <th className="px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody>
                        {groupedRows.map(({ keyword, rows }) => {
                            // In filtered view: rows has exactly 1 entry — behave like before.
                            // In all-view: rows may have multiple entries (one per initiative assignment).
                            const isGrouped = rows.length > 1
                            // For priority + score, show the first row's values (they're typically the same)
                            const first = rows[0]

                            return (
                                <tr key={keyword} className="border-t border-[#b2d8d8] hover:bg-[#def2f1]/50 transition-colors">

                                    {/* Keyword */}
                                    <td className="px-4 py-2.5 text-[#0d2b2b] font-mono text-[11px] align-top">
                                        {keyword}
                                    </td>

                                    {/* Initiative badges — one per row, each with its own × delete */}
                                    <td className="px-4 py-2.5 align-top">
                                        <div className="flex flex-wrap gap-1">
                                            {rows.map(kw => {
                                                const ini = iniById[kw.initiative_id]
                                                return ini ? (
                                                    <span key={kw.id}
                                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#3aafa9]/8 border border-[#3aafa9]/20 text-[#2b6e6b]"
                                                        style={{ backgroundColor: 'rgba(58,175,169,0.08)' }}>
                                                        {ini.slug}
                                                        <button
                                                            onClick={() => handleDeleteKw(kw.id)}
                                                            title={`Remove from ${ini.slug}`}
                                                            className="text-[#5a9090] hover:text-[#d93050] transition-colors ml-0.5 leading-none">
                                                            <X size={9} strokeWidth={2.5} />
                                                        </button>
                                                    </span>
                                                ) : (
                                                    <span key={kw.id} className="text-[#8ec8c7] text-[10px]">—</span>
                                                )
                                            })}
                                        </div>
                                    </td>

                                    {/* Priority — show first row's value */}
                                    <td className="px-4 py-2.5 text-[#2b6e6b] align-top">{first.priority}</td>

                                    {/* Score — show first row's value */}
                                    <td className="px-4 py-2.5 align-top">
                                        {first.success_score != null
                                            ? <span className="font-mono text-[11px] text-[#3aafa9]">{Number(first.success_score).toFixed(1)}</span>
                                            : <span className="text-[#8ec8c7] text-[10px]">—</span>}
                                    </td>

                                    {/* Active toggle — when grouped, toggles all rows together */}
                                    <td className="px-4 py-2.5 align-top">
                                        {isGrouped ? (
                                            // Show a combined toggle: all active = on, any inactive = off
                                            <button
                                                onClick={() => rows.forEach(kw => toggleKwActive(kw))}
                                                className="text-[#2b6e6b] hover:text-[#3aafa9] transition-colors"
                                                title="Toggle all assignments">
                                                {rows.every(kw => kw.is_active)
                                                    ? <ToggleRight size={18} className="text-[#3aafa9]" />
                                                    : <ToggleLeft size={18} />}
                                            </button>
                                        ) : (
                                            <button onClick={() => toggleKwActive(first)} className="text-[#2b6e6b] hover:text-[#3aafa9] transition-colors">
                                                {first.is_active ? <ToggleRight size={18} className="text-[#3aafa9]" /> : <ToggleLeft size={18} />}
                                            </button>
                                        )}
                                    </td>

                                    {/* Delete — when grouped, deletes ALL assignments for this keyword */}
                                    <td className="px-4 py-2.5 align-top">
                                        {isGrouped ? (
                                            <button
                                                onClick={() => {
                                                    if (confirm(`Delete "${keyword}" from all ${rows.length} initiatives?`))
                                                        rows.forEach(kw => handleDeleteKw(kw.id))
                                                }}
                                                className="text-[#5a9090] hover:text-[#d93050] transition-colors p-1"
                                                title="Delete from all initiatives">
                                                <Trash2 size={13} />
                                            </button>
                                        ) : (
                                            <button onClick={() => handleDeleteKw(first.id)} className="text-[#5a9090] hover:text-[#d93050] transition-colors p-1">
                                                <Trash2 size={13} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        {groupedRows.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-4 py-6 text-center text-[11px] text-[#5a9090] font-sans">No keywords found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// =================================================================
// TAB: Organization Profile
// =================================================================

const BUDGET_OPTIONS = ['', '<100k', '100k-500k', '500k-1M', '1M-5M', '>5M']
const IRS_OPTIONS    = ['', '501(c)(3)', '501(c)(4)', '501(c)(6)', '509(a)(1)', 'Fiscal Sponsorship', 'For-profit', 'Government', 'Other']

function OrgField({ label, hint, children }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] uppercase tracking-wider text-[#5a9090]">
                {label}{hint && <span className="normal-case tracking-normal text-[9px] text-[#8ec8c7]"> — {hint}</span>}
            </label>
            {children}
        </div>
    )
}

function parseArr(v) {
    if (Array.isArray(v)) return v
    if (!v) return []
    return v.toString().replace(/^\{|\}$/g, '').split(',').map(x => x.trim().replace(/^"|"$/g, '')).filter(Boolean)
}
function arrToStr(arr) { return arr.join(', ') }
function strToArr(s)   { return s.split(',').map(x => x.trim()).filter(Boolean) }

function OrgProfileTab({ orgProfile }) {
    const profileToForm = (p) => ({
        name:            p?.name            || '',
        website:         p?.website         || '',
        founded_year:    p?.founded_year    ?? '',
        irs_status:      p?.irs_status      || '',
        org_type:        p?.org_type        || '',
        mission:         p?.mission         || '',
        budget_range:    p?.budget_range    || '',
        staff_count:     p?.staff_count     ?? '',
        volunteer_count: p?.volunteer_count ?? '',
        target_states:   arrToStr(parseArr(p?.target_states)),
        target_counties: arrToStr(parseArr(p?.target_counties)),
        target_cities:   arrToStr(parseArr(p?.target_cities)),
        notes:           p?.notes           || '',
        ddg_searching:   parseArr(p?.ddg_searching),
        ddg_sites:       parseArr(p?.ddg_sites),
    })

    const [form,  setForm]  = useState(() => profileToForm(orgProfile))
    const [err,   setErr]   = useState(null)
    const [saved, setSaved] = useState(false)
    const [busy,  setBusy]  = useState(false)

    const set = (key) => (val) => setForm(f => ({ ...f, [key]: val }))

    const handleSave = async () => {
        if (!form.name.trim()) { setErr('Organization name is required.'); return }
        setBusy(true); setErr(null); setSaved(false)
        try {
            await apiCall('PUT', '/api/organization', {
                name:            form.name.trim(),
                website:         form.website.trim()    || null,
                founded_year:    form.founded_year !== '' ? parseInt(form.founded_year) : null,
                irs_status:      form.irs_status        || null,
                org_type:        form.org_type.trim()   || null,
                mission:         form.mission.trim()    || null,
                budget_range:    form.budget_range      || null,
                staff_count:     form.staff_count    !== '' ? parseInt(form.staff_count)    : null,
                volunteer_count: form.volunteer_count !== '' ? parseInt(form.volunteer_count) : null,
                target_states:   strToArr(form.target_states),
                target_counties: strToArr(form.target_counties),
                target_cities:   strToArr(form.target_cities),
                notes:           form.notes.trim() || null,
                ddg_searching:   form.ddg_searching.length > 0 ? form.ddg_searching : null,
                ddg_sites:       form.ddg_sites,
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (e) { setErr(e.message) }
        finally     { setBusy(false) }
    }

    return (
        <div className="max-w-5xl">
            <p className="text-[12px] text-[#5a9090] font-sans mb-5">
                This profile drives <strong className="text-[#0d2b2b]">area relevance</strong> checks and the <strong className="text-[#0d2b2b]">relevance score</strong> on every scrape run.
            </p>

            <ErrorBanner message={err} />
            {saved && (
                <div className="flex items-center gap-2 bg-[#c2edce]/60 border border-[#3aaf6b]/30 text-[#3aaf6b] rounded-lg px-3 py-2 text-[12px] font-sans mb-4">
                    ✅ Profile saved — takes effect on next scrape run
                </div>
            )}

            {/* Identity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <OrgField label="Organization name" hint="required">
                    <Input value={form.name} onChange={set('name')} placeholder="Delta Rising Foundation" />
                </OrgField>
                <OrgField label="Website">
                    <Input value={form.website} onChange={set('website')} placeholder="https://example.org" />
                </OrgField>
                <OrgField label="IRS / Legal status">
                    <Select value={form.irs_status} onChange={set('irs_status')}>
                        {IRS_OPTIONS.map(o => <option key={o} value={o}>{o || '— select —'}</option>)}
                    </Select>
                </OrgField>
                <OrgField label="Organization type">
                    <Input value={form.org_type} onChange={set('org_type')} placeholder="Environmental nonprofit" />
                </OrgField>
                <OrgField label="Founded year">
                    <Input value={form.founded_year} onChange={set('founded_year')} placeholder="2010" type="number" />
                </OrgField>
                <OrgField label="Annual budget range">
                    <Select value={form.budget_range} onChange={set('budget_range')}>
                        {BUDGET_OPTIONS.map(o => <option key={o} value={o}>{o || '— select —'}</option>)}
                    </Select>
                </OrgField>
                <OrgField label="Staff count">
                    <Input value={form.staff_count} onChange={set('staff_count')} placeholder="12" type="number" />
                </OrgField>
                <OrgField label="Volunteer count">
                    <Input value={form.volunteer_count} onChange={set('volunteer_count')} placeholder="200" type="number" />
                </OrgField>
            </div>

            {/* Mission */}
            <div className="flex flex-col gap-4 mb-4">
                <OrgField label="Mission statement" hint="shown to AI for context">
                    <textarea
                        value={form.mission}
                        onChange={e => set('mission')(e.target.value)}
                        rows={3}
                        placeholder="Describe what your organization does and who it serves…"
                        className="bg-[#def2f1] border border-[#b2d8d8] rounded-md px-2.5 py-1.5 text-[12px] font-sans text-[#0d2b2b] placeholder-[#5a9090] outline-none focus:border-[#3aafa9] focus:shadow-[0_0_0_2px_rgba(58,175,169,0.12)] transition-all resize-y"
                    />
                </OrgField>
            </div>

            {/* Geography */}
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#5a9090] mb-2 mt-2">
                Grant geography — AI uses these to evaluate area relevance
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 p-3 bg-[#def2f1] border border-[#b2d8d8] rounded-xl">
                <OrgField label="Target states" hint="comma-separated">
                    <Input value={form.target_states} onChange={set('target_states')} placeholder="California, Nevada" />
                </OrgField>
                <OrgField label="Target counties" hint="comma-separated">
                    <Input value={form.target_counties} onChange={set('target_counties')} placeholder="Orange County, Los Angeles" />
                </OrgField>
                <OrgField label="Target cities" hint="optional">
                    <Input value={form.target_cities} onChange={set('target_cities')} placeholder="Irvine, Santa Ana" />
                </OrgField>
            </div>

            {/* Notes */}
            <div className="mb-4">
                <OrgField label="Additional notes" hint="passed verbatim to AI prompt">
                    <textarea
                        value={form.notes}
                        onChange={e => set('notes')(e.target.value)}
                        rows={2}
                        placeholder="Any extra context the AI should know about this org…"
                        className="w-full bg-[#def2f1] border border-[#b2d8d8] rounded-md px-2.5 py-1.5 text-[12px] font-sans text-[#0d2b2b] placeholder-[#5a9090] outline-none focus:border-[#3aafa9] focus:shadow-[0_0_0_2px_rgba(58,175,169,0.12)] transition-all resize-y"
                    />
                </OrgField>
            </div>

            {/* DDG Search Config */}
            <p className="font-mono text-[10px] uppercase tracking-wider text-[#5a9090] mb-2 mt-4">
                DuckDuckGo search configuration
            </p>
            <div className="flex flex-col gap-4 mb-6 p-3 bg-[#def2f1] border border-[#b2d8d8] rounded-xl">
                <OrgField label="Search terms" hint="appended to every keyword query, e.g. 'grant program'">
                    <ArrayEditor items={form.ddg_searching} onChange={set('ddg_searching')} placeholder="grant program" />
                </OrgField>
                <OrgField label="Site targets" hint="domains for site:-targeted searches">
                    <ArrayEditor items={form.ddg_sites} onChange={set('ddg_sites')} placeholder="calrecycle.ca.gov" />
                </OrgField>
                <p className="text-[10px] font-mono text-[#5a9090] -mt-1">
                    Search areas are derived automatically from your target counties + states above.
                </p>
            </div>

            <Btn onClick={handleSave} disabled={busy}>
                {busy ? 'Saving…' : '💾 Save profile'}
            </Btn>
        </div>
    )
}

// =================================================================
// ROOT Config/Index Inertia page
// =================================================================

const TABS = [
    { id: 'initiatives', label: 'Initiatives' },
    { id: 'org',         label: 'Organization' },
]

export default function ConfigIndex({ initiatives = [], keywords = [], orgProfile = null }) {
    const [tab,     setTab]     = useState('initiatives')
    const [loading, setLoading] = useState(false)

    function handleRefresh() {
        setLoading(true)
        router.reload({ only: ['initiatives', 'keywords', 'orgProfile'], onFinish: () => setLoading(false) })
    }

    return (
        <>
            <Head title="Configuration" />
            <AppLayout>
                <div className="max-w-5xl mx-auto">

                    {/* Page header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="font-serif font-bold text-[22px] text-[#0d2b2b]">Scraper Configuration</h1>
                            <p className="font-mono text-[11px] text-[#5a9090] mt-0.5">Changes take effect on next scraper run</p>
                        </div>
                        <Btn small onClick={handleRefresh} disabled={loading}>
                            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
                        </Btn>
                    </div>

                    {/* Card */}
                    <div className="bg-white border border-[#8ec8c7] rounded-2xl shadow-[0_4px_24px_rgba(58,175,169,0.08)]">

                        {/* Tabs */}
                        <div className="flex gap-1 px-6 pt-4 border-b border-[#b2d8d8]">
                            {TABS.map(t => (
                                <button
                                    key={t.id}
                                    onClick={() => setTab(t.id)}
                                    className={`px-4 py-2 text-[12px] font-sans rounded-t-lg transition-colors border-b-2 -mb-px ${
                                        tab === t.id ? 'border-[#3aafa9] text-[#3aafa9]' : 'border-transparent text-[#5a9090] hover:text-[#2b6e6b]'
                                    }`}
                                >
                                    {t.label}
                                    {t.id === 'initiatives' && (
                                        <span className="ml-1.5 font-mono text-[10px]">{initiatives.length}</span>
                                    )}
                                    {t.id === 'org' && orgProfile?.name && (
                                        <span className="ml-1.5 font-mono text-[10px] text-[#3aafa9]">✓</span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 min-h-[400px]">
                            {tab === 'initiatives' && (
                                <InitiativesTab
                                    initiatives={initiatives}
                                    keywords={keywords}
                                    onRefresh={handleRefresh}
                                />
                            )}
                            {tab === 'org' && (
                                <OrgProfileTab orgProfile={orgProfile} />
                            )}
                        </div>
                    </div>
                </div>
            </AppLayout>
        </>
    )
}
