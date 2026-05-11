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

    // Focus password input when modal opens
    useEffect(() => {
        if (confirming) {
            setTimeout(() => passwordInput.current?.focus(), 50)
        }
    }, [confirming])

    // Close on Escape
    useEffect(() => {
        if (!confirming) return
        const handler = (e) => { if (e.key === 'Escape') closeModal() }
        document.addEventListener('keydown', handler)
        return () => document.removeEventListener('keydown', handler)
    }, [confirming])

    return (
        <section>
            <h2 className="font-serif font-semibold text-[16px] text-[#0d2b2b] mb-1">Delete Account</h2>
            <p className="font-mono text-[12px] text-[#5a9090] mb-6">
                Once deleted, all your data will be permanently removed. Download anything you want to keep first.
            </p>

            <button
                onClick={() => setConfirming(true)}
                className="flex items-center gap-2 bg-[#d93050]/10 hover:bg-[#d93050]/20 border border-[#d93050]/30
                           text-[#d93050] font-sans text-[13px] rounded-lg px-4 py-2 transition-colors"
            >
                <AlertTriangle size={14} />
                Delete Account
            </button>

            {/* Modal overlay */}
            {confirming && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d2b2b]/40 backdrop-blur-sm"
                    onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
                    <div className="w-full max-w-md bg-white rounded-2xl border border-[#b2d8d8] shadow-[0_24px_64px_rgba(13,43,43,0.18)] overflow-hidden">

                        {/* Header */}
                        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-[#e8f4f4]">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-[#d93050]/10 border border-[#d93050]/20 flex items-center justify-center shrink-0">
                                    <AlertTriangle size={16} className="text-[#d93050]" />
                                </div>
                                <div>
                                    <h3 className="font-serif font-bold text-[15px] text-[#0d2b2b]">Delete Account?</h3>
                                    <p className="font-mono text-[11px] text-[#5a9090] mt-0.5">This action cannot be undone.</p>
                                </div>
                            </div>
                            <button onClick={closeModal}
                                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-[#def2f1] border border-[#b2d8d8] text-[#5a9090] hover:text-[#0d2b2b] transition-colors">
                                <X size={13} />
                            </button>
                        </div>

                        {/* Body */}
                        <form onSubmit={deleteUser} className="px-6 py-5 space-y-4">
                            <p className="font-mono text-[12px] text-[#5a9090] leading-relaxed">
                                All your resources and data will be permanently deleted. Enter your password to confirm.
                            </p>

                            <div>
                                <label className="block font-mono text-[11px] uppercase tracking-widest text-[#5a9090] mb-1.5">
                                    Password
                                </label>
                                <input
                                    ref={passwordInput}
                                    type="password"
                                    value={data.password}
                                    onChange={e => setData('password', e.target.value)}
                                    placeholder="Enter your password"
                                    className={`w-full bg-[#def2f1] border rounded-lg px-3 py-2 text-[13px] text-[#0d2b2b] font-sans
                                                placeholder-[#5a9090] outline-none transition-shadow
                                                focus:border-[#3aafa9] focus:shadow-[0_0_0_3px_rgba(58,175,169,0.12)]
                                                ${errors.password ? 'border-[#d93050]' : 'border-[#b2d8d8]'}`}
                                />
                                {errors.password && (
                                    <p className="mt-1.5 font-mono text-[11px] text-[#d93050]">{errors.password}</p>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-1">
                                <button type="button" onClick={closeModal}
                                    className="font-sans text-[13px] text-[#5a9090] hover:text-[#0d2b2b] bg-[#def2f1] border border-[#b2d8d8]
                                               rounded-lg px-4 py-2 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={processing}
                                    className="font-sans text-[13px] text-white bg-[#d93050] hover:bg-[#c02040] disabled:opacity-60
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
