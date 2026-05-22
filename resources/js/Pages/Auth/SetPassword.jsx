import { useState } from 'react'
import { Head, useForm } from '@inertiajs/react'
import GuestLayout from '../../Layouts/GuestLayout'
import { Eye, EyeOff, RefreshCw, Copy, Check } from 'lucide-react'

// Crypto password generator
// Uses window.crypto.getRandomValues — no external dependency, runs entirely
// in the browser. Produces passwords that browser managers will also accept.
function generateSecurePassword(length = 16) {
    const upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ'   // no I, O (ambiguous)
    const lower   = 'abcdefghjkmnpqrstuvwxyz'     // no i, l, o
    const digits  = '23456789'                     // no 0, 1
    const symbols = '!@#$%^&*-_=+'
    const all     = upper + lower + digits + symbols

    const array = new Uint32Array(length)
    window.crypto.getRandomValues(array)

    // Guarantee at least one of each class
    const pick = (charset) => {
        const idx = new Uint32Array(1)
        window.crypto.getRandomValues(idx)
        return charset[idx[0] % charset.length]
    }

    const required = [pick(upper), pick(lower), pick(digits), pick(symbols)]
    const rest = Array.from(array).slice(4).map(n => all[n % all.length])
    const combined = [...required, ...rest]

    // Fisher-Yates shuffle
    for (let i = combined.length - 1; i > 0; i--) {
        const j = new Uint32Array(1)
        window.crypto.getRandomValues(j)
        const swap = j[0] % (i + 1);
        [combined[i], combined[swap]] = [combined[swap], combined[i]]
    }
    return combined.join('')
}

// Main component
export default function SetPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
        password_confirmation: '',
    })

    const [showPw,       setShowPw]       = useState(false)
    const [showConfirm,  setShowConfirm]  = useState(false)
    const [copied,       setCopied]       = useState(false)

    const applyGenerated = () => {
        const pw = generateSecurePassword()
        setData(d => ({ ...d, password: pw, password_confirmation: pw }))
        setShowPw(true)       // reveal so user can see what was generated
        setShowConfirm(true)
        setCopied(false)
    }

    const copyPassword = async () => {
        if (!data.password) return
        await navigator.clipboard.writeText(data.password)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const submit = (e) => {
        e.preventDefault()
        post(route('password.set.update'), {
            onFinish: () => reset('password', 'password_confirmation'),
        })
    }

    // Strength indicator
    const strength = (() => {
        const pw = data.password
        if (!pw) return null
        if (pw.length < 8)  return { label: 'Too short', color: '#d93050', width: '20%' }
        if (pw.length < 10) return { label: 'Weak',      color: '#f59e0b', width: '40%' }
        const hasUpper   = /[A-Z]/.test(pw)
        const hasLower   = /[a-z]/.test(pw)
        const hasDigit   = /\d/.test(pw)
        const hasSymbol  = /[^A-Za-z0-9]/.test(pw)
        const score = [hasUpper, hasLower, hasDigit, hasSymbol].filter(Boolean).length
        if (pw.length >= 16 && score === 4) return { label: 'Strong',   color: '#3aaf6b', width: '100%' }
        if (pw.length >= 12 && score >= 3)  return { label: 'Good',     color: '#3aafa9', width: '75%' }
        return { label: 'Fair', color: '#f59e0b', width: '55%' }
    })()

    return (
        <GuestLayout>
            <Head title="Set your password" />

            <div className="px-8 py-8">

                {/* Header */}
                <div className="mb-7">
                    <h1 className="font-serif font-bold text-[22px] text-[#0d2b2b]">Set your password</h1>
                    <p className="font-mono text-[12px] text-[#5a9090] mt-1">
                        Choose a new password to continue to the dashboard.
                    </p>
                </div>

                {/* Info banner */}
                <div className="mb-5 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/8 px-4 py-3">
                    <p className="font-mono text-[12px] text-[#b45309]">
                        Your account was set up with a temporary password. Please choose a permanent one before continuing.
                    </p>
                </div>

                {/* Generate button */}
                <div className="mb-5 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={applyGenerated}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#3aafa9]
                                   bg-[#def2f1] text-[#2b6e6b] hover:bg-[#3aafa9] hover:text-white
                                   font-mono text-[11px] transition-colors"
                    >
                        <RefreshCw size={11} />
                        Generate secure password
                    </button>

                    {data.password && (
                        <button
                            type="button"
                            onClick={copyPassword}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#b2d8d8]
                                       bg-[#def2f1] text-[#5a9090] hover:text-[#0d2b2b]
                                       font-mono text-[11px] transition-colors"
                        >
                            {copied
                                ? <><Check size={11} className="text-[#3aaf6b]" /> Copied!</>
                                : <><Copy size={11} /> Copy</>
                            }
                        </button>
                    )}

                </div>

                <form onSubmit={submit} className="space-y-5">

                    {/* New password */}
                    <Field label="New Password" error={errors.password}>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPw ? 'text' : 'password'}
                                value={data.password}
                                onChange={e => setData('password', e.target.value)}
                                autoComplete="new-password"
                                autoFocus
                                required
                                placeholder="Min. 8 characters"
                                className={`${inputCls(errors.password)} pr-10`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPw(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a9090] hover:text-[#0d2b2b] transition-colors"
                                tabIndex={-1}
                            >
                                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>

                        {/* Strength bar */}
                        {strength && (
                            <div className="mt-2">
                                <div className="h-1 w-full bg-[#b2d8d8]/40 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{ width: strength.width, background: strength.color }}
                                    />
                                </div>
                                <p className="mt-1 font-mono text-[10px]" style={{ color: strength.color }}>
                                    {strength.label}
                                </p>
                            </div>
                        )}
                    </Field>

                    {/* Confirm password */}
                    <Field label="Confirm Password" error={errors.password_confirmation}>
                        <div className="relative">
                            <input
                                id="password_confirmation"
                                type={showConfirm ? 'text' : 'password'}
                                value={data.password_confirmation}
                                onChange={e => setData('password_confirmation', e.target.value)}
                                autoComplete="new-password"
                                required
                                placeholder="Repeat your new password"
                                className={`${inputCls(errors.password_confirmation)} pr-10`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#5a9090] hover:text-[#0d2b2b] transition-colors"
                                tabIndex={-1}
                            >
                                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                        </div>

                        {/* Match indicator */}
                        {data.password_confirmation && (
                            <p className={`mt-1 font-mono text-[10px] ${
                                data.password === data.password_confirmation
                                    ? 'text-[#3aaf6b]' : 'text-[#d93050]'
                            }`}>
                                {data.password === data.password_confirmation ? '✓ Passwords match' : '✗ Passwords do not match'}
                            </p>
                        )}
                    </Field>

                    <div className="flex items-center justify-end pt-1">
                        <button
                            type="submit"
                            disabled={processing}
                            className="bg-[#3aafa9] hover:bg-[#2b9e99] disabled:opacity-60 text-white font-sans text-[13px]
                                       rounded-lg px-6 py-2.5 transition-colors outline-none
                                       focus:shadow-[0_0_0_3px_rgba(58,175,169,0.25)] flex items-center gap-2"
                        >
                            {processing && (
                                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                </svg>
                            )}
                            Set password &amp; continue
                        </button>
                    </div>
                </form>

            </div>
        </GuestLayout>
    )
}

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block font-mono text-[11px] uppercase tracking-widest text-[#5a9090] mb-1.5">
                {label}
            </label>
            {children}
            {error && <p className="mt-1.5 font-mono text-[11px] text-[#d93050]">{error}</p>}
        </div>
    )
}

function inputCls(hasError) {
    return `w-full bg-[#def2f1] border rounded-lg px-3 py-2.5 text-[13px] text-[#0d2b2b] font-sans
            placeholder-[#5a9090] outline-none transition-shadow
            focus:border-[#3aafa9] focus:shadow-[0_0_0_3px_rgba(58,175,169,0.12)]
            ${hasError ? 'border-[#d93050]' : 'border-[#b2d8d8]'}`
}
