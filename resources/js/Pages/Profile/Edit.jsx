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
                        <h1 className="font-serif font-bold text-[22px] text-[#233B22] mb-1">Account</h1>
                        <p className="font-mono text-[12px] text-[#8A898C]">Manage your profile, password, and account settings.</p>
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
        <div className={`rounded-xl border p-6 ${danger ? 'border-[#F5601D]/20 bg-[#F5601D]/[0.03]' : 'border-[#C2E8DB] bg-white'}`}>
            {children}
        </div>
    )
}
