import { Head, Link } from '@inertiajs/react'

export default function Welcome({ auth }) {
    return (
        <>
            <Head title="Welcome" />
            <div className="h-screen flex flex-col bg-[#C8EFE2]">

                {/* --- Navbar */}
                <header className="absolute top-0 left-0 right-0 z-50">
                    <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8 py-3 flex items-center justify-between gap-4">

                        {/* Logo */}
                        <Link href="/" className="flex items-center shrink-0">
                            <img src="/delta-logo.png" alt="Logo" className="h-12 w-auto rounded" />
                        </Link>

                        {/* Nav */}
                        <nav className="flex items-center gap-2">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="bg-[#006825] hover:bg-[#005a1f] text-white font-sans text-[13px] rounded-lg px-4 py-2 transition-colors"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="font-sans text-[13px] text-[#006825] hover:text-[#005a1f] border border-[#006825]/30 hover:border-[#006825]/60 bg-[#C2E8DB]/50 hover:bg-[#C2E8DB]/70 backdrop-blur-sm rounded-lg px-4 py-2 transition-all"
                                    >
                                        Log in
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </header>

                {/* Hero */}
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

                    {/* Gradient scrim - left-heavy, fades to transparent right */}
                    <div
                        className="absolute inset-0"
                        style={{
                            background: 'linear-gradient(to right, rgba(200,239,226,0.40) 0%, rgba(200,239,226,0.15) 38%, rgba(13,43,43,0.20) 65%, transparent 100%)',
                        }}
                    />
                    {/* Bottom fade for seamless section transition */}
                    <div
                        className="absolute bottom-0 left-0 right-0 h-32"
                        style={{ background: 'linear-gradient(to top, #C8EFE2, transparent)' }}
                    />

                    {/* Content - sits over the gradient on the left */}
                    <div className="relative z-10 w-full max-w-[1600px] mx-auto px-4 md:px-8 pb-16 md:pb-24">
                        <div className="max-w-lg">

                            {/* Eyebrow badge */}
                            <div className="inline-flex items-center gap-2 bg-[#006825]/80 backdrop-blur-sm border border-[#C2E8DB]/30 rounded-full px-3 py-1 mb-6">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#C8EFE2] animate-pulse" />
                                <span className="font-mono text-[10px] uppercase tracking-widest text-[#C8EFE2]">
                                    Grant Discovery Platform
                                </span>
                            </div>

                            {/* Description */}
                            <p className="font-sans text-[17px] md:text-[19px] text-white leading-relaxed mb-8"
                               style={{ textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                                Automated grant discovery, AI semantic filtering, and a clean
                                dashboard to track opportunities.
                            </p>

                            {/* CTAs */}
                            <div className="flex items-center gap-3 flex-wrap">
                                {auth.user ? (
                                    <Link
                                        href={route('dashboard')}
                                        className="font-sans text-[14px] font-medium text-white bg-[#006825] hover:bg-[#005a1f] rounded-xl px-6 py-3 transition-colors"
                                    >
                                        Open Dashboard →
                                    </Link>
                                ) : (
                                    <>
                                        <Link
                                            href={route('login')}
                                            className="font-sans text-[14px] text-white hover:text-white border border-white/25 hover:border-white/50 bg-[#006825]/80 hover:bg-[#006825] backdrop-blur-sm rounded-xl px-6 py-3 transition-all"
                                        >
                                            Log in
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* --- Footer */}
                <footer className="bg-[#C8EFE2] border-t border-[#C2E8DB] py-6 text-center">
                    <span className="font-mono text-[11px] text-[#006825] font-medium">
                        Delta Rising Foundation · Grants Platform
                    </span>
                </footer>

            </div>
        </>
    )
}
