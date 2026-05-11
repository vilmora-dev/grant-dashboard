import axios from 'axios'

/**
 * Patch a grant's status fields.
 * Uses the Laravel routes: PATCH /grants/{id} or PATCH /grants-gov/{id}
 */
export async function patchGrant(grant, changes) {
    const table  = grant._table   // 'grants' or 'grants_gov'
    const id     = grant.id
    const url    = table === 'grants_gov' ? `/grants-gov/${id}` : `/grants/${id}`

    const response = await axios.patch(url, changes, {
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
                          ?? window.csrfToken ?? '',
        },
    })
    return response.data
}
