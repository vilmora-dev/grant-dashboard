import { useForm } from '@inertiajs/react'
import { useRef, useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'

export default function DeleteUserForm() {
    const [confirming, setConfirming] = useState(false)
    const passwordInput = useRef()

    const { data, setData, delete: destroy, processing, reset, errors, clearErrors } = useForm({
        password: '',
    })

    const deleteUser = (e) => {
        e.preventDefault()
        destroy(route('profile.destroy'), {
            preserveScroll: true,
            onSuccess: () => closeModal(),
            onError: () => passwordInput.current.focus(),
            onFinish: () => reset(),
        })
    }

    const closeModal = () => {
        setConfirming(false)
        clearErrors()
        reset()
    }

    useEffect(() => {
        if (confirming) {
            setTimeout(() => passwordInput.current?.focus(), 50)
        }
    }, [confirming])

    useEffect(() => {
        if (!confirming) return
        const handler = (e) => { if (e.key === 'Escape') closeModal() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [confirming])

    return (
        <section>
            <h2 className="font-serif font-semibold text-[16px] text-[#233B22] mb-1">Delete Account</h2>
            <p className="font-mono text-[12px] text-[#8A898C] mb-6">
                Once deleted, all your data will be permanently removed. Download anything you want to keep first.
            </p>

            <button
                onClick={() => setConfirming(true)}
                className="flex items-center gap-2 bg-[#F5601D]/10 hover:bg-[#F5601D]/20 border border-[#F5601D]/30
                           text-[#F5601D] font-sans text-[13px] rounded-lg px-4 py-2 transition-colors"
            >
                <AlertTriangle size={14} />
                Delete Account
            </button>

            {confirming && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#1B3829]/50 backdrop-blur-sm"
                    onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
                    <div className="w-full max-w-md bg-white rounded-2xl border border-[#C2E8DB] shadow-[0_24px_64px_rgba(0,104,37,0.15)] overflow-hidden">

                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-[#C8EFE2]">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#F5601D]/10 border border-[#F5601D]/20 flex items-center justify-center shrink-0">
                                    <AlertTriangle size={16} className="text-[#F5601D]" />
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-[15px] text-[#233B22]">Delete Account?</h3>
                                    <p className="font-mono text-[11px] text-[#8A898C] mt-0.5">This action cannot be undone.</p>
                                </div>
                            </div>
                            <button onClick={closeModal}
                                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-[#C8EFE2] border border-[#C2E8DB] text-[#8A898C] hover:text-[#233B22] transition-colors">
                                <X size={13} />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={deleteUser} className="px-6 py-5 space-y-4">
                            <p className="font-mono text-[12px] text-[#8A898C] leading-relaxed">
                                All your resources and data will be permanently deleted. Enter your password to confirm.
                            </p>

                            <div>
                                <label className="block font-mono text-[11px] uppercase tracking-widest text-[#8A898C] mb-1.5">
                                    Password
                                </label>
                                <input
                                    ref={passwordInput}
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    placeholder="Enter your password"
                                    className={`w-full bg-white border rounded-lg px-3 py-2.5 text-[13px] text-[#233B22] font-sans
                                                placeholder-[#8A898C] outline-none transition-shadow
                                                focus:border-[#006825] focus:shadow-[0_0_0_3px_rgba(0,104,37,0.12)]
                                                ${errors.password ? 'border-[#F5601D]' : 'border-[#C2E8DB]'}`}
                                />
                                {errors.password && (
                                    <p className="mt-1.5 font-mono text-[11px] text-[#F5601D]">{errors.password}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-1">
                                <button type="button" onClick={closeModal}
                                    className="font-sans text-[13px] text-[#8A898C] hover:text-[#233B22] bg-[#C8EFE2] border border-[#C2E8DB]
                                               rounded-lg px-4 py-2 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={processing}
                                    className="font-sans text-[13px] text-white bg-[#F5601D] hover:bg-[#d94f18] disabled:opacity-60
                                               rounded-lg px-4 py-2 transition-colors flex items-center gap-2">
                                    {processing && (
                                        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                        </svg>
                                    )}
                                    Delete Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </section>
    )
}
