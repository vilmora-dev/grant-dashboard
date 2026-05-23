import { Head, useForm } from '@inertiajs/react'
import GuestLayout from '../../Layouts/GuestLayout'

export default function Login({ status }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    })

    const submit = (e) => {
        e.preventDefault()
        post(route('login'), {
            onFinish: () => reset('password'),
        })
    }

    return (
        <GuestLayout>
            <Head title="Log in" />

            <div className="px-8 py-8">

                {/* Card header */}
                <div className="mb-7">
                    <h1 className="font-serif font-bold text-[22px] text-[#233B22]">Welcome back</h1>
                    <p className="font-mono text-[12px] text-[#5D5961] mt-1">Sign in to your grants dashboard.</p>
                </div>

                {status && (
                    <div className="mb-5 rounded-lg border border-[#006825]/30 bg-[#006825]/8 px-4 py-3">
                        <p className="font-mono text-[12px] text-[#006825]">{status}</p>
                    </div>
                )}

                <form onSubmit={submit} className="space-y-5">
                    <Field label="Email" error={errors.email}>
                        <input
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            onChange={e => setData('email', e.target.value)}
                            autoComplete="username"
                            autoFocus
                            required
                            className={inputCls(errors.email)}
                        />
                    </Field>

                    <Field label="Password" error={errors.password}>
                        <input
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            onChange={e => setData('password', e.target.value)}
                            autoComplete="current-password"
                            required
                            className={inputCls(errors.password)}
                        />
                    </Field>

                    {/* Remember me */}
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            name="remember"
                            checked={data.remember}
                            onChange={e => setData('remember', e.target.checked)}
                            className="w-4 h-4 rounded border-[#C2E8DB] text-[#006825] bg-[#C8EFE2]
                                       focus:ring-[#006825] focus:ring-offset-0 transition-colors"
                        />
                        <span className="font-sans text-[13px] text-[#5D5961]">Remember me</span>
                    </label>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                        <button
                            type="submit"
                            disabled={processing}
                            className="ml-auto bg-[#006825] hover:bg-[#005a1f] disabled:opacity-60 text-white font-sans text-[13px]
                                       rounded-lg px-6 py-2.5 transition-colors outline-none
                                       focus:shadow-[0_0_0_3px_rgba(0,104,37,0.25)] flex items-center gap-2"
                        >
                            {processing && (
                                <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                </svg>
                            )}
                            Log in
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
            <label className="block font-mono text-[11px] uppercase tracking-widest text-[#5D5961] mb-1.5">
                {label}
            </label>
            {children}
            {error && <p className="mt-1.5 font-mono text-[11px] text-[#F5601D]">{error}</p>}
        </div>
    )
}

function inputCls(hasError) {
    return `w-full bg-white border rounded-lg px-3 py-2.5 text-[13px] text-[#233B22] font-sans
            placeholder-[#8A898C] outline-none transition-shadow
            focus:border-[#006825] focus:shadow-[0_0_0_3px_rgba(0,104,37,0.12)]
            ${hasError ? 'border-[#F5601D]' : 'border-[#C2E8DB]'}`
}
