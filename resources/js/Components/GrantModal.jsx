import { useState, useCallback, useRef, useEffect } from 'react'
import {
    X, ExternalLink, Globe, DollarSign, Calendar, Users,
    Sparkles, AlertCircle, Pencil, Zap,
    CheckCheck, EyeOff, Star, Save, RotateCcw, Trash2, ChevronDown,
} from 'lucide-react'
import { formatAmountFull, formatDeadline, urgencyClass } from '../utils/formatters'
import { patchGrant } from '../utils/api'

// ── HTML helpers ─────────────────────────────────────────────────────────────

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

// ── Urgency maps ──────────────────────────────────────────────────────────────

const URGENCY_TEXT = { urgent: 'text-[#d93050]', soon: 'text-[#e06030]', ok: 'text-[#5a9090]', expired: 'text-[#5a9090]', neutral: 'text-[#5a9090]' }
const URGENCY_BAR  = { urgent: 'bg-[#d93050]',   soon: 'bg-[#e06030]',   ok: 'bg-[#3aafa9]',   expired: 'bg-[#b2d8d8]',   neutral: 'bg-[#b2d8d8]'   }

// ── Main modal ────────────────────────────────────────────────────────────────

export default function GrantModal({ grant: initialGrant, onClose, onUpdate }) {
    const [grant,    setGrant]    = useState(initialGrant)
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
    const isCash    = grant.offers_cash ?? grant.is_cash_grant ?? true
    const isAI      = !!grant.ai_analyzed
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

    // ── Panels ───────────────────────────────────────────────────────────────

    const detailsPanel = (
        <div className="flex flex-col gap-5">
            <div className="flex flex-wrap gap-1.5 mt-1">
                {isCash    && <Tag color="gold">💰 Cash Grant</Tag>}
                {isAI      && <Tag color="accent"><Sparkles size={9} /> AI Analyzed</Tag>}
                {grant.source && <Tag color="neutral">{grant.source === 'duckduckgo' ? 'Web Search' : grant.source}</Tag>}
                {score > 0 && (
                    <span title={`Relevance score: ${score}/100`}
                        style={{
                            background:  score >= 70 ? 'rgba(58,175,169,0.10)' : score >= 40 ? 'rgba(212,160,23,0.10)' : 'rgba(178,216,216,0.25)',
                            borderColor: score >= 70 ? 'rgba(58,175,169,0.30)' : score >= 40 ? 'rgba(212,160,23,0.30)' : '#b2d8d8',
                            color:       score >= 70 ? '#3aafa9'                : score >= 40 ? '#d4a017'               : '#8ec8c7',
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

            <h2 className="font-serif font-bold text-[22px] text-[#0d2b2b] leading-tight tracking-tight">{grant.title}</h2>

            {grant.description && <RichText text={grant.description} className="text-[13.5px] text-[#2b6e6b] leading-relaxed" />}

            {isAI && grant.summary && (
                <div className="bg-[#3aafa9]/06 border border-[#3aafa9]/20 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#3aafa9] uppercase tracking-widest mb-2">
                        <Sparkles size={10} /> AI Summary
                    </div>
                    <RichText text={grant.summary} className="text-[13px] text-[#2b6e6b] leading-relaxed" />
                </div>
            )}

            <div className="bg-[#def2f1] border border-[#b2d8d8] rounded-xl p-4 flex flex-col gap-4">
                {amount && (
                    <MetaRow icon={<DollarSign size={13} />} label="Maximum Award">
                        <span className="font-mono text-[20px] font-medium text-[#3aafa9]">{amount}</span>
                    </MetaRow>
                )}
                {deadline && (
                    <MetaRow icon={<Calendar size={13} />} label="Application Deadline">
                        <span className={`text-[14px] ${URGENCY_TEXT[u]}`}>{deadline.label}</span>
                        {deadline.diff != null && (
                            <span className="font-mono text-[11px] text-[#5a9090] ml-2">
                                {deadline.diff < 0 ? 'Deadline passed' : `${deadline.diff} days remaining`}
                            </span>
                        )}
                    </MetaRow>
                )}
                {grant.eligibility && (
                    <MetaRow icon={<Users size={13} />} label="Eligible Applicants">
                        <span className="text-[13px] text-[#0d2b2b]">{grant.eligibility}</span>
                    </MetaRow>
                )}
            </div>

            {grant.notes && (
                <div className="bg-[#fffbe6] border border-[#d4a017]/30 rounded-xl p-4">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] text-[#d4a017] uppercase tracking-widest mb-1.5">
                        <Pencil size={10} /> Your Notes
                    </div>
                    <p className="text-[13px] text-[#0d2b2b] leading-relaxed whitespace-pre-wrap">{grant.notes}</p>
                </div>
            )}

            <a href={grant.url} target="_blank" rel="noopener noreferrer"
                className="self-start flex items-center gap-2 bg-[#def2f1] border border-[#8ec8c7] rounded-lg px-4 py-2.5 text-[13px] font-medium text-[#0d2b2b] hover:border-[#3aafa9] hover:text-[#3aafa9] transition-all">
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
                activeClass="border-[#3aaf6b]/50 bg-[#c2edce]/40 text-[#3aaf6b]" />

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
                            ${discardOpen ? 'border-[#d93050]/40 bg-[#d93050]/08 text-[#d93050]' : 'border-[#b2d8d8] bg-white text-[#2b6e6b] hover:border-[#d93050]/40 hover:text-[#d93050]'}`}>
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
                            { value: 'not_a_grant',      label: 'Not a grant opportunity' },
                            { value: 'deadline_passed',  label: 'Deadline already passed' },
                            { value: 'not_cash',         label: 'Not a cash grant' },
                            { value: 'outside_geography',label: 'Outside our geography' },
                            { value: 'paywall',          label: 'Requires account / paywall' },
                            { value: 'other',            label: 'Other…' },
                        ].map(opt => (
                            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
                                <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 transition-all ${discardReason === opt.value ? 'border-[#d93050] bg-[#d93050]' : 'border-[#b2d8d8] group-hover:border-[#d93050]/50'}`}
                                    onClick={() => setDiscardReason(opt.value)} />
                                <span className={`text-[12px] ${discardReason === opt.value ? 'text-[#d93050] font-medium' : 'text-[#2b6e6b]'}`}
                                    onClick={() => setDiscardReason(opt.value)}>{opt.label}</span>
                            </label>
                        ))}
                        {discardReason === 'other' && (
                            <input autoFocus type="text" value={discardOther} onChange={e => setDiscardOther(e.target.value)}
                                placeholder="Describe the reason…"
                                className="w-full bg-white border border-[#d93050]/30 rounded-lg px-3 py-1.5 text-[12px] text-[#0d2b2b] placeholder-[#b2d8d8] focus:outline-none focus:border-[#d93050]" />
                        )}
                        <div className="flex gap-2 pt-1">
                            <button onClick={() => setDiscardOpen(false)}
                                className="flex-1 px-3 py-1.5 rounded-lg border border-[#b2d8d8] text-[#5a9090] text-[12px] font-mono hover:border-[#8ec8c7]">Cancel</button>
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

            <div className="mt-2 pt-4 border-t border-[#b2d8d8]">
                <a href={grant.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-between gap-2 bg-white border border-[#b2d8d8] rounded-xl px-4 py-3 hover:border-[#3aafa9] hover:text-[#3aafa9] transition-all group text-[#2b6e6b]">
                    <span className="text-[13px] font-medium">Open grant page</span>
                    <ExternalLink size={13} className="text-[#5a9090] group-hover:text-[#3aafa9] shrink-0" />
                </a>
                <p className="font-mono text-[10px] text-[#5a9090] text-center mt-2">Changes save immediately.</p>
            </div>
        </div>
    )

    const editPanel = (
        <div className="flex flex-col gap-4">
            <p className="font-mono text-[10px] text-[#5a9090] leading-relaxed">Override fields the pipeline may have missed or got wrong.</p>
            {patchErr && <div className="flex items-center gap-2 bg-[#d93050]/10 border border-[#d93050]/20 rounded-lg px-3 py-2 text-[#d93050] text-[11px] font-mono"><AlertCircle size={12} /> {patchErr}</div>}
            {editSaved && <div className="flex items-center gap-2 bg-[#c2edce]/50 border border-[#3aaf6b]/30 rounded-lg px-3 py-2 text-[#3aaf6b] text-[11px] font-mono"><CheckCheck size={12} /> Saved successfully</div>}

            {[
                { label: 'Grant Amount', icon: <DollarSign size={10} />, value: editAmount, setter: setEditAmount, placeholder: 'e.g. $50,000' },
                { label: 'Application Deadline', icon: <Calendar size={10} />, value: editDeadline, setter: setEditDeadline, placeholder: 'e.g. March 15, 2026' },
            ].map(({ label, icon, value, setter, placeholder }) => (
                <div key={label} className="flex flex-col gap-1.5">
                    <label className="font-mono text-[10px] text-[#5a9090] uppercase tracking-widest flex items-center gap-1.5">{icon} {label}</label>
                    <input type="text" value={value} onChange={e => { setter(e.target.value); setEditSaved(false) }} placeholder={placeholder}
                        className="w-full bg-white border border-[#b2d8d8] rounded-lg px-3 py-2 text-[13px] text-[#0d2b2b] placeholder-[#b2d8d8] focus:outline-none focus:border-[#3aafa9] transition-colors" />
                </div>
            ))}

            <div className="flex flex-col gap-1.5">
                <label className="font-mono text-[10px] text-[#5a9090] uppercase tracking-widest flex items-center gap-1.5"><Pencil size={10} /> Notes</label>
                <textarea value={editNotes} onChange={e => { setEditNotes(e.target.value); setEditSaved(false) }}
                    placeholder="Add any notes, reminders, or context…" rows={5}
                    className="w-full bg-white border border-[#b2d8d8] rounded-lg px-3 py-2 text-[13px] text-[#0d2b2b] placeholder-[#b2d8d8] resize-none focus:outline-none focus:border-[#3aafa9] transition-colors" />
            </div>

            <div className="flex gap-2">
                <button disabled={patching} onClick={() => { setEditAmount(grant.amount ?? ''); setEditDeadline(grant.deadline ?? ''); setEditNotes(grant.notes ?? ''); setEditSaved(false) }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#b2d8d8] text-[#5a9090] text-[12px] font-mono hover:border-[#8ec8c7] disabled:opacity-50">
                    <RotateCcw size={11} /> Reset
                </button>
                <button disabled={patching} onClick={async () => { await patch({ amount: editAmount || null, deadline: editDeadline || null, notes: editNotes || null }); setEditSaved(true); setTimeout(() => setEditSaved(false), 3000) }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#3aafa9] text-white text-[12px] font-mono font-medium hover:bg-[#2e9490] disabled:opacity-50">
                    <Save size={11} /> Save Changes
                </button>
            </div>
        </div>
    )

    // ── Desktop two-column modal ─────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6 bg-[#0d2b2b]/40 backdrop-blur-md"
            style={{ animation: 'fadeIn 0.15s ease' }}
            onClick={e => e.target === e.currentTarget && onClose()}>
            <div className="relative w-full max-w-[960px] max-h-[88vh] bg-white border border-[#8ec8c7] rounded-2xl overflow-hidden shadow-[0_32px_80px_rgba(58,175,169,0.18)] flex flex-col"
                style={{ animation: 'modalIn 0.2s ease' }}>

                <button onClick={onClose}
                    className="absolute top-1 right-1 z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-[#def2f1] border border-[#b2d8d8] text-[#5a9090] hover:text-[#0d2b2b] hover:bg-[#c8eae9] transition-all">
                    <X size={15} />
                </button>

                <div className="flex overflow-hidden flex-1 min-h-0">
                    {/* Left — details */}
                    <div className="flex-1 flex flex-col gap-5 p-7 overflow-y-auto border-r border-[#b2d8d8] min-w-0">
                        <div className={`absolute top-0 left-0 right-0 h-[2px] ${URGENCY_BAR[u]}`} />
                        {detailsPanel}
                    </div>

                    {/* Right — actions / edit */}
                    <div className="w-[300px] shrink-0 flex flex-col bg-[#f4fafa] overflow-hidden">
                        <div className="flex border-b border-[#b2d8d8] shrink-0 pr-10">
                            {[{ id: 'actions', icon: <Zap size={11} />, label: 'Actions' }, { id: 'edit', icon: <Pencil size={11} />, label: 'Edit Info' }].map(t => (
                                <button key={t.id} onClick={() => setRightTab(t.id)}
                                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-3 font-mono text-[10px] uppercase tracking-widest transition-colors border-b-2 -mb-px
                                        ${rightTab === t.id ? 'border-[#3aafa9] text-[#3aafa9]' : 'border-transparent text-[#5a9090] hover:text-[#2b6e6b]'}`}>
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
                ${active ? activeClass : 'border-[#b2d8d8] bg-white text-[#2b6e6b] hover:border-[#8ec8c7] hover:bg-[#f4fafa]'}`}>
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
    const cls = { gold: 'bg-[#d4a017]/12 border-[#d4a017]/30 text-[#d4a017]', accent: 'bg-[#3aafa9]/10 border-[#3aafa9]/25 text-[#3aafa9]', neutral: 'bg-[#def2f1] border-[#b2d8d8] text-[#5a9090]', green: 'bg-[#c2edce]/60 border-[#3aaf6b]/30 text-[#3aaf6b]', red: 'bg-[#d93050]/10 border-[#d93050]/25 text-[#d93050]' }[color] ?? 'bg-[#def2f1] border-[#b2d8d8] text-[#5a9090]'
    return <span className={`inline-flex items-center gap-1 font-mono text-[9px] font-medium uppercase tracking-wide px-2 py-0.5 rounded border ${cls}`}>{children}</span>
}

function MetaRow({ icon, label, children }) {
    return (
        <div className="flex items-start gap-3">
            <span className="text-[#5a9090] mt-0.5 shrink-0">{icon}</span>
            <div className="flex flex-col gap-0.5 min-w-0">
                <span className="font-mono text-[10px] text-[#5a9090] uppercase tracking-wide">{label}</span>
                <div className="flex items-baseline flex-wrap gap-0.5">{children}</div>
            </div>
        </div>
    )
}
