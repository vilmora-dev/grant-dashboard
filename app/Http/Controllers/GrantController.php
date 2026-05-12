<?php

namespace App\Http\Controllers;

use App\Models\GrantUnified;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GrantController extends Controller
{
    /**
     * GET /dashboard
     * Render the grants dashboard with all grants from unified table.
     */
    public function index(Request $request)
    {
        $limit = (int) $request->query('limit', 500);

        $grants = GrantUnified::orderByDesc('scraped_at')
            ->limit($limit)
            ->get()
            ->map(fn ($g) => array_merge($g->toArray(), [
                '_id'      => 'grant-' . $g->id,
                '_table'   => 'grants',
                'offers_cash' => $g->offers_cash,
            ]));

        return Inertia::render('Grants/Index', [
            'grants' => $grants,
        ]);
    }
}
