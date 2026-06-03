import { useState, useCallback, useRef, useEffect } from 'react'
import {
    X, ExternalLink, Globe, DollarSign, Calendar, Users,
    Sparkles, AlertCircle, Pencil, Zap, History,
    CheckCheck, EyeOff, Star, Save, RotateCcw, Trash2, ChevronDown, StarOff, RefreshCw,
} from 'lucide-react'
import { usePage } from '@inertiajs/react'
import { formatAmountFull, formatDeadline, urgencyClass } from '../utils/formatters'
import { patchGrant, fetchGrantLogs } from '../utils/api'

// HTML helpers

function sanitise(html) {
    const ALLOWED = new Set(['p','br','strong','b','em','i','u','ul','ol','li','h1','h2','h3','h4','span','a','blockquote','pre','code'])
    try {
        const doc = new DOMParser().parseFromString(html, 'text/html')
        function clean(node) {
            if (node.nodeType === Node.TEXT_NODE) return node.cloneNode()
            if (node.nodeType !== Node.ELEMENT_NODE) return null
            const tag = node.tagName.toLowerCase()
            if (!ALLOWED.has(tag)) {
                const frag = document.createDocumentFragment()
                node.childNodes.forEach(c => { const n = clean(c); if (n) frag.appendChild(n) })
                return frag
            }
            const el = document.createElement(tag)
            if (tag === 'a') {
                const href = node.getAttribute('href') || ''
                if (/^https?:\/\//i.test(href)) { el.href = href; el.target = '_blank'; el.rel = 'noopener noreferrer' }
            }
            node.childNodes.forEach(c => { const n = clean(c); if (n) el.appendChild(n) })
            return el
        }
        const frag = document.createDocumentFragment()
        doc.body.childNodes.forEach(c => { const n = clean(c); if (n) frag.appendChild(n) })
        const div = document.createElement('div'); div.appendChild(frag); return div.innerHTML
    } catch { return html.replace(/<[^>]*>/g, '') }
}

const LOOKS_HTML = /<[a-z][\s\S]*>/i
function RichText({ text, className = '' }) {
    if (!text) return null
    if (LOOKS_HTML.test(text)) return <div className={`prose-grant ${className}`} dangerouslySetInnerHTML={{ __html: sanitise(text) }} />
    return <p className={className}>{text}</p>
}

// Urgency maps

const URGENCY_TEXT = { urgent: 'text-[#F5601D]', soon: 'text-[#FF7900]', ok: 'text-[#006825]', expired: 'text-[#8A898C]', neutral: 'text-[#8A898C]' }
const URGENCY_BAR  = { urgent: 'bg-[#F5601D]',   soon: 'bg-[#FF7900]',   ok: 'bg-[#006825]',   expired: 'bg-[#C2E8DB]',   neutral: 'bg-[#C2E8DB]'   }

// Action log helpers

// Human-readable label + icon + color for each action string
const ACTION_META = {
    starred:          { label: 'Starred',           color: '#d4a017', icon: '★' },
    unstarred:        { label: 'Unstarred',          color: '#8A898C', icon: '☆' },
    applied:          { label: 'Marked as Applied',  color: '#006825', icon: '✓' },
    unapplied:        { label: 'Unmarked Applied',   color: '#8A898C', icon: '✗' },
    discarded:        { label: 'Discarded',          color: '#F5601D', icon: '⊘' },
    restored:         { label: 'Restored',           color: '#006825', icon: '↺' },
    notes_updated:    { label: 'Notes updated',      color: '#072F98', icon: '✎' },
    amount_edited:    { label: 'Amount edited',      color: '#072F98', icon: '✎' },
    deadline_edited:  { label: 'Deadline edited',    color: '#072F98', icon: '✎' },
    field_updated:    { label: 'Field updated',      color: '#072F98', icon: '✎' },
    updated:          { label: 'Updated',            color: '#072F98', icon: '✎' },
    scraped:          { label: 'Scraped',            color: '#8A898C', icon: '⟳' },
    ai_analyzed:      { label: 'AI analyzed',        color: '#4a5296', icon: '✦' },
}

function formatRelativeTime(isoString) {
    const diff = Date.now() - new Date(isoString).getTime()
    const mins  = Math.floor(diff / 60_000)
    const hours = Math.floor(diff / 3_600_000)
    const days  = Math.floor(diff / 86_400_000)
    if (mins  <  1) return 'just now'
    if (mins  < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days  <  7) return `${days}d ago`
    return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatExactTime(isoString) {
    return new Date(isoString).toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
    })
}

// Render a readable diff line for edit actions (amount, deadline, notes, etc.)
function DiffLine({ oldVal, newVal }) {
    if (oldVal == null && newVal == null) return null
    const fmt = v => (v == null || v === '') ? <em className="text-[#C2E8DB]">empty</em> : <span className="font-mono">{String(v)}</span>
    return (
        <div className="mt-1 flex items-start gap-1.5 font-mono text-[10px] text-[#8A898C] leading-snug">
            <span className="shrink-0 text-[#F5601D]/70">−</span>{fmt(oldVal)}
            <span className="shrink-0 text-[#8A898C] mx-0.5">→</span>
            <span className="shrink-0 text-[#006825]/70">+</span>{fmt(newVal)}
        </div>
    )
}

// History panel 

function HistoryPanel({ grantId }) {
    const [logs,    setLogs]    = useState(null)   // null = not loaded yet
    const [loading, setLoading] = useState(false)
    const [error,   setError]   = useState(null)

    const load = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            const data = await fetchGrantLogs(grantId)
            setLogs(data)
        } catch (e) {
            setError(e.response?.data?.message ?? e.message ?? 'Failed to load history.')
        } finally {
            setLoading(false)
        }
    }, [grantId])

    // Auto-load on first render
    useEffect(() => { load() }, [load])

    if (loading && !logs) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#8A898C]">
                <RefreshCw size={16} className="animate-spin" />
                <span className="font-mono text-[11px]">Loading history…</span>
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex flex-col items-center gap-3 py-12">
                <div className="flex items-center gap-2 bg-[#F5601D]/10 border border-[#F5601D]/20 rounded-lg px-3 py-2 text-[#F5601D] text-[11px] font-mono">
                    <AlertCircle size={12} /> {error}
                </div>
                <button onClick={load} className="font-mono text-[11px] text-[#006825] hover:underline">
                    Try again
                </button>
            </div>
        )
    }

    if (!logs || logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-2 py-16">
                <History size={22} className="text-[#C2E8DB]" />
                <p className="font-mono text-[12px] text-[#8A898C]">No activity recorded yet.</p>
                <p className="font-mono text-[10px] text-[#C2E8DB]">Changes you make will appear here.</p>
            </div>
        )
    }

    return (
        <div className="flex flex-col">
            {/* Header with entry count + refresh */}
            <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] text-[#8A898C] uppercase tracking-widest">
                    {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
                </span>
                <button
                    onClick={load}
                    disabled={loading}
                    className="flex items-center gap-1 font-mono text-[10px] text-[#8A898C] hover:text-[#006825] transition-colors disabled:opacity-40"
                >
                    <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* Timeline */}
            <ol className="relative flex flex-col gap-0">
                {logs.map((log, i) => {
                    const meta      = ACTION_META[log.action] ?? { label: log.action, color: '#8A898C', icon: '·' }
                    const isLast    = i === logs.length - 1
                    // Only show diff for edit-type actions that have meaningful old/new values
                    const showDiff  = log.old_value && log.new_value
                        && !['starred','unstarred','applied','unapplied','discarded','restored','scraped','ai_analyzed'].includes(log.action)

                    return (
                        <li key={log.id} className="relative flex gap-3 pb-5">
                            {/* Vertical timeline line */}
                            {!isLast && (
                                <div className="absolute left-[11px] top-[22px] bottom-0 w-px bg-[#C2E8DB]" />
                            )}

                            {/* Dot */}
                            <div
                                className="mt-0.5 w-[22px] h-[22px] rounded-full border-2 bg-white flex items-center justify-center shrink-0 text-[10px] font-bold z-10"
                                style={{ borderColor: meta.color, color: meta.color }}
                            >
                                {meta.icon}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pt-0.5">
                                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                                    <span className="font-sans text-[12.5px] font-medium text-[#233B22] leading-snug">
                                        {meta.label}
                                    </span>
                                    <span
                                        className="font-mono text-[10px] text-[#8A898C] shrink-0 cursor-default"
                                        title={formatExactTime(log.created_at)}
                                    >
                                        {formatRelativeTime(log.created_at)}
                                    </span>
                                </div>

                                {/* Who */}
                                <p className="font-mono text-[10px] mt-0.5" style={{ color: meta.color }}>
                                    {log.is_me ? 'You' : log.user_name}
                                </p>

                                {/* Diff - for edit actions */}
                                {showDiff && Object.entries(log.new_value).map(([key, newVal]) => (
                                    <DiffLine
                                        key={key}
                                        oldVal={log.old_value?.[key]}
                                        newVal={newVal}
                                    />
                                ))}

                                {/* Discard reason */}
                                {log.action === 'discarded' && log.new_value?.discard_reason && (
                                    <p className="font-mono text-[10px] text-[#8A898C] mt-1 italic">
                                        "{log.new_value.discard_reason}"
                                    </p>
                                )}
                            </div>
                        </li>
                    )
                })}
            </ol>
        </div>
    )
}

// Main modal 

export default function GrantModal({ grant: initialGrant, onClose, onUpdate }) {
    const { auth } = usePage().props
    const isAdmin = auth?.user?.role === 'full'

    const [grant,    setGrant]    = useState(initialGrant)
    const [leftTab,  setLeftTab]  = useState('details')   // 'details' | 'history'
    const [rightTab, setRightTab] = useState('actions')
    const [patchErr, setPatchErr] = useState(null)
    const [patching, setPatching] = useState(false)
    const [editAmount,   setEditAmount]   = useState(initialGrant.amount   ?? '')
    const [editDeadline, setEditDeadline] = useState(initialGrant.deadline ?? '')
    const [editNotes,    setEditNotes]    = useState(initialGrant.notes    ?? '')
    const [editSaved,    setEditSaved]    = useState(false)
    const [discardOpen,   setDiscardOpen]   = useState(false)
    const [discardReason, setDiscardReason] = useState('')
    const [discardOther,  setDiscardOther]  = useState('')
    const [discarding,    setDiscarding]    = useState(false)
    const discardRef = useRef(null)

    useEffect(() => {
        if (!discardOpen) return
        const handler = e => { if (discardRef.current && !discardRef.current.contains(e.target)) setDiscardOpen(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [discardOpen])

    // Close on Escape
    useEffect(() => {
        const handler = e => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [onClose])

    const deadline  = formatDeadline(grant.deadline)
    const u         = urgencyClass(deadline?.diff)
    const amount    = formatAmountFull(grant.amount)
    const isApplied = !!grant.applied
    const isIgnored = !!grant.ignore
    const isStarred = !!grant.starred
    const score     = grant.relevance_score ?? 0

    const patch = useCallback(async (changes) => {
        setPatching(true); setPatchErr(null)
        try {
            const updated = await patchGrant(grant, changes)
            setGrant(g => ({ ...g, ...updated }))
            onUpdate?.({ ...grant, ...updated })
        } catch (e) {
            setPatchErr(e.message)
        } finally {
            setPatching(false)
        }
    }, [grant, onUpdate])

    // Panels

    const detailsPanel = (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-1.5 mt-1">
                {grant.source && <Tag color="neutral">{grant.source === 'duckduckgo' ? 'Web Search' : grant.source}</Tag>}
                {score > 0 && (
                    <span title={`Relevance score: ${score}/100`}
                        style={{
                            background:  score >= 70 ? 'rgba(0,104,37,0.10)' : score >= 40 ? 'rgba(212,160,23,0.10)' : 'rgba(194,232,219,0.40)',
                            borderColor: score >= 70 ? 'rgba(0,104,37,0.30)' : score >= 40 ? 'rgba(212,160,23,0.30)' : '#C2E8DB',
                            color:       score >= 70 ? '#006825'              : score >= 40 ? '#d4a017'               : '#006825',
                        }}
                        className="inline-flex items-center gap-1.5 font-mono text-[9px] font-medium uppercase tracking-wide px-2 py-0.5 rounded border">
                        <svg width="7" height="7" viewBox="0 0 7 7" fill="currentColor"><circle cx="3.5" cy="3.5" r="3.5"/></svg>
                        {score}% match
                    </span>
                )}
                {isApplied && <Tag color="green"><CheckCheck size={9} /> Applied</Tag>}
                {isIgnored && <Tag color="red"><EyeOff size={9} /> Ignored</Tag>}
                {isStarred && <Tag color="gold"><Star size={9} /> Starred</Tag>}
            </div>

            <h2 className="font-serif font-bold text-[22px] text-[#233B22] leading-tight tracking-tight">{grant.title}</h2>

            {grant.description && <RichText text={grant.description} className="text-[13.5px] text-[#5D5961] leading-relaxed" />}

            {grant.summary && (
                <div className="bg-[#D4D9FF]/30 border border-[#D4D9FF] rounded-xl p-4">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#4a5296] uppercase tracking-widest mb-2">
                        <Sparkles size={10} /> Summary
                    </div>
                    <RichText text={grant.summary} className="text-[13px] text-[#5D5961] leading-relaxed" />
                </div>
            )}

            <div className="bg-[#C8EFE2] border border-[#C2E8DB] rounded-xl p-4 flex flex-col gap-4">
                {amount && (
                    <MetaRow icon={<DollarSign size={13} />} label="Maximum Award">
                        <span className="font-mono text-[20px] font-medium text-[#006825]">{amount}</span>
                    </MetaRow>
                )}
                {deadline && (
                    <MetaRow icon={<Calendar size={13} />} label="Application Deadline">
                        <span className={`text-[14px] ${URGENCY_TEXT[u]}`}>{deadline.label}</span>
                        {deadline.diff != null && (
                            <span className="font-mono text-[11px] text-[#8A898C] ml-2">
                                {deadline.diff < 0 ? 'Deadline passed' : `${deadline.diff} days remaining`}
                            </span>
                        )}
                    </MetaRow>
                )}
                {grant.eligibility && (
                    <MetaRow icon={<Users size={13} />} label="Eligible Applicants">
                        <span className="text-[13px] text-[#233B22]">{grant.eligibility}</span>
                    </MetaRow>
                )}
            </div>

            {grant.notes && (
                <div className="bg-[#fffbe6] border border-[#d4a017]/30 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#d4a017] uppercase tracking-widest mb-1.5">
                        <Pencil size={10} /> Your Notes
                    </div>
                    <p className="text-[13px] text-[#233B22] leading-relaxed whitespace-pre-wrap">{grant.notes}</p>
                </div>
            )}

            <a href={grant.url} target="_blank" rel="noopener noreferrer"
                className="self-start flex items-center gap-2 bg-[#C8EFE2] border border-[#C2E8DB] rounded-lg px-4 py-2.5 text-[13px] font-medium text-[#233B22] hover:border-[#006825] hover:text-[#006825] transition-all">
                <Globe size={14} /> Visit Official Page <ExternalLink size={12} />
            </a>
        </div>
    )

    const actionsPanel = (
        <div className="flex flex-col gap-3">
            {patchErr && <div className="flex items-center gap-2 bg-[#d93050]/10 border border-[#d93050]/20 rounded-lg px-3 py-2 text-[#d93050] text-[11px] font-mono"><AlertCircle size={12} /> {patchErr}</div>}
            <ActionButton active={isStarred} disabled={patching} onClick={() => patch({ starred: !isStarred })}
                icon={<Star size={15} strokeWidth={isStarred ? 0 : 1.8} fill={isStarred ? 'currentColor' : 'none'} />}
                label={isStarred ? 'Starred' : 'Star this grant'} hint={isStarred ? 'Click to remove' : 'Bookmark for quick retrieval'}
                activeClass="border-[#d4a017] bg-[#fffbe6] text-[#d4a017]" />
            <ActionButton active={isApplied} disabled={patching} onClick={() => patch({ applied: !isApplied })}
                icon={<CheckCheck size={15} />}
                label={isApplied ? 'Applied ✓' : 'Mark as Applied'} hint={isApplied ? 'Click to unmark' : "You've submitted an application"}
                activeClass="border-[#006825]/50 bg-[#006825]/10 text-[#006825]" />

            <div ref={discardRef} className="flex flex-col gap-0">
                {isIgnored ? (
                    <button disabled={patching} onClick={() => patch({ ignore: false, discard_reason: null })}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-[#d93050]/40 bg-[#d93050]/08 text-[#d93050] hover:bg-[#d93050]/15 disabled:opacity-50 transition-all">
                        <EyeOff size={15} className="shrink-0" />
                        <div className="flex flex-col gap-0.5 text-left min-w-0">
                            <span className="text-[13px] font-medium leading-none">Discarded</span>
                            <span className="font-mono text-[10px] opacity-60 leading-snug truncate">{grant.discard_reason || 'Click to restore'}</span>
                        </div>
                        <CheckCheck size={12} className="ml-auto shrink-0 opacity-60" />
                    </button>
                ) : (
                    <button disabled={patching || discarding} onClick={() => { setDiscardOpen(o => !o); setDiscardReason(''); setDiscardOther('') }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all disabled:opacity-50
                            ${discardOpen ? 'border-[#d93050]/40 bg-[#d93050]/08 text-[#d93050]' : 'border-[#C2E8DB] bg-white text-[#006825] hover:border-[#d93050]/40 hover:text-[#d93050]'}`}>
                        <Trash2 size={15} className="shrink-0" />
                        <div className="flex flex-col gap-0.5 text-left">
                            <span className="text-[13px] font-medium leading-none">Discard</span>
                            <span className="font-mono text-[10px] opacity-60">Hide with a reason</span>
                        </div>
                        <ChevronDown size={12} className={`ml-auto shrink-0 transition-transform ${discardOpen ? 'rotate-180' : ''}`} />
                    </button>
                )}
                {discardOpen && !isIgnored && (
                    <div className="mt-1 rounded-xl border border-[#d93050]/25 bg-[#d93050]/04 p-3 flex flex-col gap-2.5">
                        <p className="font-mono text-[10px] text-[#d93050] uppercase tracking-widest">Reason</p>
                        {[
                            { value: 'not_a_grant',       label: 'Not a grant opportunity' },
                            { value: 'deadline_passed',   label: 'Deadline already passed' },
                            { value: 'not_cash',          label: 'Not a cash grant' },
                            { value: 'outside_geography', label: 'Outside our geography' },
                            { value: 'paywall',           label: 'Requires account / paywall' },
                            { value: 'other',             label: 'Other…' },
                        ].map(opt => (
                            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                                <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-all ${discardReason === opt.value ? 'border-[#d93050] bg-[#d93050]' : 'border-[#C2E8DB] group-hover:border-[#d93050]/50'}`}
                                    onClick={() => setDiscardReason(opt.value)} />
                                <span className={`text-[12px] ${discardReason === opt.value ? 'text-[#d93050] font-medium' : 'text-[#5D5961]'}`}
                                    onClick={() => setDiscardReason(opt.value)}>{opt.label}</span>
                            </label>
                        ))}
                        {discardReason === 'other' && (
                            <input autoFocus type="text" value={discardOther} onChange={e => setDiscardOther(e.target.value)}
                                placeholder="Describe the reason…"
                                className="w-full bg-white border border-[#d93050]/30 rounded-lg px-3 py-1.5 text-[12px] text-[#233B22] placeholder-[#8A898C] focus:outline-none focus:border-[#d93050]" />
                        )}
                        <div className="flex gap-2 pt-1">
                            <button onClick={() => setDiscardOpen(false)}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-[#C2E8DB] text-[#8A898C] text-[12px] font-mono hover:border-[#006825]/30">Cancel</button>
                            <button disabled={!discardReason || (discardReason === 'other' && !discardOther.trim()) || discarding}
                                onClick={async () => {
                                    const reason = discardReason === 'other' ? discardOther.trim() : discardReason.replace(/_/g, ' ')
                                    setDiscarding(true)
                                    await patch({ ignore: true, discard_reason: reason })
                                    setDiscarding(false); setDiscardOpen(false)
                                }}
                                className="flex-1 px-3 py-1.5 rounded-lg bg-[#d93050] text-white text-[12px] font-mono font-medium hover:bg-[#b82040] disabled:opacity-40 disabled:cursor-not-allowed">
                                {discarding ? 'Saving…' : 'Confirm'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-2 pt-4 border-t border-[#C2E8DB]">
                <a href={grant.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 bg-white border border-[#C2E8DB] rounded-xl px-4 py-3 hover:border-[#006825] hover:text-[#006825] transition-all group text-[#006825]">
                    <span className="text-[13px] font-medium">Open grant page</span>
                    <ExternalLink size={13} className="text-[#8A898C] group-hover:text-[#006825] shrink-0" />
                </a>
                <p className="font-mono text-[10px] text-[#8A898C] text-center mt-2">Changes save immediately.</p>
            </div>
        </div>
    )

    const editPanel = (
        <div className="flex flex-col gap-4">
            <p className="font-mono text-[10px] text-[#8A898C] leading-relaxed">Override fields the pipeline may have missed or got wrong.</p>
            {patchErr && <div className="flex items-center gap-2 bg-[#d93050]/10 border border-[#d93050]/20 rounded-lg px-3 py-2 text-[#d93050] text-[11px] font-mono"><AlertCircle size={12} /> {patchErr}</div>}
            {editSaved && <div className="flex items-center gap-2 bg-[#006825]/10 border border-[#006825]/30 rounded-lg px-3 py-2 text-[#006825] text-[11px] font-mono"><CheckCheck size={12} /> Saved successfully</div>}

            {[
                { label: 'Grant Amount', icon: <DollarSign size={10} />, value: editAmount, setter: setEditAmount, placeholder: 'e.g. $50,000' },
                { label: 'Application Deadline', icon: <Calendar size={10} />, value: editDeadline, setter: setEditDeadline, placeholder: 'e.g. March 15, 2026' },
            ].map(({ label, icon, value, setter, placeholder }) => (
                <div key={label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] text-[#8A898C] uppercase tracking-widest flex items-center gap-1.5">{icon} {label}</label>
                    <input type="text" value={value} onChange={e => { setter(e.target.value); setEditSaved(false) }} placeholder={placeholder}
                        className="w-full bg-white border border-[#C2E8DB] rounded-lg px-3 py-2 text-[13px] text-[#233B22] placeholder-[#C2E8DB] focus:outline-none focus:border-[#006825] transition-colors" />
                </div>
            ))}

            <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] text-[#8A898C] uppercase tracking-widest flex items-center gap-1.5"><Pencil size={10} /> Notes</label>
                <textarea value={editNotes} onChange={e => { setEditNotes(e.target.value); setEditSaved(false) }}
                    placeholder="Add any notes, reminders, or context…" rows={5}
                    className="w-full bg-white border border-[#C2E8DB] rounded-lg px-3 py-2 text-[13px] text-[#233B22] placeholder-[#C2E8DB] resize-none focus:outline-none focus:border-[#006825] transition-colors" />
            </div>

            <div className="flex gap-2">
                <button disabled={patching} onClick={() => { setEditAmount(grant.amount ?? ''); setEditDeadline(grant.deadline ?? ''); setEditNotes(grant.notes ?? ''); setEditSaved(false) }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#C2E8DB] text-[#8A898C] text-[12px] font-mono hover:border-[#006825]/30 disabled:opacity-50">
                    <RotateCcw size={11} /> Reset
                </button>
                <button disabled={patching} onClick={async () => { await patch({ amount: editAmount || null, deadline: editDeadline || null, notes: editNotes || null }); setEditSaved(true); setTimeout(() => setEditSaved(false), 3000) }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#006825] text-white text-[12px] font-mono font-medium hover:bg-[#005a1f] disabled:opacity-50">
                    <Save size={11} /> Save Changes
                </button>
            </div>
        </div>
    )

    // Left panel tab definitions
    // History tab is visible to all authenticated users (standard users see only their own actions,
    // admin users see everyone's - the API handles that distinction)
    const leftTabs = [
        { id: 'details', icon: <Globe size={11} />,  label: 'Details'  },
        { id: 'history', icon: <History size={11} />, label: 'History' },
    ]

    // Desktop two-column modal
    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-[#1B3829]/50 backdrop-blur-md"
            style={{ animation: 'fadeIn 0.15s ease' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="relative w-full max-w-[960px] max-h-[88vh] bg-white border border-[#C2E8DB] rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(0,104,37,0.18)] flex flex-col"
                style={{ animation: 'modalIn 0.2s ease' }}>

                <button onClick={onClose}
                    className="absolute top-1 right-1 z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-[#C8EFE2] border border-[#C2E8DB] text-[#006825] hover:text-[#233B22] hover:bg-[#C2E8DB] transition-all">
                    <X size={15} />
                </button>

                <div className="flex overflow-hidden flex-1 min-h-0">

                    {/* Left - details / history */}
                    <div className="flex-1 flex flex-col border-r border-[#C2E8DB] min-w-0 overflow-hidden">

                        {/* Left tab strip */}
                        <div className="flex border-b border-[#C2E8DB] shrink-0 bg-white">
                            <div className={`absolute top-0 left-0 right-0 h-[2px] ${URGENCY_BAR[u]}`} />
                            {leftTabs.map(t => (
                                <button key={t.id} onClick={() => setLeftTab(t.id)}
                                    className={`flex items-center gap-1.5 px-5 py-3 font-mono text-[10px] uppercase tracking-widest transition-colors border-b-2 -mb-px
                                        ${leftTab === t.id
                                            ? 'border-[#006825] text-[#006825]'
                                            : 'border-transparent text-[#8A898C] hover:text-[#233B22]'}`}>
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>

                        {/* Left panel body */}
                        <div className="flex-1 overflow-y-auto p-7">
                            {leftTab === 'details'
                                ? detailsPanel
                                : <HistoryPanel grantId={grant.id} />
                            }
                        </div>
                    </div>

                    {/* Right - actions / edit */}
                    <div className="w-[300px] shrink-0 flex flex-col bg-[#C8EFE2]/40 overflow-hidden">
                        <div className="flex border-b border-[#C2E8DB] shrink-0 pr-10">
                            {[{ id: 'actions', icon: <Zap size={11} />, label: 'Actions' }, { id: 'edit', icon: <Pencil size={11} />, label: 'Edit Info' }].map(t => (
                                <button key={t.id} onClick={() => setRightTab(t.id)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 font-mono text-[10px] uppercase tracking-widest transition-colors border-b-2 -mb-px
                                        ${rightTab === t.id ? 'border-[#006825] text-[#006825]' : 'border-transparent text-[#8A898C] hover:text-[#006825]'}`}>
                                    {t.icon} {t.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            {rightTab === 'actions' ? actionsPanel : editPanel}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// Sub-components

function ActionButton({ active, onClick, disabled, icon, label, hint, activeClass }) {
    return (
        <button onClick={onClick} disabled={disabled}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all disabled:opacity-50
                ${active ? activeClass : 'border-[#C2E8DB] bg-white text-[#006825] hover:border-[#006825]/30 hover:bg-[#C8EFE2]/30'}`}>
            <span className="shrink-0">{icon}</span>
            <div className="flex flex-col gap-0.5 text-left min-w-0">
                <span className="text-[13px] font-medium leading-none">{label}</span>
                <span className="font-mono text-[10px] opacity-60 leading-snug truncate">{hint}</span>
            </div>
            {active && <CheckCheck size={12} className="ml-auto shrink-0 opacity-60" />}
        </button>
    )
}

function Tag({ color, children }) {
    const cls = {
        gold:    'bg-[#d4a017]/12 border-[#d4a017]/30 text-[#d4a017]',
        accent:  'bg-[#D4D9FF]/60 border-[#D4D9FF] text-[#4a5296]',
        neutral: 'bg-[#C8EFE2] border-[#C2E8DB] text-[#006825]/70',
        green:   'bg-[#006825]/10 border-[#006825]/30 text-[#006825]',
        red:     'bg-[#d93050]/10 border-[#d93050]/25 text-[#d93050]',
    }[color] ?? 'bg-[#C8EFE2] border-[#C2E8DB] text-[#006825]/70'
    return <span className={`inline-flex items-center gap-1 font-mono text-[9px] font-medium uppercase tracking-wide px-2 py-0.5 rounded border ${cls}`}>{children}</span>
}

function MetaRow({ icon, label, children }) {
    return (
        <div className="flex items-start gap-3">
            <span className="text-[#8A898C] mt-0.5 shrink-0">{icon}</span>
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-mono text-[10px] text-[#8A898C] uppercase tracking-wide">{label}</span>
                <div className="flex items-baseline flex-wrap gap-0.5">{children}</div>
            </div>
        </div>
    )
}
