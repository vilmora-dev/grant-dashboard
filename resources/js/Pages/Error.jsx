import { Head, Link } from '@inertiajs/react'

/**
 * Inertia error page — rendered for 404, 403, 500, etc.
 * Laravel passes { status } as a prop via the exception handler.
 */
export default function Error({ status, auth }) {
    const isAuthed = auth?.user != null

    const copy = {
        403: {
            label: '403',
            title: 'Access denied.',
            body:  "You don't have permission to view this page. If you think this is a mistake, contact your administrator.",
        },
        404: {
            label: '404',
            title: 'Page not found.',
            body:  "This page doesn't exist or may have been moved. If you typed the address, double-check for typos.",
        },
        500: {
            label: '500',
            title: 'Something went wrong.',
            body:  'An unexpected error occurred on our end. Try refreshing — if the problem persists, contact your administrator.',
        },
        503: {
            label: '503',
            title: 'Back shortly.',
            body:  "We're down for a quick update and will be back online soon.",
        },
    }[status] ?? {
        label: String(status),
        title: 'An error occurred.',
        body:  'Something unexpected happened. Try going back or returning to the dashboard.',
    }

    const handleBack = () => {
        if (window.history.length > 1) {
            window.history.back()
        } else {
            window.location.href = '/'
        }
    }

    return (
        <>
            <Head title={copy.label} />

            <div className="min-h-screen flex flex-col bg-[#C8EFE2]">

                {/* Header */}
                <header className="sticky top-0 z-50 bg-[#C8EFE2] border-b border-black">
                    <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8 py-3 flex items-center">
                        <Link href="/" className="flex items-center h-10 shrink-0">
                            <img src="/delta-logo.webp" alt="Delta Rising Foundation" className="h-10 w-auto" />
                        </Link>
                    </div>
                </header>

                {/* Body */}
                <div className="flex-1 flex items-center justify-center px-4 py-16">
                    <div className="max-w-lg w-full">

                        {/* Status badge */}
                        <div className="inline-flex items-center gap-2 bg-[#006825]/10 border border-[#006825]/20 rounded-full px-3 py-1 mb-6">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#006825]" />
                            <span className="font-mono text-[10px] uppercase tracking-widest text-[#006825]">
                                Error {copy.label}
                            </span>
                        </div>

                        {/* Headline */}
                        <h1 className="font-serif font-bold text-[36px] md:text-[44px] leading-tight text-[#233B22] mb-4">
                            {copy.title}
                        </h1>

                        {/* Body copy */}
                        <p className="font-sans text-[15px] text-[#5D5961] leading-relaxed mb-10 max-w-sm">
                            {copy.body}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-3 flex-wrap">
                            {isAuthed ? (
                                <Link
                                    href={route('dashboard')}
                                    className="bg-[#006825] hover:bg-[#005a1f] text-white font-sans text-[13px] font-medium rounded-lg px-5 py-2.5 transition-colors"
                                >
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={route('login')}
                                    className="bg-[#006825] hover:bg-[#005a1f] text-white font-sans text-[13px] font-medium rounded-lg px-5 py-2.5 transition-colors"
                                >
                                    Go to Login
                                </Link>
                            )}

                            <button
                                onClick={handleBack}
                                className="font-sans text-[13px] text-[#5D5961] hover:text-[#233B22] border border-[#C2E8DB] hover:border-[#006825]/30 bg-white/60 hover:bg-white rounded-lg px-5 py-2.5 transition-all"
                            >
                                ← Go back
                            </button>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <footer className="border-t border-[#C2E8DB] py-6 text-center">
                    <span className="font-mono text-[11px] text-[#006825] font-medium">
                        Delta Rising Foundation · Grants Platform
                    </span>
                </footer>

            </div>
        </>
    )
}
