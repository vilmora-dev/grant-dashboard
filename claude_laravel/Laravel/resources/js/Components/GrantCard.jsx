import { useState } from 'react'
import { DollarSign, Calendar, Users, ArrowRight, Sparkles, CheckCheck, EyeOff, Star } from 'lucide-react'
import { formatAmount, formatDeadline, urgencyClass, stripHtml } from '../utils/formatters'
import { patchGrant } from '../utils/api'

const URGENCY = {
    urgent:  { bar: 'bg-[#d93050]', text: 'text-[#d93050]', chip: 'bg-[#d93050]/10 border-[#d93050]/25 text-[#d93050]', label: 'Urgent' },
    soon:    { bar: 'bg-[#e06030]', text: 'text-[#e06030]', chip: 'bg-[#e06030]/10 border-[#e06030]/25 text-[#e06030]', label: 'Soon'   },
    ok:      { bar: 'bg-[#3aafa9]', text: 'text-[#5a9090]', chip: 'bg-[#3aafa9]/10 border-[#3aafa9]/15 text-[#5a9090]', label: null     },
    expired: { bar: 'bg-[#b2d8d8]', text: 'text-[#5a9090]', chip: 'bg-[#def2f1] border-[#b2d8d8] text-[#5a9090]',       label: 'Expired'},
    neutral: { bar: 'bg-[#b2d8d8]', text: 'text-[#5a9090]', chip: 'bg-[#def2f1] border-[#b2d8d8] text-[#5a9090]',       label: null     },
}

function RelevanceBadge({ score }) {
    if (!score) return null
    const pct    = Math.min(Math.max(score, 0), 100)
    const color  = pct >= 70 ? '#3aafa9' : pct >= 40 ? '#d4a017' : '#8ec8c7'
    const bg     = pct >= 70 ? 'rgba(58,175,169,0.10)' : pct >= 40 ? 'rgba(212,160,23,0.10)' : 'rgba(178,216,216,0.25)'
    const border = pct >= 70 ? 'rgba(58,175,169,0.30)' : pct >= 40 ? 'rgba(212,160,23,0.30)' : '#b2d8d8'
    return (
        <span
            title={`Relevance score: ${pct}/100`}
            style={{ background: bg, borderColor: border, color }}
            className="inline-flex items-center gap-1 font-mono text-[9px] font-medium uppercase tracking-wide px-2 py-0.5 rounded border"
        >
            <svg width="7" height="7" viewBox="0 0 7 7" fill="currentColor"><circle cx="3.5" cy="3.5" r="3.5" /></svg>
            {pct}%
        </span>
    )
}

export default function GrantCard({ grant, index = 0, onSelect, isLastSelected, onUpdate }) {
    const amount    = formatAmount(grant.amount)
    const deadline  = formatDeadline(grant.deadline)
    const u         = URGENCY[urgencyClass(deadline?.diff)]
    const isCash    = grant.offers_cash ?? grant.is_cash_grant ?? true
    const isAI      = !!grant.ai_analyzed
    const isApplied = !!grant.applied
    const isIgnored = !!grant.ignore
    const plainDesc = stripHtml(grant.description)
    const score     = grant.relevance_score ?? 0

    const [starred, setStarred] = useState(!!grant.starred)
    const [saving,  setSaving]  = useState(false)

    async function toggleStar(e) {
        e.stopPropagation()
        if (saving) return
        setSaving(true)
        const next = !starred
        setStarred(next)
        try {
            const updated = await patchGrant(grant, { starred: next })
            onUpdate?.({ ...grant, ...updated })
        } catch {
            setStarred(!next)
        } finally {
            setSaving(false)
        }
    }

    return (
        <article
            onClick={onSelect}
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && onSelect()}
            tabIndex={0}
            role="button"
            aria-label={`View ${grant.title}`}
            className={`relative group bg-white rounded-2xl p-5 flex flex-col gap-3 cursor-pointer overflow-hidden
                transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(58,175,169,0.12)]
                focus-visible:outline-none focus-visible:shadow-[0_0_0_3px_rgba(58,175,169,0.2)]
                ${isLastSelected
                    ? 'border-2 border-[#3aafa9] bg-[#f4fafa] shadow-[0_4px_20px_rgba(58,175,169,0.15)]'
                    : 'border border-[#b2d8d8] hover:border-[#8ec8c7]'
                }`}
            style={{
                animation: `cardIn 0.4s ease both`,
                animationDelay: `${index * 35}ms`,
            }}
        >
            {/* Urgency bar */}
            <div className={`absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl ${u.bar}`} />

            {/* Star button */}
            <button
                onClick={toggleStar}
                title={starred ? 'Remove star' : 'Star this grant'}
                className={`absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg border transition-all z-10
                    ${starred
                        ? 'bg-[#fffbe6] border-[#d4a017] text-[#d4a017]'
                        : 'bg-transparent border-transparent text-[#b2d8d8] opacity-0 group-hover:opacity-100 hover:border-[#d4a017] hover:text-[#d4a017]'
                    }`}
            >
                <Star size={13} strokeWidth={starred ? 0 : 1.5} fill={starred ? 'currentColor' : 'none'} />
            </button>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-1 pr-8">
                {isCash && (
                    <span className="inline-flex items-center gap-1 font-mono text-[9px] font-medium uppercase tracking-wide px-2 py-0.5 rounded bg-[#d4a017]/12 border border-[#d4a017]/30 text-[#d4a017]">
                        <DollarSign size={9} strokeWidth={2.5} /> Cash
                    </span>
                )}
                {isAI && (
                    <span className="inline-flex items-center gap-1 font-mono text-[9px] font-medium uppercase tracking-wide px-2 py-0.5 rounded bg-[#3aafa9]/10 border border-[#3aafa9]/25 text-[#3aafa9]">
                        <Sparkles size={9} strokeWidth={2.5} /> AI
                    </span>
                )}
                {grant.source && (
                    <span className="font-mono text-[9px] uppercase tracking-wide px-2 py-0.5 rounded bg-[#def2f1] border border-[#b2d8d8] text-[#5a9090]">
                        {grant.source === 'duckduckgo' ? 'web search' : grant.source}
                    </span>
                )}
                {u.label && (
                    <span className={`font-mono text-[9px] uppercase tracking-wide px-2 py-0.5 rounded border ${u.chip}`}>
                        {u.label}
                    </span>
                )}
                {isApplied && (
                    <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide px-2 py-0.5 rounded border bg-[#c2edce]/60 border-[#3aaf6b]/30 text-[#3aaf6b]">
                        <CheckCheck size={9} /> Applied
                    </span>
                )}
                {isIgnored && (
                    <span className="inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-wide px-2 py-0.5 rounded border bg-[#d93050]/10 border-[#d93050]/25 text-[#d93050]">
                        <EyeOff size={9} /> Ignored
                    </span>
                )}
                {score > 0 && <RelevanceBadge score={score} />}
            </div>

            {/* Title */}
            <h2 className="font-serif font-semibold text-[15px] text-[#0d2b2b] leading-snug tracking-tight">
                {grant.title}
            </h2>

            {/* Description */}
            {plainDesc && (
                <p className="text-[12.5px] text-[#2b6e6b] leading-relaxed line-clamp-2">{plainDesc}</p>
            )}

            {/* Eligibility */}
            {grant.eligibility && (
                <div className="flex items-start gap-1.5 text-[12px] text-[#5a9090]">
                    <Users size={11} className="mt-0.5 shrink-0" />
                    <span className="leading-snug">{grant.eligibility}</span>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-end justify-between mt-auto pt-3 border-t border-[#b2d8d8]">
                <div className="flex flex-col gap-1">
                    <div className="flex items-baseline gap-1">
                        {amount ? (
                            <>
                                <span className="font-mono text-[20px] font-medium text-[#3aafa9] leading-none">{amount}</span>
                                <span className="font-mono text-[11px] text-[#5a9090]">max</span>
                            </>
                        ) : (
                            <span className="font-mono text-[14px] font-medium text-[#8ec8c7] leading-none">Unknown amount</span>
                        )}
                    </div>
                    {deadline && (
                        <div className={`flex items-center gap-1.5 font-mono text-[11px] ${u.text}`}>
                            <Calendar size={10} />
                            <span>{deadline.label}</span>
                            {deadline.diff != null && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${u.chip}`}>
                                    {deadline.diff < 0 ? 'expired' : `${deadline.diff}d`}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#def2f1] border border-[#b2d8d8] text-[#5a9090] transition-all group-hover:bg-[#3aafa9] group-hover:border-[#3aafa9] group-hover:text-white">
                    <ArrowRight size={14} />
                </div>
            </div>
        </article>
    )
}
