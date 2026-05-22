import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Pagination — reusable for any grid or table in the app.
 *
 * Props:
 *   page        number   current page (1-based)
 *   totalPages  number   total number of pages
 *   totalItems  number   total matching records
 *   from        number   first item index on this page (1-based)
 *   to          number   last item index on this page
 *   setPage     fn(n)    called with the new page number
 */
export default function Pagination({ page, totalPages, totalItems, from, to, setPage }) {
    if (totalPages <= 1) return null
    
    function buildPageList() {
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1)
        }

        const visible = new Set([
            1,
            totalPages,
            page,
            page - 1,
            page - 2,
            page + 1,
            page + 2,
        ])

        const sorted = [...visible]
            .filter(p => p >= 1 && p <= totalPages)
            .sort((a, b) => a - b)

        // Insert null between non-contiguous numbers to render "…"
        const result = []
        for (let i = 0; i < sorted.length; i++) {
            if (i > 0 && sorted[i] - sorted[i - 1] > 1) result.push(null)
            result.push(sorted[i])
        }
        return result
    }

    const pageList = buildPageList()

    return (
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#C2E8DB]">

            {/* Range counter */}
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#8A898C]">
                <span className="text-[#233B22] font-medium">{from}–{to}</span>
                <span className="mx-1 text-[#C2E8DB]">/</span>
                {/* {totalItems.toLocaleString()} */}
            </span>

            {/* Page buttons */}
            <div className="flex items-center gap-1">
                <NavBtn onClick={() => setPage(page - 1)} disabled={page === 1}>
                    <ChevronLeft size={12} />
                </NavBtn>

                {pageList.map((p, i) =>
                    p === null ? (
                        <span key={`gap-${i}`}
                            className="font-mono text-[10px] text-[#8A898C] w-5 text-center select-none">
                            …
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => setPage(p)}
                            className={`w-7 h-7 rounded-md font-mono text-[11px] transition-all duration-150
                                ${p === page
                                    ? 'bg-[#006825] text-white font-semibold shadow-sm'
                                    : 'text-[#5D5961] hover:bg-[#C8EFE2] hover:text-[#233B22] border border-transparent hover:border-[#C2E8DB]'
                                }`}
                        >
                            {p}
                        </button>
                    )
                )}

                <NavBtn onClick={() => setPage(page + 1)} disabled={page === totalPages}>
                    <ChevronRight size={12} />
                </NavBtn>
            </div>
        </div>
    )
}

function NavBtn({ onClick, disabled, children }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-[#C2E8DB]
                text-[#5D5961] transition-all duration-150
                hover:bg-[#C8EFE2] hover:text-[#233B22] hover:border-[#C2E8DB]
                disabled:opacity-30 disabled:cursor-not-allowed
                disabled:hover:bg-transparent disabled:hover:border-[#C2E8DB] disabled:hover:text-[#5D5961]"
        >
            {children}
        </button>
    )
}
