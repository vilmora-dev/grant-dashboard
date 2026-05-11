<?php

namespace App\Http\Controllers;

use App\Models\Keyword;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class KeywordController extends Controller
{
    /**
     * GET /api/keywords
     */
    public function index(): JsonResponse
    {
        $keywords = Keyword::with('initiative')
            ->orderBy('priority')
            ->orderBy('keyword')
            ->get()
            ->map(fn($k) => array_merge($k->toArray(), [
                'initiative_name' => $k->initiative?->display_name,
            ]));

        return response()->json($keywords);
    }

    /**
     * POST /api/keywords
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'keyword'       => 'required|string',
            'initiative_id' => 'nullable|integer|exists:initiatives,id',
            'priority'      => 'integer|min:1|max:10',
            'is_active'     => 'boolean',
        ]);

        // Enforce unique keyword+initiative_id (matching FastAPI UniqueViolationError → 409)
        $exists = Keyword::where('keyword', $data['keyword'])
            ->where('initiative_id', $data['initiative_id'] ?? null)
            ->exists();

        if ($exists) {
            return response()->json([
                'error' => "Keyword '{$data['keyword']}' already exists for this initiative",
            ], 409);
        }

        $keyword = Keyword::create([
            'keyword'       => $data['keyword'],
            'initiative_id' => $data['initiative_id'] ?? null,
            'priority'      => $data['priority'] ?? 5,
            'is_active'     => $data['is_active'] ?? true,
        ]);

        return response()->json($keyword, 201);
    }

    /**
     * PATCH /api/keywords/{id}
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $keyword = Keyword::findOrFail($id);

        $data = $request->validate([
            'keyword'       => 'sometimes|string',
            'initiative_id' => 'sometimes|nullable|integer|exists:initiatives,id',
            'priority'      => 'sometimes|integer|min:1|max:10',
            'is_active'     => 'sometimes|boolean',
        ]);

        $keyword->update($data);

        return response()->json($keyword->fresh());
    }

    /**
     * DELETE /api/keywords/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $keyword = Keyword::findOrFail($id);
        $keyword->delete();

        return response()->json(null, 204);
    }
}
