import { useState, useEffect, useRef } from 'react'
import { usePage } from '@inertiajs/react'
import AppLayout from '@/Layouts/AppLayout'
import { UserPlus, Copy, Check, X, ShieldCheck, User } from 'lucide-react'

// Helpers

const ADJECTIVES = ['swift','calm','bold','bright','keen','warm','clear','fair','sage','neat']
const NOUNS      = ['river','cedar','ridge','stone','grove','creek','field','trail','peak','bay']

function generateTempPassword() {
    const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
    const num  = String(Math.floor(1000 + Math.random() * 9000))
    return `${adj}-${noun}-${num}`
}

async function apiCall(method, url, body) {
    const meta = document.querySelector('meta[name="csrf-token"]')
    const res  = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Accept':       'application/json',
            'X-CSRF-TOKEN': meta?.content ?? '',
        },
        body: body ? JSON.stringify(body) : undefined,
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message ?? json.error ?? `HTTP ${res.status}`)
    return json
}

function fmtDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Sub-components

function RoleBadge({ role }) {
    return role === 'full'
        ? <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border bg-[#D4D9FF]/60 border-[#D4D9FF] text-[#072F98]">
              <ShieldCheck size={9} /> Full
          </span>
        : <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border bg-[#C8EFE2] border-[#C2E8DB] text-[#006825]">
              <User size={9} /> Standard
          </span>
}

function StatusDot({ active }) {
    return (
        <span className="flex items-center gap-1.5 font-mono text-[11px]">
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-[#006825]' : 'bg-[#F5601D]/50'}`} />
            <span className={active ? 'text-[#006825]' : 'text-[#F5601D]/70'}>{active ? 'Active' : 'Inactive'}</span>
        </span>
    )
}

function CopyButton({ text, label = 'Copy' }) {
    const [copied, setCopied] = useState(false)
    const copy = async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }
    return (
        <button
            type="button"
            onClick={copy}
            className="flex items-center gap-1 px-2 py-1 rounded border bg-[#C8EFE2] border-[#006825]/50
                       text-[#006825] hover:text-[#233B22] font-mono text-[10px] transition-colors mr-3"
        >
            {copied ? <Check size={10} className="text-[#006825]" /> : <Copy size={10} />}
            {copied ? 'Copied!' : label}
        </button>
    )
}

function ErrorBanner({ message }) {
    if (!message) return null
    return (
        <div className="flex items-center gap-2 bg-[#d93050]/8 border border-[#d93050]/20 text-[#d93050]
                        rounded-lg px-3 py-2 text-[12px] font-sans mb-4">
            <X size={13} /> {message}
        </div>
    )
}

// Create panel

function CreatePanel({ onCreated, onClose }) {
    const [form, setForm]     = useState({
        name:     '',
        email:    '',
        password: generateTempPassword(),
        role:     'standard',
    })
    const [busy, setBusy]     = useState(false)
    const [err,  setErr]      = useState(null)
    const [done, setDone]     = useState(null)   // { user, temp_password }

    const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }))

    const emailTemplate = done
        ? `Subject: Your Delta Rising Foundation Grants dashboard access\n\nHi ${done.user.name},\n\nYour account has been created on the grants dashboard.\n\n  Login:    https://${window.location.host}/login\n  Email:    ${done.user.email}\n  Password: ${done.temp_password}\n\nYou will be prompted to set a new password on first login.\n\n— ${window.location.host}`
        : ''

    const [emailBlurred, setEmailBlurred] = useState(false)
    const emailDomain   = form.email.includes('@') ? form.email.split('@')[1] : ''
    const showDomainWarn = emailBlurred && emailDomain && emailDomain !== 'deltarisingfoundation.org'

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
            setErr('All fields are required.'); return
        }
        setBusy(true); setErr(null)
        try {
            const res = await apiCall('POST', '/api/team', form)
            setDone(res)
            onCreated(res.user)
        } catch (ex) { setErr(ex.message) }
        finally     { setBusy(false) }
    }

    if (done) return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 bg-[#006825]/10 border border-[#006825]/25 text-[#006825] rounded-lg px-3 py-2 text-[12px] font-sans">
                <Check size={13} /> Account created for <strong>{done.user.name}</strong>
            </div>

            {/* Temp password copy */}
            <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#5D5961] mb-1.5">Temporary password</p>
                <div className="flex items-center gap-2 bg-[#C8EFE2] border border-[#C2E8DB] rounded-lg px-3 py-2">
                    <span className="font-mono text-[13px] text-[#233B22] flex-1 select-all">{done.temp_password}</span>
                    <CopyButton text={done.temp_password} label="Copy" />
                </div>
                <p className="font-mono text-[10px] text-[#5D5961] mt-1">This is shown once — copy it now.</p>
            </div>

            {/* Email template */}
            <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[#5D5961] mb-1.5">Invite email template</p>
                <div className="relative">
                    <textarea
                        readOnly
                        value={emailTemplate}
                        rows={9}
                        className="w-full bg-[#C8EFE2] border border-[#C2E8DB] rounded-lg px-3 py-2 text-[11px]
                                   font-mono text-[#233B22] resize-none outline-none select-all"
                    />
                    <div className="absolute top-2 right-2">
                        <CopyButton text={emailTemplate} label="Copy email" />
                    </div>
                </div>
            </div>

            <div className="flex gap-2 pt-1">
                <button
                    onClick={() => { setDone(null); setForm({ name: '', email: '', password: generateTempPassword(), role: 'standard' }) }}
                    className="px-4 py-2 rounded-lg border bg-white border-[#C2E8DB] text-[#5D5961]
                               hover:text-[#233B22] font-mono text-[11px] transition-colors"
                >
                    Add another
                </button>
                <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-[#006825] hover:bg-[#005a1f] text-white font-mono text-[11px] transition-colors"
                >
                    Done
                </button>
            </div>
        </div>
    )

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <ErrorBanner message={err} />

            <FormField label="Full name">
                <Input value={form.name} onChange={set('name')} placeholder="Jane Smith" autoFocus />
            </FormField>

            <FormField label="Email address">
                <input
                    type="email"
                    value={form.email}
                    onChange={e => { set('email')(e.target.value); setEmailBlurred(false) }}
                    onBlur={() => setEmailBlurred(true)}
                    placeholder="jane@deltarisingfoundation.org"
                    className={inputCls}
                />
                {showDomainWarn && (
                    <p className="mt-1 font-mono text-[10px] text-[#f59e0b]">
                        ⚠ This email is not a @deltarisingfoundation.org address
                    </p>
                )}
            </FormField>

            <FormField label="Role">
                <select
                    value={form.role}
                    onChange={e => set('role')(e.target.value)}
                    className={selectCls}
                >
                    <option value="standard">Standard — grants dashboard only</option>
                    <option value="full">Full — includes settings &amp; team pages</option>
                </select>
            </FormField>

            <FormField label="Temporary password" hint="shown to admin once — user must change on first login">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={form.password}
                        onChange={e => set('password')(e.target.value)}
                        className={`${inputCls} flex-1`}
                    />
                    <button
                        type="button"
                        onClick={() => set('password')(generateTempPassword())}
                        className="px-2.5 py-1.5 rounded-lg border bg-white border-[#C2E8DB]
                                   text-[#5D5961] hover:text-[#233B22] font-mono text-[10px] whitespace-nowrap transition-colors"
                    >
                        Regenerate
                    </button>
                </div>
            </FormField>

            <div className="flex items-center gap-2 pt-1">
                <button
                    type="submit"
                    disabled={busy}
                    className="bg-[#006825] hover:bg-[#005a1f] disabled:opacity-60 text-white font-sans
                               text-[13px] rounded-lg px-5 py-2 transition-colors"
                >
                    {busy ? 'Creating…' : 'Create account'}
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg border bg-white border-[#C2E8DB] text-[#5D5961]
                               hover:text-[#233B22] font-mono text-[11px] transition-colors"
                >
                    Cancel
                </button>
            </div>
        </form>
    )
}

// Edit row inline

function EditRow({ member, currentUserId, onSaved, onCancel }) {
    const [form,      setForm]      = useState({ name: member.name, role: member.role, is_active: member.is_active })
    const [busy,      setBusy]      = useState(false)
    const [err,       setErr]       = useState(null)
    const [showResetPw,   setShowResetPw]   = useState(false)
    const [resetPw,   setResetPw]   = useState(generateTempPassword())
    const [resetDone, setResetDone] = useState(null)   // { temp_password, name, email }
    const [resetting, setResetting] = useState(false)
    const isSelf = member.id === currentUserId

    const save = async () => {
        setBusy(true); setErr(null)
        try {
            const updated = await apiCall('PATCH', `/api/team/${member.id}`, form)
            onSaved(updated)
        } catch (ex) { setErr(ex.message) }
        finally     { setBusy(false) }
    }

    const doReset = async () => {
        setResetting(true); setErr(null)
        try {
            const res = await apiCall('POST', `/api/team/${member.id}/reset-password`, { password: resetPw })
            setResetDone(res)
        } catch (ex) { setErr(ex.message) }
        finally     { setResetting(false) }
    }

    const emailTemplate = resetDone
        ? `Subject: Your Delta Rising Foundation dashboard — password reset\n\nHi ${resetDone.name},\n\nYour password has been reset.\n\n  Login:    https://${window.location.host}/login\n  Email:    ${resetDone.email}\n  Password: ${resetDone.temp_password}\n\nYou will be prompted to set a new password on login.\n\n— ${window.location.host}`
        : ''

    return (
        <tr className="bg-[#C8EFE2]/40">
            <td className="px-3 py-2" colSpan={5}>
                <div className="flex flex-wrap items-end gap-3">
                    {err && <div className="w-full text-[11px] font-mono text-[#d93050]">{err}</div>}

                    <div className="flex flex-col gap-1">
                        <label className="font-mono text-[9px] uppercase tracking-wider text-[#5D5961]">Name</label>
                        <input
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            className={`${inputCls} w-48`}
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label className="font-mono text-[9px] uppercase tracking-wider text-[#5D5961]">Role</label>
                        <select
                            value={form.role}
                            onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                            disabled={isSelf}
                            className={`${selectCls} w-36 disabled:opacity-50`}
                        >
                            <option value="standard">Standard</option>
                            <option value="full">Full</option>
                        </select>
                    </div>

                    {!isSelf && (
                        <div className="flex flex-col gap-1">
                            <label className="font-mono text-[9px] uppercase tracking-wider text-[#5D5961]">Status</label>
                            <select
                                value={form.is_active ? '1' : '0'}
                                onChange={e => setForm(f => ({ ...f, is_active: e.target.value === '1' }))}
                                className={`${selectCls} w-28`}
                            >
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                            </select>
                        </div>
                    )}

                    <div className="flex gap-2 pb-0.5 ml-auto">
                        <button
                            type="button"
                            onClick={()=>setShowResetPw(!showResetPw)}
                            className={`px-3 py-1.5 rounded-lg disabled:opacity-60 text-white font-mono text-[11px] transition-colors
                                        ${showResetPw ? 'bg-[#d93050]/90' : 'bg-[#b50e2d]/90'}`}
                        >
                            {showResetPw ? 'Hide form' : 'Reset Password'}
                        </button>
                        <button
                            onClick={save}
                            disabled={busy}
                            className="px-3 py-1.5 rounded-lg bg-[#006825] hover:bg-[#005a1f] disabled:opacity-60
                                       text-white font-mono text-[11px] transition-colors"
                        >
                            {busy ? 'Saving…' : 'Save'}
                        </button>
                        <button
                            onClick={onCancel}
                            className="px-3 py-1.5 rounded-lg border bg-white border-[#C2E8DB]
                                       text-[#5D5961] hover:text-[#233B22] font-mono text-[11px] transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
                {/* Password reset section */}
                {showResetPw && (               
                    <div className="mt-3 pt-3 border-t border-[#C2E8DB]/60">
                        {!resetDone ? (
                            <div className="flex flex-wrap items-end gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="font-mono text-[9px] uppercase tracking-wider text-[#5D5961]">
                                        Reset password
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            value={resetPw}
                                            onChange={e => setResetPw(e.target.value)}
                                            className={`${inputCls} w-48`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setResetPw(generateTempPassword())}
                                            className="px-2 py-1.5 rounded-lg border bg-white border-[#C2E8DB]
                                                    text-[#5D5961] hover:text-[#233B22] font-mono text-[10px] whitespace-nowrap transition-colors"
                                        >
                                            Regenerate
                                        </button>
                                        <button
                                            type="button"
                                            onClick={doReset}
                                            disabled={resetting || !resetPw.trim()}
                                            className="px-3 py-1.5 rounded-lg bg-[#d93050]/90 hover:bg-[#d93050] disabled:opacity-50
                                                    text-white font-mono text-[11px] transition-colors"
                                        >
                                            {resetting ? 'Resetting…' : 'Reset'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={()=>setShowResetPw(false)}
                                            disabled={resetting || !resetPw.trim()}
                                            className="px-3 py-1.5 rounded-lg disabled:opacity-60 text-white font-mono text-[11px]
                                                transition-colors bg-[#006825] hover:bg-[#005a1f]"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                    <p className="font-mono text-[9px] text-[#5a9090]">
                                        User will be forced to change on next login
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-[11px] font-mono text-[#006825]">
                                    ✓ Password reset for {resetDone.name}
                                </div>
                                <div className="flex items-center gap-2 bg-white border border-[#C2E8DB] rounded-lg px-3 py-1.5">
                                    <span className="font-mono text-[12px] text-[#233B22] flex-1 select-all">{resetDone.temp_password}</span>
                                    <CopyButton text={resetDone.temp_password} label="Copy" />
                                </div>
                                <div className="relative">
                                    <textarea
                                        readOnly
                                        value={emailTemplate}
                                        rows={6}
                                        className="w-full bg-[#C8EFE2] border border-[#C2E8DB] rounded-lg px-3 py-2
                                                text-[10px] font-mono text-[#233B22] resize-none outline-none select-all"
                                    />
                                    <div className="absolute top-2 right-2">
                                        <CopyButton text={emailTemplate} label="Copy email" />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </td>
        </tr>
    )
}

// Main page

export default function TeamIndex() {
    const { auth }      = usePage().props
    const currentUserId = auth?.user?.id

    const [members,     setMembers]     = useState([])
    const [loading,     setLoading]     = useState(true)
    const [err,         setErr]         = useState(null)
    const [showCreate,  setShowCreate]  = useState(false)
    const [editingId,   setEditingId]   = useState(null)

    useEffect(() => {
        fetch('/api/team', { headers: { Accept: 'application/json' } })
            .then(r => {
                if (!r.ok) throw new Error(`HTTP ${r.status} — ${r.statusText}`)
                return r.json()
            })
            .then(data => {
                setMembers(Array.isArray(data) ? data : [])
                setLoading(false)
            })
            .catch(e => { setErr(e.message); setLoading(false) })
    }, [])

    const handleCreated = (user) => {
        setMembers(m => [...m, user].sort((a, b) => a.name.localeCompare(b.name)))
    }

    const handleSaved = (updated) => {
        setMembers(m => m.map(u => u.id === updated.id ? { ...u, ...updated } : u))
        setEditingId(null)
    }

    return (
        <AppLayout>
            <div className="max-w-5xl mx-auto">

                {/* Page header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="font-mono text-[15px] font-semibold text-[#233B22]">Team</h1>
                        <p className="font-sans text-[12px] text-[#5D5961] mt-0.5">
                            Manage who has access to the grants dashboard.
                        </p>
                    </div>
                    {!showCreate && (
                        <button
                            onClick={() => setShowCreate(true)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#006825] hover:bg-[#005a1f]
                                       text-white font-mono text-[12px] transition-colors"
                        >
                            <UserPlus size={14} />
                            Add member
                        </button>
                    )}
                </div>

                <ErrorBanner message={err} />

                {/* Create panel */}
                {showCreate && (
                    <div className="bg-white border border-[#C2E8DB] rounded-xl p-5 mb-6">
                        <p className="font-mono text-[11px] uppercase tracking-wider text-[#5D5961] mb-4">New team member</p>
                        <CreatePanel
                            onCreated={handleCreated}
                            onClose={() => setShowCreate(false)}
                        />
                    </div>
                )}

                {/* Member table */}
                <div className="bg-white border border-[#C2E8DB] rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center h-32 text-[#5D5961] font-mono text-[12px]">
                            Loading…
                        </div>
                    ) : members.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-[#5D5961] font-mono text-[12px]">
                            No team members yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#C2E8DB] bg-[#C8EFE2]">
                                    {['Name', 'Role', 'Status', 'Last login', ''].map(h => (
                                        <th key={h} className="px-3 py-2.5 font-mono text-[9px] uppercase tracking-wider text-[#5D5961]">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((m, i) => (
                                    editingId === m.id
                                        ? <EditRow
                                            key={m.id}
                                            member={m}
                                            currentUserId={currentUserId}
                                            onSaved={handleSaved}
                                            onCancel={() => setEditingId(null)}
                                          />
                                        : <tr
                                            key={m.id}
                                            className={`border-b border-[#C2E8DB] last:border-0 ${i % 2 === 0 ? '' : 'bg-[#C8EFE2]/20'}`}
                                          >
                                            <td className="px-3 py-2.5">
                                                <div className="font-sans text-[13px] text-[#233B22]">{m.name}</div>
                                                <div className="font-mono text-[10px] text-[#5D5961]">{m.email}</div>
                                            </td>
                                            <td className="px-3 py-2.5"><RoleBadge role={m.role} /></td>
                                            <td className="px-3 py-2.5"><StatusDot active={m.is_active} /></td>
                                            <td className="px-3 py-2.5 font-mono text-[11px] text-[#5D5961]">{fmtDate(m.last_login_at)}</td>
                                            <td className="px-3 py-2.5 text-right">
                                                <button
                                                    onClick={() => setEditingId(m.id)}
                                                    className="font-mono text-[10px] text-[#006825] hover:text-[#233B22] transition-colors"
                                                >
                                                    Edit
                                                </button>
                                            </td>
                                          </tr>
                                ))}
                            </tbody>
                        </table>
                        </div>
                    )}
                </div>

                {/* Role legend */}
                <div className="mt-4 grid gap-2 text-[11px] font-mono text-[#5D5961]">
                    <span><span className="text-[#072F98]"><b>Full</b>:</span>  grants + graphs + settings + team</span>
                    <span><span className="text-[#006825]"><b>Standard:</b></span>  grants dashboard only</span>
                </div>

            </div>
        </AppLayout>
    )
}

// Shared input styles

const inputCls = `bg-white border border-[#C2E8DB] rounded-lg px-2.5 py-1.5 text-[12px] font-sans
                  text-[#233B22] placeholder-[#8A898C] outline-none transition-shadow
                  focus:border-[#006825] focus:shadow-[0_0_0_2px_rgba(0,104,37,0.12)]`

const selectCls = `bg-white border border-[#C2E8DB] rounded-lg px-2.5 py-1.5 text-[12px] font-sans
                   text-[#233B22] outline-none transition-shadow
                   focus:border-[#006825] focus:shadow-[0_0_0_2px_rgba(0,104,37,0.12)]`

function FormField({ label, hint, children }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-2">
                <label className="font-mono text-[10px] uppercase tracking-wider text-[#5D5961]">{label}</label>
                {hint && <span className="font-mono text-[9px] text-[#8A898C]">{hint}</span>}
            </div>
            {children}
        </div>
    )
}

function Input({ value, onChange, placeholder, type = 'text', autoFocus = false }) {
    return (
        <input
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={inputCls}
        />
    )
}
