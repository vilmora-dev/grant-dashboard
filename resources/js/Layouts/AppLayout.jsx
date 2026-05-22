import { useState, useRef, useEffect } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import { Search, X, User, LayoutDashboard, Settings, LogOut, ChevronDown, BarChart2 } from 'lucide-react'

/**
 * AppLayout — sticky header + page slot.
 *
 * Search model:
 *   - `committedSearch` is the server-active search term (from URL/filters).
 *   - `localValue` is the draft text in the input — updates on every keystroke,
 *     never triggers a server call on its own.
 *   - Search commits on Enter or the search button click.
 *   - Escape blurs the input without clearing the draft text.
 *   - The X button clears both local and committed search.
 *   - When committedSearch changes externally (reset, browser back), localValue
 *     syncs to match so they never diverge.
 */
export default function AppLayout({
    stats = {},
    committedSearch = '',
    onSearch,
    children,
}) {
    const { auth } = usePage().props
    const user = auth?.user
    const isFullAccess = user?.role === 'full'

    const inputRef        = useRef(null)
    const searchWrapRef   = useRef(null)
    const accountMenuRef  = useRef(null)

    const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
    const [accountOpen,      setAccountOpen]      = useState(false)

    // Local draft — typing here does NOT hit the server
    const [localValue, setLocalValue] = useState(committedSearch)

    // Keep draft in sync if the committed search changes externally
    useEffect(() => {
        setLocalValue(committedSearch)
    }, [committedSearch])

    function commit(value) {
        onSearch?.(value)
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') {
            commit(localValue)
            inputRef.current?.blur()
        }
        if (e.key === 'Escape') {
            inputRef.current?.blur()
            // intentionally does NOT clear localValue
        }
    }

    function handleClear() {
        setLocalValue('')
        commit('')
        inputRef.current?.focus()
    }

    function openMobileSearch() {
        setMobileSearchOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
    }
    function closeMobileSearch() {
        setMobileSearchOpen(false)
        // does not clear search — user may want to reopen and keep their query
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

    // Close account menu on outside click
    useEffect(() => {
        if (!accountOpen) return
        const handler = (e) => {
            if (accountMenuRef.current && !accountMenuRef.current.contains(e.target))
                setAccountOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [accountOpen])

    function handleLogout(e) {
        e.preventDefault()
        router.post(route('logout'))
    }

    // User initials for avatar
    const initials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
        : '?'

    // When paginated: show "from–to" if the filtered set spans multiple pages,
    // otherwise just show the count. Falls back gracefully if props are missing.
    const shownVal = stats.shown != null
        ? (stats.from && stats.to && stats.shown > 24
            ? `${stats.from}–${stats.to}`
            : stats.shown)
        : '—'

    const statPills = [
        { val: stats.total   ?? '—', label: 'Total',   color: 'text-[#233B22]' },
        { val: stats.applied ?? '—', label: 'Applied',  color: 'text-[#006825]' },
        { val: shownVal,             label: 'Shown',    color: 'text-[#072F98]' },
    ]

    return (
        <div className="min-h-screen flex flex-col bg-[#C8EFE2]">
            <header className="sticky top-0 z-50 bg-[#006825]/20 backdrop-blur-xl border-b border-[#C2E8DB]">
                <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8 py-3 flex items-center justify-between gap-3 md:gap-6">

                    {/* Logo */}
                    <Link href="/dashboard" className="flex-shrink-0 flex items-center h-10">
                        <img src="/delta-logo.png" alt="Logo" className="h-10 w-auto" />
                    </Link>

                    {/* Mobile: search overlay */}
                    {mobileSearchOpen ? (
                        <div ref={searchWrapRef} className="flex flex-1 items-center gap-2 md:hidden">
                            <div className="relative flex-1">
                                <div className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                    {localValue && (
                                        <button onClick={handleClear}
                                            className="w-5 h-5 flex items-center justify-center rounded-full bg-[#FF9E00]/20 text-[#006825] hover:bg-[#FF9E00] hover:text-white">
                                            <X size={11} strokeWidth={2.5} />
                                        </button>
                                    )}
                                </div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search grants…"
                                    value={localValue}
                                    onChange={e => setLocalValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full bg-white border border-[#006825] rounded-lg px-8 py-2 text-[13px] text-[#233B22] placeholder-[#8A898C] outline-none"
                                />
                                
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                    
                                    <button
                                        onClick={() => { commit(localValue); closeMobileSearch() }}
                                        className="w-7 h-7 flex items-center justify-center rounded-md bg-[#006825] text-white">
                                        <Search size={12} />
                                    </button>
                                </div>
                            </div>
                            <button onClick={closeMobileSearch}
                                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#C2E8DB] text-[#006825]">
                                <X size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-1 items-center justify-between gap-4">

                            {/* Stat pills */}
                            <div className="flex gap-1.5 md:gap-2">
                                <div className="hidden md:block w-px h-8 bg-[#C2E8DB]" />
                                {statPills.map(({ val, label, color }) => (
                                    <div key={label}
                                        className="flex flex-col items-center bg-white border border-[#C2E8DB] rounded-md py-1 px-2 min-w-[36px] md:px-2.5 md:min-w-[42px]">
                                        <span className={`font-mono font-medium text-[12px] md:text-sm leading-none ${color}`}>{val ?? '—'}</span>
                                        <span className="font-mono text-[#8A898C] uppercase tracking-wide mt-0.5 text-[8px] md:text-[9px]">{label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop search */}
                            <div className="hidden md:flex items-center relative flex-1 min-w-[200px] max-w-[400px] focus-within:max-w-[480px] transition-all duration-300">
                                <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                    {localValue && (
                                        <button
                                            onClick={handleClear}
                                            title="Clear search"
                                            className="w-5 h-5 flex items-center justify-center rounded-full bg-[#FF9E00]/20 text-[#006825] hover:bg-[#FF9E00] hover:text-white transition-colors">
                                            <X size={11} strokeWidth={2.5} />
                                        </button>
                                    )}
                                </div>
                                <input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Search grants, sources, eligibility…"
                                    value={localValue}
                                    onChange={e => setLocalValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full bg-white border border-[#C2E8DB] rounded-lg pl-7 pr-9 py-2 text-[13px] text-[#233B22] placeholder-[#8A898C]
                                               outline-none focus:border-[#006825] focus:shadow-[0_0_0_3px_rgba(0,104,37,0.12)] transition-shadow"
                                />
                                {/* Right-side controls: clear + search button */}
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                                    <button
                                        onClick={() => commit(localValue)}
                                        title="Search (Enter)"
                                        className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors
                                            ${committedSearch
                                                ? 'bg-[#006825] text-white'
                                                : 'bg-[#C8EFE2] text-[#006825] hover:bg-[#006825] hover:text-white'
                                            }`}>
                                        <Search size={12} />
                                    </button>
                                </div>
                            </div>

                            {/* Right - mobile search + account menu */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button onClick={openMobileSearch}
                                    className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-[#C2E8DB] text-[#006825]">
                                    <Search size={15} />
                                </button>

                                {/* Account button + dropdown */}
                                <div ref={accountMenuRef} className="relative">
                                    <button
                                        onClick={() => setAccountOpen(o => !o)}
                                        className={`flex items-center gap-1.5 h-9 pl-1 pr-2 rounded-lg border transition-colors outline-none
                                            ${accountOpen
                                                ? 'bg-[#006825] border-[#006825] text-white'
                                                : 'bg-white border-[#C2E8DB] text-[#233B22] hover:text-[#006825]'}`}
                                    >
                                        {/* Avatar circle */}
                                        <span className={`w-7 h-7 rounded-md flex items-center justify-center font-mono text-[11px] font-semibold
                                            ${accountOpen ? 'bg-white/20 text-white' : 'bg-[#C2E8DB] text-[#006825]'}`}>
                                            {initials}
                                        </span>
                                        <ChevronDown size={12} className={`transition-transform ${accountOpen ? 'rotate-180' : ''}`} />
                                    </button>

                                    {/* Dropdown */}
                                    {accountOpen && (
                                        <div className="absolute right-0 top-[calc(100%+6px)] w-52 bg-white border border-[#C2E8DB] rounded-xl shadow-[0_8px_32px_rgba(0,104,37,0.12)] overflow-hidden z-50">

                                            {/* User info */}
                                            <div className="px-3 py-2.5 border-b border-[#C8EFE2]">
                                                <p className="font-sans font-medium text-[13px] text-[#233B22] truncate">{user?.name}</p>
                                                <p className="font-mono text-[11px] text-[#8A898C] truncate">{user?.email}</p>
                                            </div>

                                            {/* Menu items */}
                                            <div className="py-1">
                                                <Link
                                                    href="/dashboard"
                                                    onClick={() => setAccountOpen(false)}
                                                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-sans text-[#233B22] hover:bg-[#C8EFE2] hover:text-[#006825] transition-colors"
                                                >
                                                    <LayoutDashboard size={14} className="text-[#8A898C]" />
                                                    Dashboard
                                                </Link>

                                                {isFullAccess && (<>
                                                <Link
                                                    href="/stats"
                                                    onClick={() => setAccountOpen(false)}
                                                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-sans text-[#233B22] hover:bg-[#C8EFE2] hover:text-[#006825] transition-colors"
                                                >
                                                    <BarChart2 size={14} className="text-[#8A898C]" />
                                                    Graphs
                                                </Link>

                                                <Link
                                                    href="/config"
                                                    onClick={() => setAccountOpen(false)}
                                                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-sans text-[#233B22] hover:bg-[#C8EFE2] hover:text-[#006825] transition-colors"
                                                >
                                                    <Settings size={14} className="text-[#8A898C]" />
                                                    Scraper Settings
                                                </Link>

                                                <Link
                                                    href="/team"
                                                    onClick={() => setAccountOpen(false)}
                                                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-sans text-[#233B22] hover:bg-[#C8EFE2] hover:text-[#006825] transition-colors"
                                                >
                                                    <User size={14} className="text-[#8A898C]" />
                                                    Team
                                                </Link>
                                                </>)}

                                                <Link
                                                    href={route('profile.edit')}
                                                    onClick={() => setAccountOpen(false)}
                                                    className="flex items-center gap-2.5 px-3 py-2 text-[13px] font-sans text-[#233B22] hover:bg-[#C8EFE2] hover:text-[#006825] transition-colors"
                                                >
                                                    <User size={14} className="text-[#8A898C]" />
                                                    Account
                                                </Link>
                                            </div>

                                            {/* Logout */}
                                            <div className="border-t border-[#C8EFE2] py-1">
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-sans text-[#d93050] hover:bg-[#d93050]/5 transition-colors"
                                                >
                                                    <LogOut size={14} />
                                                    Log Out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
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
