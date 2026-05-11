<?php

namespace App\Http\Controllers;

use App\Models\OrganizationProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrganizationProfileController extends Controller
{
    private array $defaultDdgSearching = [
        'grant program',
        'grant opportunity',
        'grant application',
        'nonprofit funding',
    ];

    /**
     * GET /api/organization
     */
    public function show(): JsonResponse
    {
        $org = OrganizationProfile::orderBy('id')->first();

        if (!$org) {
            return response()->json((object) []);
        }

        return response()->json($org);
    }

    /**
     * PUT /api/organization
     * Upsert — update existing row or insert first row.
     */
    public function upsert(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'            => 'required|string',
            'website'         => 'nullable|string',
            'founded_year'    => 'nullable|integer',
            'irs_status'      => 'nullable|string',
            'mission'         => 'nullable|string',
            'org_type'        => 'nullable|string',
            'target_states'   => 'nullable|array',
            'target_counties' => 'nullable|array',
            'target_cities'   => 'nullable|array',
            'budget_range'    => 'nullable|string',
            'staff_count'     => 'nullable|integer',
            'volunteer_count' => 'nullable|integer',
            'notes'           => 'nullable|string',
            'ddg_searching'   => 'nullable|array',
            'ddg_sites'       => 'nullable|array',
        ]);

        // Apply defaults for array fields
        $data['target_states']   = $data['target_states']   ?? [];
        $data['target_counties'] = $data['target_counties'] ?? [];
        $data['target_cities']   = $data['target_cities']   ?? [];
        $data['ddg_searching']   = $data['ddg_searching']   ?? $this->defaultDdgSearching;
        $data['ddg_sites']       = $data['ddg_sites']       ?? [];

        $existing = OrganizationProfile::orderBy('id')->first();

        if ($existing) {
            $existing->update($data);
            return response()->json($existing->fresh());
        }

        $org = OrganizationProfile::create($data);
        return response()->json($org, 201);
    }
}
