import { useState, useEffect, useCallback, useRef } from 'react'
import AppLayout from '@/Layouts/AppLayout'
import {
    AreaChart, Area,
    BarChart, Bar,
    PieChart, Pie, Cell,
    FunnelChart, Funnel, LabelList,
    ResponsiveContainer,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'
import { RefreshCw, Download } from 'lucide-react'

// ── Palette — matches the app's teal/green theme ──────────────────────────
const C = {
    teal:    '#3aafa9',
    tealDim: '#b2d8d8',
    green:   '#3aaf6b',
    red:     '#d93050',
    amber:   '#f59e0b',
    navy:    '#0d2b2b',
    muted:   '#5a9090',
    bg:      '#def2f1',
    border:  '#b2d8d8',
}

const SOURCE_COLORS = {
    grants_gov:       '#3aafa9',
    ca_portal:        '#3aaf6b',
    simpler_grants:   '#2b6e6b',
    fema:             '#f59e0b',
    terra_viva:       '#6366f1',
    federal_register: '#8b5cf6',
    web:              '#94a3b8',
}
const sourceColor = (s) => SOURCE_COLORS[s] ?? '#94a3b8'

const DAY_OPTIONS = [7, 14, 30, 60, 90]

// ── Small helpers ─────────────────────────────────────────────────────────
function Card({ title, hint, children, className = '' }) {
    return (
        <div className={`bg-white border border-[#b2d8d8] rounded-xl p-4 flex flex-col gap-3 ${className}`}>
            <div className="flex items-baseline gap-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#5a9090]">{title}</span>
                {hint && <span className="font-sans text-[10px] text-[#5a9090]/70">{hint}</span>}
            </div>
            {children}
        </div>
    )
}

function Stat({ label, value, color = C.teal }) {
    return (
        <div className="flex flex-col items-center bg-[#def2f1] border border-[#b2d8d8] rounded-lg py-2 px-3 min-w-[64px]">
            <span className="font-mono font-semibold text-[18px] leading-none" style={{ color }}>{value ?? '—'}</span>
            <span className="font-mono text-[9px] uppercase tracking-wide text-[#5a9090] mt-1">{label}</span>
        </div>
    )
}

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-white border border-[#b2d8d8] rounded-lg shadow-sm px-3 py-2 text-[12px] font-sans">
            <p className="font-mono text-[#5a9090] mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color ?? C.teal }}>
                    {p.name ?? p.dataKey}: <strong>{p.value}</strong>
                </p>
            ))}
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────
export default function StatsIndex() {
    const [days,        setDays]        = useState(30)
    const [data,        setData]        = useState(null)
    const [loading,     setLoading]     = useState(true)
    const [error,       setError]       = useState(null)
    const [autoRefresh, setAutoRefresh] = useState(false)
    const intervalRef = useRef(null)
    const printableRef = useRef(null)

    const fetchStats = useCallback(async () => {
        setLoading(true); setError(null)
        try {
            const res = await fetch(`/api/stats?days=${days}`)
            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            setData(await res.json())
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }, [days])

    // Fetch on mount + when days changes
    useEffect(() => { fetchStats() }, [fetchStats])

    // Auto-refresh every 60 s when toggled on
    useEffect(() => {
        if (autoRefresh) {
            intervalRef.current = setInterval(fetchStats, 60_000)
        } else {
            clearInterval(intervalRef.current)
        }
        return () => clearInterval(intervalRef.current)
    }, [autoRefresh, fetchStats])

    // ── PNG export via html2canvas shim — just print the section ──────────
    const handleExport = () => {
        if (printableRef.current) {
            printableRef.current.id = 'printable-content';  // Activate print ID
            window.print();
            // Cleanup after print (use afterprint event)
            setTimeout(() => {
                if (printableRef.current) {  // Safe check
                    printableRef.current.id = '';
                }
            }, 1000);
        }
    };

    const s = data?.summary ?? {}

    return (
        <AppLayout>
            {/* ── Toolbar ───────────────────────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                    <h1 className="font-mono text-[15px] font-semibold text-[#0d2b2b]">Pipeline Graphs</h1>
                    <p className="font-sans text-[12px] text-[#5a9090] mt-0.5">
                        Scraper performance &amp; grant pipeline health
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Day-range pills */}
                    <div className="flex gap-1 bg-[#def2f1] border border-[#b2d8d8] rounded-lg p-0.5">
                        {DAY_OPTIONS.map(d => (
                            <button
                                key={d}
                                onClick={() => setDays(d)}
                                className={`px-2.5 py-1 rounded-md font-mono text-[11px] transition-colors ${
                                    days === d
                                        ? 'bg-[#3aafa9] text-white'
                                        : 'text-[#5a9090] hover:text-[#0d2b2b]'
                                }`}
                            >{d}d</button>
                        ))}
                    </div>

                    {/* Auto-refresh toggle */}
                    <button
                        onClick={() => setAutoRefresh(r => !r)}
                        title="Auto-refresh every 60 s"
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border font-mono text-[11px] transition-colors ${
                            autoRefresh
                                ? 'bg-[#3aaf6b] border-[#3aaf6b] text-white'
                                : 'bg-[#def2f1] border-[#b2d8d8] text-[#5a9090] hover:text-[#0d2b2b]'
                        }`}
                    >
                        <RefreshCw size={12} className={autoRefresh ? 'animate-spin' : ''} />
                        Live
                    </button>

                    {/* Manual refresh */}
                    <button
                        onClick={fetchStats}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-[#def2f1] border-[#b2d8d8] text-[#5a9090] hover:text-[#0d2b2b] font-mono text-[11px] disabled:opacity-50 transition-colors"
                    >
                        <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>

                    {/* Export */}
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border bg-[#def2f1] border-[#b2d8d8] text-[#5a9090] hover:text-[#0d2b2b] font-mono text-[11px] transition-colors"
                    >
                        <Download size={12} />
                        Export
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 px-3 py-2 bg-[#d93050]/8 border border-[#d93050]/20 text-[#d93050] rounded-lg text-[12px] font-sans">
                    Failed to load stats: {error}
                </div>
            )}

            <div ref={printableRef}>

            {/* ── Summary row ───────────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2 mb-6">
                <Stat label="Scraped" value={s.total_in_window} />
                <Stat label="Starred" value={s.starred}  color={C.amber} />
                <Stat label="Applied" value={s.applied}  color={C.green} />
                <Stat label="Avg Score" value={s.avg_score != null ? Math.round(s.avg_score) : null} color={C.teal} />
                <Stat label="Window" value={`${s.days ?? days}d`} color={C.muted} />
            </div>

            {loading && !data && (
                <div className="flex items-center justify-center h-48 text-[#5a9090] font-mono text-[12px]">
                    Loading…
                </div>
            )}

            {data && (
                <div id="stats-export" className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                    {/* ── 1. Grants over time ───────────────────────────── */}
                    <Card title="Grants over time" hint={`daily — last ${days} days`} className="lg:col-span-2">
                        <ResponsiveContainer width="100%" height={200}>
                            <AreaChart data={data.timeline} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor={C.teal} stopOpacity={0.18} />
                                        <stop offset="95%" stopColor={C.teal} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.muted, fontFamily: 'monospace' }}
                                       tickFormatter={d => d?.slice(5)} />
                                <YAxis tick={{ fontSize: 10, fill: C.muted, fontFamily: 'monospace' }} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="count" name="Grants"
                                      stroke={C.teal} strokeWidth={2}
                                      fill="url(#tealGrad)" dot={false} activeDot={{ r: 4 }} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* ── 2. Score distribution ─────────────────────────── */}
                    <Card title="Score distribution" hint="relevance_score buckets">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={data.scoreDist} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                                <XAxis dataKey="bucket" tick={{ fontSize: 9, fill: C.muted, fontFamily: 'monospace' }} />
                                <YAxis tick={{ fontSize: 10, fill: C.muted, fontFamily: 'monospace' }} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="Grants" radius={[3, 3, 0, 0]}>
                                    {data.scoreDist.map((entry, i) => {
                                        const bucket = parseInt(entry.bucket)
                                        const color = bucket >= 70 ? C.green : bucket >= 40 ? C.teal : C.tealDim
                                        return <Cell key={i} fill={color} />
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* ── 3. Pipeline funnel ────────────────────────────── */}
                    <Card title="Pipeline funnel" hint="scraped → kept → starred → applied">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={data.funnel} layout="vertical"
                                      margin={{ top: 4, right: 24, left: 8, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.border} horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 10, fill: C.muted, fontFamily: 'monospace' }} allowDecimals={false} />
                                <YAxis type="category" dataKey="stage"
                                       tick={{ fontSize: 11, fill: C.navy, fontFamily: 'monospace' }} width={60} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="Count" radius={[0, 3, 3, 0]}>
                                    {data.funnel.map((entry, i) => {
                                        const colors = [C.tealDim, C.teal, C.amber, C.green]
                                        return <Cell key={i} fill={colors[i] ?? C.teal} />
                                    })}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                    {/* ── 4. Grants by source (donut) ───────────────────── */}
                    <Card title="By source" hint="grant origin breakdown">
                        <div className="flex items-center gap-4">
                            <ResponsiveContainer width="50%" height={180}>
                                <PieChart>
                                    <Pie data={data.bySource} dataKey="count" nameKey="source"
                                         cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                                         paddingAngle={2}>
                                        {data.bySource.map((entry, i) => (
                                            <Cell key={i} fill={sourceColor(entry.source)} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            {/* Legend */}
                            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                                {data.bySource.map((entry, i) => (
                                    <div key={i} className="flex items-center gap-2 min-w-0">
                                        <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                                              style={{ background: sourceColor(entry.source) }} />
                                        <span className="font-mono text-[10px] text-[#2b6e6b] truncate">{entry.source}</span>
                                        <span className="font-mono text-[10px] text-[#5a9090] ml-auto">{entry.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Card>

                    {/* ── 5. Run history sparkline ──────────────────────── */}
                    <Card title="Run history" hint="last 20 scrape sessions">
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={[...data.runHistory].reverse()}
                                      margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                                <XAxis dataKey="run_at"
                                       tick={{ fontSize: 9, fill: C.muted, fontFamily: 'monospace' }}
                                       tickFormatter={d => d?.slice(5, 10)} />
                                <YAxis tick={{ fontSize: 10, fill: C.muted, fontFamily: 'monospace' }} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="total_api_hits"  name="API hits"    fill={C.tealDim} radius={[2,2,0,0]} stackId="a" />
                                <Bar dataKey="newly_processed" name="New grants"  fill={C.teal}    radius={[2,2,0,0]} stackId="b" />
                                <Bar dataKey="cash_grants_found" name="Cash found" fill={C.green}  radius={[2,2,0,0]} stackId="b" />
                                <Legend
                                    iconType="square" iconSize={8}
                                    wrapperStyle={{ fontSize: '10px', fontFamily: 'monospace', color: C.muted }}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>

                </div>
            )}
            </div>
        </AppLayout>
    )
}
