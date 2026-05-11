<?php

namespace App\Http\Controllers;

use App\Models\Grant;
use App\Models\GrantGov;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GrantController extends Controller
{
    /**
     * GET /
     * Render the grants dashboard with both tables merged and passed as Inertia props.
     */
    public function index(Request $request)
    {
        $limit = (int) $request->query('limit', 500);

        // DDG / web grants
        $webGrants = Grant::orderByDesc('scraped_at')
            ->limit($limit)
            ->get()
            ->map(fn ($g) => array_merge($g->toArray(), [
                '_id'    => 'web-' . $g->id,
                '_table' => 'grants',
            ]));

        // Grants.gov grants
        $govGrants = GrantGov::orderByDesc('scraped_at')
            ->limit($limit)
            ->get()
            ->map(fn ($g) => array_merge($g->toArray(), [
                '_id'    => 'gov-' . $g->id,
                '_table' => 'grants_gov',
                // Normalise field name so the frontend sees offers_cash on both
                'offers_cash' => $g->is_cash_grant,
            ]));

        return Inertia::render('Grants/Index', [
            'webGrants' => $webGrants,
            'govGrants' => $govGrants,
        ]);
    }

    /**
     * PATCH /grants/{id}
     * Update applied / ignore / starred / amount / deadline / notes on the DDG grants table.
     */
    public function patchDdg(Request $request, int $id)
    {
        $allowed = [
            'applied', 'ignore', 'starred',
            'offers_cash', 'amount', 'deadline', 'notes', 'discard_reason',
        ];

        $data = $request->only($allowed);

        if (empty($data)) {
            return response()->json(['error' => 'No fields to update'], 400);
        }

        $grant = Grant::findOrFail($id);
        $grant->update($data);

        return response()->json($grant->fresh()->toArray());
    }

    /**
     * PATCH /grants-gov/{id}
     * Update applied / ignore / starred / amount / deadline / notes on the grants_gov table.
     */
    public function patchGov(Request $request, int $id)
    {
        $allowed = [
            'applied', 'ignore', 'starred', 'is_cash_grant',
            'amount', 'deadline', 'notes', 'discard_reason',
        ];

        $data = $request->only($allowed);

        if (empty($data)) {
            return response()->json(['error' => 'No fields to update'], 400);
        }

        $grant = GrantGov::findOrFail($id);
        $grant->update($data);

        return response()->json($grant->fresh()->toArray());
    }
}
