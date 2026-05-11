<?php

namespace App\Http\Controllers;

use App\Models\DdgSearchCombo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DdgSearchComboController extends Controller
{
    /**
     * GET /api/ddg-combos
     */
    public function index(Request $request): JsonResponse
    {
        $query = DdgSearchCombo::query();

        if (filter_var($request->query('active_only', false), FILTER_VALIDATE_BOOLEAN)) {
            $query->where('is_active', true);
        }

        if (filter_var($request->query('starred_only', false), FILTER_VALIDATE_BOOLEAN)) {
            $query->where('starred', true);
        }

        if ($comboType = $request->query('combo_type')) {
            $query->where('combo_type', $comboType);
        }

        $combos = $query
            ->orderByDesc('starred')
            ->orderBy('run_count')
            ->orderBy('id')
            ->get()
            ->map(fn($c) => array_merge($c->toArray(), [
                'will_run' => $c->starred && $c->is_active,
            ]));

        return response()->json($combos);
    }

    /**
     * PATCH /api/ddg-combos/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $combo = DdgSearchCombo::findOrFail($id);

        $data = $request->validate([
            'is_active' => 'sometimes|boolean',
            'starred'   => 'sometimes|boolean',
        ]);

        if (empty($data)) {
            return response()->json(['error' => 'No fields to update'], 400);
        }

        $combo->update($data);
        $fresh = $combo->fresh();

        return response()->json(array_merge($fresh->toArray(), [
            'will_run' => $fresh->starred && $fresh->is_active,
        ]));
    }
}
