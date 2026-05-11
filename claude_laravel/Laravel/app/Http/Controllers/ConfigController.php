<?php

namespace App\Http\Controllers;

use App\Models\Initiative;
use App\Models\Keyword;
use App\Models\OrganizationProfile;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ConfigController extends Controller
{
    /**
     * GET /config
     * Render the config page with all three data sets as Inertia props.
     */
    public function index()
    {
        $initiatives = Initiative::orderBy('display_name')->get();

        $keywords = Keyword::with('initiative')
            ->orderBy('priority')
            ->orderBy('keyword')
            ->get()
            ->map(fn ($kw) => array_merge($kw->toArray(), [
                'initiative_name' => $kw->initiative?->display_name,
            ]));

        $org = OrganizationProfile::first();

        return Inertia::render('Config/Index', [
            'initiatives' => $initiatives,
            'keywords'    => $keywords,
            'orgProfile'  => $org,
        ]);
    }

    // ── Initiatives ───────────────────────────────────────────────────

    public function storeInitiative(Request $request)
    {
        $data = $request->validate([
            'slug'         => 'required|string|max:80|unique:initiatives,slug',
            'display_name' => 'required|string|max:150',
            'description'  => 'nullable|string',
            'is_active'    => 'boolean',
        ]);

        $initiative = Initiative::create($data);
        return response()->json($initiative, 201);
    }

    public function updateInitiative(Request $request, int $id)
    {
        $data = $request->validate([
            'slug'         => 'sometimes|string|max:80',
            'display_name' => 'sometimes|string|max:150',
            'description'  => 'nullable|string',
            'is_active'    => 'sometimes|boolean',
        ]);

        $initiative = Initiative::findOrFail($id);
        $initiative->update($data);
        return response()->json($initiative->fresh());
    }

    public function destroyInitiative(int $id)
    {
        Initiative::findOrFail($id)->delete();
        return response()->noContent();
    }

    // ── Keywords ──────────────────────────────────────────────────────

    public function storeKeyword(Request $request)
    {
        $data = $request->validate([
            'keyword'       => 'required|string|max:200',
            'initiative_id' => 'nullable|integer|exists:initiatives,id',
            'priority'      => 'integer|min:1|max:10',
            'is_active'     => 'boolean',
        ]);

        $keyword = Keyword::create($data);

        // Reload with initiative name attached
        $keyword->load('initiative');
        return response()->json(array_merge($keyword->toArray(), [
            'initiative_name' => $keyword->initiative?->display_name,
        ]), 201);
    }

    public function updateKeyword(Request $request, int $id)
    {
        $data = $request->validate([
            'keyword'       => 'sometimes|string|max:200',
            'initiative_id' => 'nullable|integer|exists:initiatives,id',
            'priority'      => 'sometimes|integer|min:1|max:10',
            'is_active'     => 'sometimes|boolean',
        ]);

        $keyword = Keyword::findOrFail($id);
        $keyword->update($data);
        $keyword->load('initiative');

        return response()->json(array_merge($keyword->fresh()->toArray(), [
            'initiative_name' => $keyword->initiative?->display_name,
        ]));
    }

    public function destroyKeyword(int $id)
    {
        Keyword::findOrFail($id)->delete();
        return response()->noContent();
    }

    // ── Organization profile ──────────────────────────────────────────

    public function upsertOrganization(Request $request)
    {
        $data = $request->validate([
            'name'            => 'required|string|max:200',
            'website'         => 'nullable|string|max:500',
            'founded_year'    => 'nullable|integer|min:1900|max:2100',
            'irs_status'      => 'nullable|string|max:50',
            'mission'         => 'nullable|string',
            'org_type'        => 'nullable|string|max:100',
            'target_states'   => 'nullable|array',
            'target_states.*' => 'string',
            'target_counties'   => 'nullable|array',
            'target_counties.*' => 'string',
            'target_cities'   => 'nullable|array',
            'target_cities.*' => 'string',
            'budget_range'    => 'nullable|string|max:50',
            'staff_count'     => 'nullable|integer|min:0',
            'volunteer_count' => 'nullable|integer|min:0',
            'notes'           => 'nullable|string',
            'ddg_searching'   => 'nullable|array',
            'ddg_searching.*' => 'string',
            'ddg_sites'       => 'nullable|array',
            'ddg_sites.*'     => 'string',
        ]);

        $data['updated_at'] = now();

        $org = OrganizationProfile::first();
        if ($org) {
            $org->update($data);
        } else {
            $org = OrganizationProfile::create($data);
        }

        return response()->json($org->fresh());
    }
}
