<?php

namespace App\Http\Controllers;

use App\Models\GrantUnified;
use Illuminate\Http\Request;
use Inertia\Inertia;

class GrantController extends Controller
{
    /**
     * GET /dashboard
     *
     * Server-side filtered, sorted, and paginated grants.
     *
     * Query params:
     *   page             int     default 1
     *   status           string  all|relevant|applied|ignored|reviewed   default all
     *   source           string  all|grants_gov|web|…       default all
     *   sort             string  match|newest|deadline|amount|title|source  default match
     *   search           string  full-text on title+description+eligibility+agency_name
     *   starred          bool    1 = only starred
     *   min_score        int     0–100, default 0 (no filter)
     *   deadline_window  string  any|week|month|expired  default any
     *   claim            string  any|mine|available|claimed  default any
     *   exclude_mine     bool    1 = when claim=claimed, exclude grants claimed by me
     */
    public function index(Request $request)
    {
        $q = GrantUnified::query()->with('claimedBy:id,name');

        // ── Status ───────────────────────────────────────────────────────
        $status = $request->query('status', 'all');
        match ($status) {
            'all'      => null, // frontend-only bucket — no filter applied
            'applied'  => $q->where('applied', true),
            'ignored'  => $q->where('ignore', true),
            'reviewed' => $q->where('reviewed', true),
            // "New" = hasn't moved anywhere on the ladder yet, and hasn't
            // been discarded. Must exclude reviewed=true too, otherwise a
            // grant moved to Reviewed still shows up (and counts) as New.
            default    => $q->where('ignore', false)->where('applied', false)->where('reviewed', false),
        };

        // ── Source / scrape_method filter ─────────────────────────────────
        $source = $request->query('source', 'all');
        if ($source !== 'all') {
            if (in_array($source, ['rss', 'api', 'web'])) {
                $q->where('scrape_method', $source);
            } else {
                $q->where('source', $source);
            }
        }

        // ── Boolean toggles ───────────────────────────────────────────────
        if (filter_var($request->query('starred'), FILTER_VALIDATE_BOOLEAN)) {
            $q->where('starred', true);
        }

        // ── Claim status ─────────────────────────────────────────────────
        // any (default) | mine | available | claimed
        // exclude_mine only has an effect when claim=claimed: it removes
        // grants claimed by the current user from that "claimed" list.
        $userId      = $request->user()?->id;
        $claim       = $request->query('claim', 'any');
        $excludeMine = filter_var($request->query('exclude_mine'), FILTER_VALIDATE_BOOLEAN);
        match ($claim) {
            'mine'      => $q->where('claimed_by_user_id', $userId),
            'available' => $q->whereNull('claimed_by_user_id'),
            'claimed'   => $q->whereNotNull('claimed_by_user_id')
                              ->when($excludeMine && $userId, fn ($sub) => $sub->where('claimed_by_user_id', '!=', $userId)),
            default     => null,
        };

        // ── Min relevance score ───────────────────────────────────────────
        $minScore = max(0, min(100, (int) $request->query('min_score', 0)));
        if ($minScore > 0) {
            $q->where('relevance_score', '>=', $minScore);
        }

        // ── Deadline window ───────────────────────────────────────────────
        // Resolves either close_date (gov) or deadline (web/RSS) into a date,
        // then applies the window. Rows with no parseable date are excluded
        // from week/month windows (correct — they have no known deadline).
        $deadlineWindow = $request->query('deadline_window', 'any');
        if ($deadlineWindow !== 'any') {
            $parsedDate = "COALESCE(
                STR_TO_DATE(NULLIF(NULLIF(close_date,''),'null'), '%Y-%m-%d'),
                STR_TO_DATE(NULLIF(NULLIF(deadline,''),'null'),   '%Y-%m-%d')
            )";
            $today = now()->toDateString();
            match ($deadlineWindow) {
                'week'    => $q->whereRaw("$parsedDate BETWEEN ? AND ?",
                                 [$today, now()->addDays(7)->toDateString()]),
                'month'   => $q->whereRaw("$parsedDate BETWEEN ? AND ?",
                                 [$today, now()->addDays(30)->toDateString()]),
                'expired' => $q->whereRaw("$parsedDate < ?", [$today]),
                default   => null,
            };
        }

        // ── Full-text search (title, description, eligibility, agency) ────
        $search = trim($request->query('search', ''));
        if ($search !== '') {
            $like = '%' . addcslashes($search, '%_\\') . '%';
            $q->where(function ($sub) use ($like) {
                $sub->where('title',       'like', $like)
                    ->orWhere('description', 'like', $like)
                    ->orWhere('eligibility', 'like', $like)
                    ->orWhere('agency_name', 'like', $like);
            });
        }

        // ── Sort ──────────────────────────────────────────────────────────
        $sort = $request->query('sort', 'match');
        match ($sort) {
            'newest'   => $q->orderByDesc('scraped_at'),
            'deadline' => $q->orderByRaw("
                CASE
                    -- Priority 0: a real parseable date exists (gov close_date or web deadline)
                    WHEN close_date IS NOT NULL AND close_date != ''
                         AND STR_TO_DATE(close_date, '%Y-%m-%d') IS NOT NULL          THEN 0
                    WHEN deadline IS NOT NULL AND deadline != ''
                         AND deadline NOT IN ('See website','Rolling','Unknown','null')
                         AND STR_TO_DATE(deadline, '%Y-%m-%d') IS NOT NULL             THEN 0
                    -- Priority 1: deadline exists but is a placeholder (See website / Rolling)
                    WHEN deadline IN ('See website','Rolling')                          THEN 1
                    -- Priority 2: truly unknown (null, empty, 'Unknown', 'null')
                    ELSE 2
                END ASC
            ")
            ->orderByRaw("
                COALESCE(
                    STR_TO_DATE(NULLIF(NULLIF(close_date,''),'null'), '%Y-%m-%d'),
                    STR_TO_DATE(NULLIF(NULLIF(deadline,''),'null'),   '%Y-%m-%d')
                ) ASC
            "),
            'amount'   => $q->orderByRaw('CASE WHEN award_ceiling IS NULL OR award_ceiling = "" THEN 1 ELSE 0 END')
                           ->orderByRaw('CAST(REGEXP_REPLACE(COALESCE(award_ceiling, "0"), "[^0-9.]", "") AS DECIMAL(20,2)) DESC')
                           ->orderByDesc('relevance_score'),
            'title'    => $q->orderBy('title'),
            'source'   => $q->orderBy('source')->orderBy('title'),
            default    => $q->orderByDesc('relevance_score')->orderByDesc('scraped_at'),
        };

        // ── Counts (always over full table, not filtered) ─────────────────
        $totalInDb    = GrantUnified::count();
        $relevantCnt  = GrantUnified::where('ignore', false)->where('applied', false)->where('reviewed', false)->count();
        $appliedCnt   = GrantUnified::where('applied', true)->count();
        $ignoredCnt   = GrantUnified::where('ignore', true)->count();
        $reviewedCnt  = GrantUnified::where('reviewed', true)->count();
        $mineCnt      = $userId ? GrantUnified::where('claimed_by_user_id', $userId)->count() : 0;
        $availableCnt = GrantUnified::whereNull('claimed_by_user_id')->count();
        $claimedCnt   = GrantUnified::whereNotNull('claimed_by_user_id')->count();

        // ── Distinct sources actually in DB (for the source dropdown) ─────
        $presentSources = GrantUnified::select('source')
            ->whereNotNull('source')
            ->distinct()
            ->pluck('source')
            ->filter()
            ->values();

        // ── Paginate (24 per page for a clean 4-col grid) ─────────────────
        $paginated = $q->paginate(24)->withQueryString();

        // ── Shape each grant row ──────────────────────────────────────────
        $grants = collect($paginated->items())->map(fn ($g) => array_merge($g->toArray(), [
            '_id'         => 'grant-' . $g->id,
            '_table'      => 'grants',
            'offers_cash' => (bool) $g->offers_cash,
        ]));

        return Inertia::render('Grants/Index', [
            'grants' => $grants,
            'meta'   => [
                'total'        => $paginated->total(),
                'per_page'     => $paginated->perPage(),
                'current_page' => $paginated->currentPage(),
                'last_page'    => $paginated->lastPage(),
                'from'         => $paginated->firstItem() ?? 0,
                'to'           => $paginated->lastItem()  ?? 0,
            ],
            'counts' => [
                'total'     => $totalInDb,
                'relevant'  => $relevantCnt,
                'applied'   => $appliedCnt,
                'ignored'   => $ignoredCnt,
                'reviewed'  => $reviewedCnt,
                'mine'      => $mineCnt,
                'available' => $availableCnt,
                'claimed'   => $claimedCnt,
            ],
            'presentSources' => $presentSources,
            'filters' => [
                'status'         => $status,
                'source'         => $source,
                'sort'           => $sort,
                'search'         => $search,
                'starred'        => filter_var($request->query('starred'), FILTER_VALIDATE_BOOLEAN),
                'min_score'      => $minScore,
                'deadline_window' => $deadlineWindow,
                'claim'          => $claim,
                'exclude_mine'   => $excludeMine,
            ],
        ]);
    }
}
