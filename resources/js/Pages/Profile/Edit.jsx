import { Head } from '@inertiajs/react'
import AppLayout from '../../Layouts/AppLayout'
import DeleteUserForm from './Partials/DeleteUserForm'
import UpdatePasswordForm from './Partials/UpdatePasswordForm'
import UpdateProfileInformationForm from './Partials/UpdateProfileInformationForm'

export default function Edit({ mustVerifyEmail, status }) {
    return (
        <>
            <Head title="Account" />
            <AppLayout>
                <div className="max-w-2xl mx-auto space-y-6 py-2">

                    <div>
                        <h1 className="font-serif font-bold text-[22px] text-[#0d2b2b] mb-1">Account</h1>
                        <p className="font-mono text-[12px] text-[#5a9090]">Manage your profile, password, and account settings.</p>
                    </div>

                    <Card>
                        <UpdateProfileInformationForm
                            mustVerifyEmail={mustVerifyEmail}
                            status={status}
                        />
                    </Card>

                    <Card>
                        <UpdatePasswordForm />
                    </Card>

                    <Card danger>
                        <DeleteUserForm />
                    </Card>

                </div>
            </AppLayout>
        </>
    )
}

function Card({ children, danger = false }) {
    return (
        <div className={`rounded-xl border p-6 ${danger ? 'border-[#d93050]/20 bg-[#d93050]/[0.03]' : 'border-[#b2d8d8] bg-white'}`}>
            {children}
        </div>
    )
}
