import { Transition } from '@headlessui/react'
import { Link, useForm, usePage } from '@inertiajs/react'

export default function UpdateProfileInformationForm({ mustVerifyEmail, status }) {
    const user = usePage().props.auth.user

    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
    })

    const submit = (e) => {
        e.preventDefault()
        patch(route('profile.update'))
    }

    return (
        <section>
            <h2 className="font-serif font-semibold text-[16px] text-[#233B22] mb-1">Profile Information</h2>
            <p className="font-mono text-[12px] text-[#8A898C] mb-6">Update your name and email address.</p>

            <form onSubmit={submit} className="space-y-5">
                <Field label="Name" error={errors.name}>
                    <input
                        id="name"
                        type="text"
                        value={data.name}
                        onChange={e => setData('name', e.target.value)}
                        required
                        autoComplete="name"
                        className={inputCls(errors.name)}
                    />
                </Field>

                <Field label="Email" error={errors.email}>
                    <input
                        id="email"
                        type="email"
                        value={data.email}
                        onChange={e => setData('email', e.target.value)}
                        required
                        autoComplete="username"
                        className={inputCls(errors.email)}
                    />
                </Field>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div className="rounded-lg border border-[#FF7900]/30 bg-[#FF7900]/5 px-4 py-3">
                        <p className="font-mono text-[12px] text-[#FF7900]">
                            Your email is unverified.{' '}
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="underline hover:text-[#233B22] transition-colors"
                            >
                                Resend verification email
                            </Link>
                        </p>
                        {status === 'verification-link-sent' && (
                            <p className="mt-1 font-mono text-[12px] text-[#006825]">Verification link sent!</p>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4 pt-1">
                    <SaveButton disabled={processing}>Save</SaveButton>
                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out duration-200"
                        enterFrom="opacity-0 translate-y-1"
                        enterTo="opacity-100 translate-y-0"
                        leave="transition ease-in-out duration-150"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <span className="font-mono text-[12px] text-[#006825]">Saved.</span>
                    </Transition>
                </div>
            </form>
        </section>
    )
}

function Field({ label, error, children }) {
    return (
        <div>
            <label className="block font-mono text-[11px] uppercase tracking-widest text-[#8A898C] mb-1.5">
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

function SaveButton({ children, disabled }) {
    return (
        <button
            type="submit"
            disabled={disabled}
            className="bg-[#006825] hover:bg-[#005a1f] disabled:opacity-60 text-white font-sans text-[13px]
                       rounded-lg px-5 py-2 transition-colors outline-none
                       focus:shadow-[0_0_0_3px_rgba(0,104,37,0.25)]"
        >
            {children}
        </button>
    )
}
