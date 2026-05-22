import { Link } from '@inertiajs/react'

/**
 * GuestLayout - used by Login, Register, and password pages.
 */
export default function GuestLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col bg-[#006825]/50">

            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#C8EFE2] backdrop-blur-xl border-b border-black">
                <div className="max-w-[1600px] mx-auto w-full px-4 md:px-8 py-3 flex items-center">
                    <Link href="/" className="flex items-center h-10 shrink-0">
                        <img src="/delta-logo.webp" alt="Logo" className="h-10 w-auto" />
                    </Link>
                </div>
            </header>

            {/* Centered card */}
            <div className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="w-full max-w-md bg-white border border-[#C2E8DB] rounded-2xl shadow-[0_8px_40px_rgba(0,104,37,0.10)] overflow-hidden">
                    {children}
                </div>
            </div>

        </div>
    )
}
