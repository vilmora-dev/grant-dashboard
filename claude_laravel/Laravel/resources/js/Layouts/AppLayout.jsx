import { useState, useRef, useEffect } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import { Search, X, CogIcon } from 'lucide-react'

/**
 * AppLayout — sticky header + page slot.
 *
 * Props:
 *   stats        – { total, applied, shown }
 *   search       – controlled search string
 *   onSearch     – (value: string) => void
 *   showSettings – bool
 *   onSettings   – () => void
 *   children     – page content
 */
export default function AppLayout({
    stats = {},
    search = '',
    onSearch,
    showSettings,
    onSettings,
    children,
}) {
    const inputRef = useRef(null)
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
    const searchWrapRef = useRef(null)

    function openMobileSearch() {
        setMobileSearchOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
    }
    function closeMobileSearch() {
        onSearch?.('')
        setMobileSearchOpen(false)
    }

    // Close mobile search on outside click
    useEffect(() => {
        if (!mobileSearchOpen) return
        const handler = (e) => {
            if (searchWrapRef.current && !searchWrapRef.current.contains(e.target))
                closeMobileSearch()
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [mobileSearchOpen])

    const statPills = [
        { val: stats.total,   label: 'Total',  color: 'text-[#5a9090]'  },
        { val: stats.applied, label: 'Applied', color: 'text-[#3aaf6b]' },
        { val: stats.shown,   label: 'Shown',   color: 'text-[#2b6e6b]' },
    ]

    return (
        <div className="min-h-screen flex flex-col bg-white">
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#b2d8d8]">
                <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8 py-3 flex items-center justify-between gap-3 md:gap-6">

                    {/* Logo — links to grants dashboard */}
                    <Link href="/" className="flex-shrink-0 flex items-center h-10">
                        <span className="font-serif font-bold text-[18px] text-[#0d2b2b] tracking-tight">
                            Grants<span className="text-[#3aafa9]">.</span>
                        </span>
                    </Link>

                    {/* Mobile: search overlay */}
                    {mobileSearchOpen ? (
                        <div ref={searchWrapRef} className="flex flex-1 items-center gap-2 md:hidden">
                            <div className="relative flex-1">
                                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5a9090] pointer-events-none" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search grants…"
                                    value={search}
                                    onChange={e => onSearch?.(e.target.value)}
                                    className="w-full bg-[#def2f1] border border-[#3aafa9] rounded-lg pl-8 pr-7 py-2 text-[13px] text-[#0d2b2b] placeholder-[#5a9090] outline-none"
                                />
                                {search && (
                                    <button onClick={() => onSearch?.('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-[#c8eae9]/80 text-[#5a9090]">
                                        <X size={11} strokeWidth={2.5} />
                                    </button>
                                )}
                            </div>
                            <button onClick={closeMobileSearch}
                                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-[#def2f1] border border-[#b2d8d8] text-[#5a9090]">
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-1 items-center justify-between gap-4">
                            {/* Stat pills */}
                            <div className="flex gap-1.5 md:gap-2">
                                <div className="hidden md:block w-px h-8 bg-[#b2d8d8]" />
                                {statPills.map(({ val, label, color }) => (
                                    <div key={label}
                                        className="flex flex-col items-center bg-[#def2f1] border border-[#b2d8d8] rounded-md py-1 px-2 min-w-[36px] md:px-2.5 md:min-w-[42px]">
                                        <span className={`font-mono font-medium text-[12px] md:text-sm leading-none ${color}`}>{val ?? '—'}</span>
                                        <span className="font-mono text-[#5a9090] uppercase tracking-wide mt-0.5 text-[8px] md:text-[9px]">{label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop search */}
                            <div className="hidden md:block relative flex-1 min-w-[200px] max-w-[400px] focus-within:max-w-[480px] transition-all duration-300">
                                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#5a9090] pointer-events-none" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search grants, sources, eligibility…"
                                    value={search}
                                    onChange={e => onSearch?.(e.target.value)}
                                    className="w-full bg-[#def2f1] border border-[#b2d8d8] rounded-lg pl-8 pr-7 py-2 text-[13px] text-[#0d2b2b] placeholder-[#5a9090]
                                               outline-none focus:border-[#3aafa9] focus:shadow-[0_0_0_3px_rgba(58,175,169,0.12)] transition-shadow"
                                />
                                {search && (
                                    <button onClick={() => onSearch?.('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-[#c8eae9]/80 text-[#5a9090]">
                                        <X size={11} strokeWidth={2.5} />
                                    </button>
                                )}
                            </div>

                            {/* Right buttons */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button onClick={openMobileSearch}
                                    className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-[#def2f1] border border-[#b2d8d8] text-[#5a9090]">
                                    <Search size={15} />
                                </button>
                                <button
                                    onClick={onSettings}
                                    className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-lg border transition-colors outline-none
                                        ${showSettings
                                            ? 'bg-[#3aafa9] border-[#3aafa9] text-white'
                                            : 'bg-[#def2f1] border-[#b2d8d8] text-[#5a9090] hover:text-[#0d2b2b]'}`}
                                >
                                    <CogIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="flex-1 max-w-[1600px] mx-auto w-full px-4 py-4 md:px-8 md:py-8">
                {children}
            </main>
        </div>
    )
}
