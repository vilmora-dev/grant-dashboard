import { Transition } from '@headlessui/react'
import { useForm } from '@inertiajs/react'
import { useRef } from 'react'

export default function UpdatePasswordForm() {
    const passwordInput        = useRef()
    const currentPasswordInput = useRef()

    const { data, setData, errors, put, reset, processing, recentlySuccessful } = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    })

    const updatePassword = (e) => {
        e.preventDefault()
        put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => reset(),
            onError: (errs) => {
                if (errs.password) {
                    reset('password', 'password_confirmation')
                    passwordInput.current.focus()
                }
                if (errs.current_password) {
                    reset('current_password')
                    currentPasswordInput.current.focus()
                }
            },
        })
    }

    return (
        <section>
            <h2 className="font-serif font-semibold text-[16px] text-[#0d2b2b] mb-1">Update Password</h2>
            <p className="font-mono text-[12px] text-[#5a9090] mb-6">Use a long, random password to stay secure.</p>

            <form onSubmit={updatePassword} className="space-y-5">
                <Field label="Current Password" error={errors.current_password}>
                    <input
                        id="current_password"
                        ref={currentPasswordInput}
                        type="password"
                        value={data.current_password}
                        onChange={e => setData('current_password', e.target.value)}
                        autoComplete="current-password"
                        className={inputCls(errors.current_password)}
                    />
                </Field>

                <Field label="New Password" error={errors.password}>
                    <input
                        id="password"
                        ref={passwordInput}
                        type="password"
                        value={data.password}
                        onChange={e => setData('password', e.target.value)}
                        autoComplete="new-password"
                        className={inputCls(errors.password)}
                    />
                </Field>

                <Field label="Confirm Password" error={errors.password_confirmation}>
                    <input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        onChange={e => setData('password_confirmation', e.target.value)}
                        autoComplete="new-password"
                        className={inputCls(errors.password_confirmation)}
                    />
                </Field>

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
                        <span className="font-mono text-[12px] text-[#3aaf6b]">Saved.</span>
                    </Transition>
                </div>
            </form>
        </section>
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
    return `w-full bg-[#def2f1] border rounded-lg px-3 py-2 text-[13px] text-[#0d2b2b] font-sans
            placeholder-[#5a9090] outline-none transition-shadow
            focus:border-[#3aafa9] focus:shadow-[0_0_0_3px_rgba(58,175,169,0.12)]
            ${hasError ? 'border-[#d93050]' : 'border-[#b2d8d8]'}`
}

function SaveButton({ children, disabled }) {
    return (
        <button
            type="submit"
            disabled={disabled}
            className="bg-[#3aafa9] hover:bg-[#2b9e99] disabled:opacity-60 text-white font-sans text-[13px]
                       rounded-lg px-5 py-2 transition-colors outline-none
                       focus:shadow-[0_0_0_3px_rgba(58,175,169,0.25)]"
        >
            {children}
        </button>
    )
}
