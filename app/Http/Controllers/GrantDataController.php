<?php

namespace App\Http\Controllers;

use App\Models\Grant;
use App\Models\GrantGov;
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

        $web = Grant::orderByDesc('scraped_at')->limit($limit)->get();
        $gov = GrantGov::orderByDesc('scraped_at')->limit($limit)->get();

        return response()->json([
            'web'    => $web,
            'gov'    => $gov,
            'status' => true,
        ]);
    }

    /**
     * PATCH /api/grants/{id}
     */
    public function updateGrant(Request $request, int $id): JsonResponse
    {
        $grant = Grant::findOrFail($id);

        $data = $request->validate([
            'applied'       => 'sometimes|boolean',
            'ignore'        => 'sometimes|boolean',
            'starred'       => 'sometimes|boolean',
            'offers_cash'   => 'sometimes|boolean',
            'area_relevant' => 'sometimes|boolean',
            'ai_analyzed'   => 'sometimes|boolean',
            'amount'        => 'sometimes|nullable|string',
            'deadline'      => 'sometimes|nullable|string',
            'notes'         => 'sometimes|nullable|string',
            'discard_reason'=> 'sometimes|nullable|string',
        ]);

        if (empty($data)) {
            return response()->json(['error' => 'No fields to update'], 400);
        }

        $grant->update($data);

        return response()->json($grant->fresh());
    }

    /**
     * PATCH /api/grants_gov/{id}
     */
    public function updateGrantGov(Request $request, int $id): JsonResponse
    {
        $grant = GrantGov::findOrFail($id);

        $data = $request->validate([
            'applied'        => 'sometimes|boolean',
            'ignore'         => 'sometimes|boolean',
            'starred'        => 'sometimes|boolean',
            'is_cash_grant'  => 'sometimes|boolean',
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

        $grant->update($data);

        return response()->json($grant->fresh());
    }

    /**
     * GET /api/count?table=grants
     */
    public function count(Request $request): JsonResponse
    {
        $allowed = ['grants', 'grants_gov', 'keywords', 'initiatives', 'organization_profile'];
        $table   = $request->query('table', 'grants');

        if (!in_array($table, $allowed)) {
            return response()->json(['error' => 'Table not allowed'], 403);
        }

        return response()->json(['count' => DB::table($table)->count()]);
    }
}
