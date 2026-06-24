import AppLayout from '@/Layouts/AppLayout'
import { Sparkles } from 'lucide-react'

/**
 * ReleaseNotes/Index — static, hand-maintained changelog.
 *
 * `releases` comes straight from resources/data/release-notes.json via the
 * /release-notes route in web.php — newest entry first. There's no admin UI
 * or database table for this on purpose: add a new entry to that JSON file
 * each time something ships, in the same commit as the change itself.
 */
export default function ReleaseNotesIndex({ releases = [] }) {
    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto">

                {/* Page header */}
                <div className="mb-6">
                    <h1 className="font-mono text-[15px] font-semibold text-[#233B22]">Release Notes</h1>
                    <p className="font-sans text-[12px] text-[#5D5961] mt-0.5">
                        What's changed in the grants dashboard, most recent first.
                    </p>
                </div>

                {releases.length === 0 ? (
                    <p className="font-sans text-[13px] text-[#8A898C]">No release notes yet.</p>
                ) : (
                    <div className="flex flex-col gap-4">
                        {releases.map((release, i) => (
                            <ReleaseCard key={release.version} release={release} isLatest={i === 0} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    )
}

function ReleaseCard({ release, isLatest }) {
    return (
        <div className="bg-white border border-[#C2E8DB] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <span className="font-mono text-[13px] font-semibold text-[#233B22]">{release.version}</span>
                {isLatest && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border bg-[#D4D9FF]/60 border-[#D4D9FF] text-[#072F98]">
                        <Sparkles size={9} /> Latest
                    </span>
                )}
                <span className="font-mono text-[11px] text-[#8A898C] ml-auto">{fmtDate(release.date)}</span>
            </div>
            <ul className="flex flex-col gap-1.5">
                {release.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 font-sans text-[13px] text-[#233B22] leading-snug">
                        <span className="mt-[7px] w-1 h-1 rounded-full bg-[#006825] shrink-0" />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    )
}

function fmtDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
