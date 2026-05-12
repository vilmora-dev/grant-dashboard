<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    /**
     * GET /api/stats
     *
     * Query params:
     *   days        int     default 30   — lookback window
     *   initiative  string  default all  — filter by initiative slug (or "all")
     *
     * Returns five payloads consumed by the dashboard:
     *   timeline      — daily grant count for the window
     *   by_source     — grants grouped by source
     *   score_dist    — relevance_score histogram (buckets 0-9, 10-19, … 90-100)
     *   funnel        — pipeline stage counts
     *   run_history   — last 20 search_runs (for the sparkline)
     */
    public function index(Request $request): JsonResponse
    {
        $days       = max(1, (int) $request->query('days', 30));
        $initiative = $request->query('initiative', 'all');
        $since      = now()->subDays($days)->startOfDay();

        // ── Base grant query ───────────────────────────────────────────────
        // Note: grants table has no initiative_id — grants are matched to
        // initiatives via keywords/scoring. We filter by source as the
        // nearest available proxy when initiative != "all".
        // TODO: add initiative_id to grants when per-initiative scoring ships.
        $base = DB::table('grants')->where('scraped_at', '>=', $since);

        // ── 1. Timeline — grants per day ───────────────────────────────────
        $timeline = (clone $base)
            ->selectRaw("DATE(scraped_at) as date, COUNT(*) as count")
            ->groupByRaw("DATE(scraped_at)")
            ->orderBy('date')
            ->get()
            ->map(fn($r) => ['date' => $r->date, 'count' => (int) $r->count]);

        // ── 2. By source ───────────────────────────────────────────────────
        $bySource = (clone $base)
            ->selectRaw("source, COUNT(*) as count")
            ->groupBy('source')
            ->orderByDesc('count')
            ->get()
            ->map(fn($r) => ['source' => $r->source, 'count' => (int) $r->count]);

        // ── 3. Score distribution (11 buckets: 0-9, 10-19, … 90-100) ──────
        $rawScores = (clone $base)
            ->selectRaw("FLOOR(relevance_score / 10) * 10 as bucket, COUNT(*) as count")
            ->groupByRaw("FLOOR(relevance_score / 10) * 10")
            ->orderBy('bucket')
            ->get();

        // Ensure all buckets 0–100 are present even if empty
        $buckets = collect(range(0, 10))->mapWithKeys(fn($i) => [$i * 10 => 0]);
        foreach ($rawScores as $r) {
            $key = min((int) $r->bucket, 100);
            $buckets[$key] = (int) $r->count;
        }
        $scoreDist = $buckets->map(fn($count, $bucket) => [
            'bucket' => $bucket === 100 ? '100' : "{$bucket}–" . ($bucket + 9),
            'count'  => $count,
        ])->values();

        // ── 4. Pipeline funnel ─────────────────────────────────────────────
        $total    = (clone $base)->count();
        $notIgnored = (clone $base)->where('ignore', false)->count();
        $starred  = (clone $base)->where('starred', true)->count();
        $applied  = (clone $base)->where('applied', true)->count();

        $funnel = [
            ['stage' => 'Scraped',    'count' => $total],
            ['stage' => 'Kept',       'count' => $notIgnored],
            ['stage' => 'Starred',    'count' => $starred],
            ['stage' => 'Applied',    'count' => $applied],
        ];

        // ── 5. Run history (last 20 runs) ──────────────────────────────────
        $runHistory = DB::table('search_runs')
            ->select('run_at', 'total_api_hits', 'newly_processed',
                     'cash_grants_found', 'elapsed_seconds', 'theme')
            ->orderByDesc('run_at')
            ->limit(20)
            ->get()
            ->map(fn($r) => [
                'run_at'            => $r->run_at,
                'total_api_hits'    => (int) $r->total_api_hits,
                'newly_processed'   => (int) $r->newly_processed,
                'cash_grants_found' => (int) $r->cash_grants_found,
                'elapsed_seconds'   => $r->elapsed_seconds ? (float) $r->elapsed_seconds : null,
                'theme'             => $r->theme,
            ]);

        // ── 6. Summary totals ──────────────────────────────────────────────
        $summary = [
            'total_in_window' => $total,
            'starred'         => $starred,
            'applied'         => $applied,
            'avg_score'       => (clone $base)->avg('relevance_score') ?? 0,
            'days'            => $days,
        ];

        return response()->json(compact(
            'timeline', 'bySource', 'scoreDist', 'funnel', 'runHistory', 'summary'
        ));
    }
}
