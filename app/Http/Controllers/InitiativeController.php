<?php

namespace App\Http\Controllers;

use App\Models\Initiative;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InitiativeController extends Controller
{
    /**
     * GET /api/initiatives?include_deleted=false
     */
    public function index(Request $request): JsonResponse
    {
        $includeDeleted = filter_var($request->query('include_deleted', false), FILTER_VALIDATE_BOOLEAN);

        $initiatives = Initiative::withCount(['keywords' => fn($q) => $q->where('is_active', true)])
            ->when(!$includeDeleted, fn($q) => $q->where('is_deleted', false))
            ->orderBy('id')
            ->get()
            ->map(fn($i) => array_merge($i->toArray(), [
                'active_keyword_count' => $i->keywords_count,
            ]));

        return response()->json($initiatives);
    }

    /**
     * POST /api/initiatives
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'slug'         => 'required|string|unique:initiatives,slug',
            'display_name' => 'required|string',
            'description'  => 'nullable|string',
            'is_active'    => 'boolean',
        ]);

        $initiative = Initiative::create([
            'slug'         => $data['slug'],
            'display_name' => $data['display_name'],
            'description'  => $data['description'] ?? null,
            'is_active'    => $data['is_active'] ?? true,
        ]);

        return response()->json($initiative, 201);
    }

    /**
     * PATCH /api/initiatives/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $initiative = Initiative::findOrFail($id);

        $data = $request->validate([
            'slug'         => "sometimes|string|unique:initiatives,slug,{$id}",
            'display_name' => 'sometimes|string',
            'description'  => 'sometimes|nullable|string',
            'is_active'    => 'sometimes|boolean',
            'is_deleted'   => 'sometimes|boolean',
        ]);

        $initiative->update($data);

        return response()->json($initiative->fresh());
    }

    /**
     * DELETE /api/initiatives/{id}
     * Soft-delete: sets is_deleted=true, is_active=false.
     */
    public function destroy(int $id): JsonResponse
    {
        $initiative = Initiative::findOrFail($id);
        $initiative->update(['is_deleted' => true, 'is_active' => false]);

        return response()->json(null, 204);
    }
}
