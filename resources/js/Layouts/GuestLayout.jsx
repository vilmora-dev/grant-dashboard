import { Link } from '@inertiajs/react'

/**
 * GuestLayout — used by Login, Register, and password pages.
 * Full-page teal-themed layout with logo in the top-left header.
 */
export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col bg-white">

            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-[#b2d8d8]">
                <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8 py-3 flex items-center">
                    <Link href="/" className="flex items-center h-10 shrink-0">
                        <img src="/logo.svg" alt="Logo" className="h-8 w-auto" />
                    </Link>
                </div>
            </header>

            {/* Centered card */}
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md bg-white border border-[#b2d8d8] rounded-2xl shadow-[0_8px_40px_rgba(58,175,169,0.10)] overflow-hidden">
                    {children}
                </div>
            </div>

        </div>
    )
}
