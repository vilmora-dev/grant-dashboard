import axios from 'axios'

/**
 * Patch a grant's status fields.
 * Uses the API routes: PATCH /api/grants/{id} or PATCH /api/grants_gov/{id}
 */
export async function patchGrant(grant, changes) {
    const table  = grant._table   // 'grants' or 'grants_gov'
    const id     = grant.id
    const url    = table === 'grants_gov' ? `/api/grants_gov/${id}` : `/api/grants/${id}`

    const response = await axios.patch(url, changes, {
        headers: {
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
                          ?? window.csrfToken ?? '',
        },
    })
    return response.data
}

/**
 * Fetch the action log for a single grant.
 * Returns an array of log entries ordered newest-first.
 */
export async function fetchGrantLogs(grantId) {
    const response = await axios.get(`/api/grants/${grantId}/logs`)
    return response.data.logs   // [{ id, action, old_value, new_value, user_name, is_me, created_at }]
}
