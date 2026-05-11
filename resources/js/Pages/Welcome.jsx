import { Head, Link } from '@inertiajs/react'

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Welcome" />
            <div className="min-h-[100vh] max-h-[100vh] flex flex-col bg-[#0d2b2b]">

                {/* ── Navbar ───────────────────────────────────────────── */}
                <header className="absolute top-0 left-0 right-0 z-50">
                    <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8 py-3 flex items-center justify-between gap-4">

                        {/* Logo */}
                        <Link href="/" className="flex items-center h-10 shrink-0">
                            <img src="/logo.svg" alt="Logo" className="h-8 w-auto" />
                        </Link>

                        {/* Nav */}
                        <nav className="flex items-center gap-2">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="bg-[#3aafa9] hover:bg-[#2b9e99] text-white font-sans text-[13px] rounded-lg px-4 py-2 transition-colors"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="font-sans text-[13px] text-white/80 hover:text-white border border-white/20 hover:border-white/40 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 transition-all"
                                    >
                                        Log in
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="font-sans text-[13px] text-white bg-[#3aafa9] hover:bg-[#2b9e99] rounded-lg px-4 py-2 transition-colors"
                                    >
                                        Register
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                {/* ── Hero ─────────────────────────────────────────────── */}
                <section className="relative w-full h-screen min-h-[560px] max-h-[820px] flex items-end overflow-hidden">

                    {/* Background image */}
                    <img
                        src="/forest.png"
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover object-center"
                        style={{ transform: 'scale(1.02)', transition: 'transform 8s ease-out' }}
                        onLoad={e => { e.target.style.transform = 'scale(1)' }}
                    />

                    {/* Gradient scrim — left-heavy, fades to transparent right */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(to right, rgba(13,43,43,0.93) 0%, rgba(13,43,43,0.75) 38%, rgba(13,43,43,0.20) 65%, transparent 100%)',
                        }}
                    />
                    {/* Bottom fade for seamless section transition */}
                    <div
                        className="absolute bottom-0 left-0 right-0 h-32"
                        style={{ background: 'linear-gradient(to top, #0d2b2b, transparent)' }}
                    />

                    {/* Content — sits over the gradient on the left */}
                    <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 md:px-8 pb-16 md:pb-24">
                        <div className="max-w-lg">

                            {/* Eyebrow badge */}
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3aafa9] animate-pulse" />
                                <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">
                                    Grant Discovery Platform
                                </span>
                            </div>

                            {/* Description */}
                            <p className="font-sans text-[17px] md:text-[19px] text-white/85 leading-relaxed mb-8">
                                Automated grant discovery, AI-powered relevance scoring, and a clean
                                dashboard to track every opportunity.
                            </p>

                            {/* CTAs */}
                            <div className="flex items-center gap-3 flex-wrap">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="font-sans text-[14px] font-medium text-white bg-[#3aafa9] hover:bg-[#2b9e99] rounded-xl px-6 py-3 transition-colors"
                                    >
                                        Open Dashboard →
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('register')}
                                            className="font-sans text-[14px] font-medium text-white bg-[#3aafa9] hover:bg-[#2b9e99] rounded-xl px-6 py-3 transition-colors"
                                        >
                                            Get Started
                                        </Link>
                                        <Link
                                            href={route('login')}
                                            className="font-sans text-[14px] text-white/80 hover:text-white border border-white/25 hover:border-white/50 bg-white/10 backdrop-blur-sm rounded-xl px-6 py-3 transition-all"
                                        >
                                            Log in
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Feature strip ────────────────────────────────────── */}
                {/* <section className="bg-[#0d2b2b] px-4 md:px-8 py-14">
                    <div className="max-w-[1600px] mx-auto">

                        <p className="font-mono text-[10px] uppercase tracking-widest text-[#5a9090] mb-6 text-center">
                            What's included
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {[
                                { label: 'AI Relevance Scoring',    desc: 'Every grant ranked against your org profile' },
                                { label: 'Web + Grants.gov',         desc: 'Two live sources, unified in one view' },
                                { label: 'Deadline Tracking',        desc: 'Never miss a closing date' },
                                { label: 'Star & Status',            desc: 'Shortlist and track application progress' },
                                { label: 'Org Profile Matching',     desc: 'Configure once, score everything' },
                                { label: 'Keyword Config',           desc: 'Fine-tune what the scraper finds' },
                            ].map(({ label, desc }) => (
                                <div key={label}
                                    className="rounded-xl border border-white/8 bg-white/4 px-4 py-5 flex flex-col gap-2"
                                    style={{ borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                                    <span className="font-mono text-[11px] font-medium text-[#3aafa9]">{label}</span>
                                    <span className="font-sans text-[12px] text-white/45 leading-snug">{desc}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </section> */}

                {/* ── Footer ───────────────────────────────────────────── */}
                <footer className="bg-[#0d2b2b] border-t border-white/8 py-6 text-center"
                    style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    <span className="font-mono text-[11px] text-[#5a9090]">
                        Delta Rising Foundation · Grants Platform
                    </span>
                </footer>

            </div>
        </>
    )
}
