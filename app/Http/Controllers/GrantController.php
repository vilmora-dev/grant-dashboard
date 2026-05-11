<?php

namespace App\Http\Controllers;

use App\Models\Grant;
use App\Models\GrantGov;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GrantController extends Controller
{
    /**
     * GET /dashboard
     * Render the grants dashboard with both tables passed as Inertia props.
     */
    public function index(Request $request)
    {
        $limit = (int) $request->query('limit', 500);

        $webGrants = Grant::orderByDesc('scraped_at')
            ->limit($limit)
            ->get()
            ->map(fn ($g) => array_merge($g->toArray(), [
                '_id'    => 'web-' . $g->id,
                '_table' => 'grants',
            ]));

        $govGrants = GrantGov::orderByDesc('scraped_at')
            ->limit($limit)
            ->get()
            ->map(fn ($g) => array_merge($g->toArray(), [
                '_id'      => 'gov-' . $g->id,
                '_table'   => 'grants_gov',
                'offers_cash' => $g->is_cash_grant,
            ]));

        return Inertia::render('Grants/Index', [
            'webGrants' => $webGrants,
            'govGrants' => $govGrants,
        ]);
    }
}
