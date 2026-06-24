<?php

namespace App\Http\Controllers;

use App\Models\GrantActionLog;
use App\Models\GrantUnified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GrantDataController extends Controller
{
    /**
     * GET /api/data
     */
    public function index(Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 500);

        $grants = GrantUnified::with('claimedBy:id,name')
            ->orderByDesc('scraped_at')
            ->limit($limit)
            ->get();

        return response()->json([
            'grants' => $grants,
            'status' => true,
        ]);
    }

    /**
     * PATCH /api/grants/{id}
     *
     * Validates the incoming fields, captures the before-values for the fields
     * that are actually changing, writes the update, then records one audit log
     * entry with truncated before/after snapshots for long text fields.
     */
    public function updateGrant(Request $request, int $id): JsonResponse
    {
        $grant = GrantUnified::findOrFail($id);

        $data = $request->validate([
            'applied'        => 'sometimes|boolean',
            'ignore'         => 'sometimes|boolean',
            'reviewed'       => 'sometimes|boolean',
            'starred'        => 'sometimes|boolean',
            'offers_cash'    => 'sometimes|boolean',
            'area_relevant'  => 'sometimes|boolean',
            'ai_analyzed'    => 'sometimes|boolean',
            'page_crawled'   => 'sometimes|boolean',
            'amount'         => 'sometimes|nullable|string',
            'deadline'       => 'sometimes|nullable|string',
            'notes'          => 'sometimes|nullable|string',
            'discard_reason' => 'sometimes|nullable|string',
        ]);

        if (empty($data)) {
            return response()->json(['error' => 'No fields to update'], 400);
        }

        // Snapshot only the fields that are about to change, before the update
        $oldValues = collect($data)
            ->mapWithKeys(fn ($_, string $key) => [$key => $grant->getAttribute($key)])
            ->all();

        $grant->update($data);

        // Write one immutable audit record per PATCH call.
        // Long text fields (notes, description, etc.) are truncated to 500 chars
        // — the full content already lives on the grants row.
        GrantActionLog::create([
            'grant_id'   => $grant->id,
            'user_id'    => $request->user()?->id,   // null-safe: covers system writes
            'action'     => GrantActionLog::resolveAction($data),
            'old_value'  => GrantActionLog::truncateForLog($oldValues),
            'new_value'  => GrantActionLog::truncateForLog($data),
            'ip_address' => $request->ip(),
            'user_agent' => substr($request->userAgent() ?? '', 0, 300),
            'created_at' => now(),
        ]);

        return response()->json($grant->fresh());
    }

    /**
     * POST /api/grants/{id}/claim
     *
     * Body: { "action": "claim" | "release" | "take_over" }
     *
     * "I'm working on this" tracking. Three behaviors:
     *  - claim:     succeeds only if the grant is currently unclaimed.
     *               Rejected with 409 if someone else already holds it.
     *  - release:   succeeds only if the requesting user is the current claimant.
     *  - take_over: succeeds unconditionally — deliberately reassigns the claim
     *               away from whoever currently holds it (including no one).
     *               This is the explicit "I know someone else has this" action,
     *               distinct from a plain claim so it never happens by accident.
     */
    public function claimGrant(Request $request, int $id): JsonResponse
    {
        $grant = GrantUnified::findOrFail($id);
        $user  = $request->user();

        $validated = $request->validate([
            'action' => 'required|in:claim,release,take_over',
        ]);
        $action = $validated['action'];

        $previousUserId = $grant->claimed_by_user_id;

        if ($action === 'claim') {
            if ($previousUserId !== null && $previousUserId !== $user->id) {
                $claimant = $grant->claimedBy;
                return response()->json([
                    'error'        => 'already_claimed',
                    'message'      => 'Already claimed by ' . ($claimant?->name ?? 'another user') . '.',
                    'claimed_by'   => $claimant?->only(['id', 'name']),
                ], 409);
            }

            if ($previousUserId === $user->id) {
                // Already claimed by the same user — no-op, nothing to log.
                return response()->json($grant->fresh()->load('claimedBy'));
            }

            $grant->update([
                'claimed_by_user_id' => $user->id,
                'claimed_at'         => now(),
            ]);
            $logAction = GrantActionLog::ACTION_CLAIMED;
            $oldValue  = ['claimed_by_user_id' => null];
            $newValue  = ['claimed_by_user_id' => $user->id, 'user_name' => $user->name];

        } elseif ($action === 'release') {
            if ($previousUserId !== $user->id) {
                return response()->json([
                    'error'   => 'not_claimant',
                    'message' => 'You can only release a grant you currently have claimed.',
                ], 409);
            }

            $grant->update([
                'claimed_by_user_id' => null,
                'claimed_at'         => null,
            ]);
            $logAction = GrantActionLog::ACTION_UNCLAIMED;
            $oldValue  = ['claimed_by_user_id' => $previousUserId, 'user_name' => $user->name];
            $newValue  = ['claimed_by_user_id' => null];

        } else { // take_over
            $previousClaimant = $grant->claimedBy;

            $grant->update([
                'claimed_by_user_id' => $user->id,
                'claimed_at'         => now(),
            ]);
            $logAction = GrantActionLog::ACTION_REASSIGNED;
            $oldValue  = ['claimed_by_user_id' => $previousUserId, 'user_name' => $previousClaimant?->name];
            $newValue  = ['claimed_by_user_id' => $user->id, 'user_name' => $user->name];
        }

        GrantActionLog::create([
            'grant_id'   => $grant->id,
            'user_id'    => $user->id,
            'action'     => $logAction,
            'old_value'  => $oldValue,
            'new_value'  => $newValue,
            'ip_address' => $request->ip(),
            'user_agent' => substr($request->userAgent() ?? '', 0, 300),
            'created_at' => now(),
        ]);

        return response()->json($grant->fresh()->load('claimedBy'));
    }

    /**
     * GET /api/grants/{id}/logs
     *
     * Returns the action log for a single grant.
     * Full-access users see all entries (including other users' actions).
     * Standard users see only their own entries.
     */
    public function logs(Request $request, int $id): JsonResponse
    {
        $grant    = GrantUnified::findOrFail($id);
        $user     = $request->user();
        $isAdmin  = $user->role === 'full';

        $query = $grant->actionLogs()                   // already ordered by created_at DESC
            ->with('user:id,name')                      // eager-load just name, no password
            ->limit(100);                               // cap at 100 — more than enough per grant

        if (! $isAdmin) {
            $query->where('user_id', $user->id);
        }

        $logs = $query->get()->map(fn ($log) => [
            'id'         => $log->id,
            'action'     => $log->action,
            'old_value'  => $log->old_value,
            'new_value'  => $log->new_value,
            'user_name'  => $log->user?->name ?? ($log->action === GrantActionLog::ACTION_SCRAPED ? 'Scraper Agent' : 'System'),
            'is_me'      => $log->user_id === $user->id,
            'created_at' => $log->created_at->toISOString(),
        ]);

        return response()->json(['logs' => $logs]);
    }

    /**
     * PATCH /api/grants_gov/{id}  — legacy alias, same table now
     */
    public function updateGrantGov(Request $request, int $id): JsonResponse
    {
        return $this->updateGrant($request, $id);
    }

    /**
     * GET /api/count?table=grants_unified
     */
    public function count(Request $request): JsonResponse
    {
        $allowed = ['grants', 'keywords', 'initiatives', 'organization_profile'];
        $table   = $request->query('table', 'grants');

        if (!in_array($table, $allowed)) {
            return response()->json(['error' => 'Table not allowed'], 403);
        }

        return response()->json(['count' => DB::table($table)->count()]);
    }
}
