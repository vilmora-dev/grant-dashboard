import { Head, Link, useForm } from '@inertiajs/react'
import GuestLayout from '../../Layouts/GuestLayout'

export default function Login({ status, canResetPassword }) {
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
                    <h1 className="font-serif font-bold text-[22px] text-[#0d2b2b]">Welcome back</h1>
                    <p className="font-mono text-[12px] text-[#5a9090] mt-1">Sign in to your grants dashboard.</p>
                </div>

                {status && (
                    <div className="mb-5 rounded-lg border border-[#3aaf6b]/30 bg-[#3aaf6b]/8 px-4 py-3">
                        <p className="font-mono text-[12px] text-[#3aaf6b]">{status}</p>
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
                            className="w-4 h-4 rounded border-[#b2d8d8] text-[#3aafa9] bg-[#def2f1]
                                       focus:ring-[#3aafa9] focus:ring-offset-0 transition-colors"
                        />
                        <span className="font-sans text-[13px] text-[#5a9090]">Remember me</span>
                    </label>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                        {canResetPassword && (
                            <Link
                                href={route('password.request')}
                                className="font-mono text-[12px] text-[#5a9090] hover:text-[#0d2b2b] underline transition-colors"
                            >
                                Forgot password?
                            </Link>
                        )}
                        <button
                            type="submit"
                            disabled={processing}
                            className="ml-auto bg-[#3aafa9] hover:bg-[#2b9e99] disabled:opacity-60 text-white font-sans text-[13px]
                                       rounded-lg px-6 py-2.5 transition-colors outline-none
                                       focus:shadow-[0_0_0_3px_rgba(58,175,169,0.25)] flex items-center gap-2"
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

                {/* Register link */}
                <div className="mt-6 pt-5 border-t border-[#e8f4f4] text-center">
                    <p className="font-mono text-[12px] text-[#5a9090]">
                        Don't have an account?{' '}
                        <Link href={route('register')} className="text-[#3aafa9] hover:text-[#2b6e6b] transition-colors">
                            Register
                        </Link>
                    </p>
                </div>

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
