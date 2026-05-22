<?php

namespace Tests\Feature;

use App\Models\GrantUnified;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Feature tests for GET /api/stats (StatsController, Priority 5b).
 *
 * The endpoint is full-access only and returns five payload keys:
 *   timeline    -- daily grant count for a lookback window
 *   bySource    -- grants grouped by source
 *   scoreDist   -- relevance_score histogram (11 buckets 0-9 .. 90-100)
 *   funnel      -- pipeline stage counts (Scraped / Kept / Starred / Applied)
 *   runHistory  -- last 20 search_runs rows
 *   summary     -- aggregate totals for the window
 *
 * search_runs has no Eloquent model/factory, so we seed it via DB::table().
 */
class StatsControllerTest extends TestCase
{
    use RefreshDatabase;

    // =========================================================================
    // Helpers
    // =========================================================================

    private function admin(): User
    {
        return User::factory()->fullAccess()->create();
    }

    private function standardUser(): User
    {
        return User::factory()->standardAccess()->create();
    }

    /** Insert a minimal search_run row. */
    private function seedRun(array $overrides = []): void
    {
        DB::table('search_runs')->insert(array_merge([
            'run_at'            => now()->toDateTimeString(),
            'total_api_hits'    => 10,
            'newly_processed'   => 5,
            'cash_grants_found' => 2,
            'elapsed_seconds'   => 3.5,
            'theme'             => 'general',
        ], $overrides));
    }

    // =========================================================================
    // Authentication & authorization
    // =========================================================================

    public function test_stats_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/stats')->assertUnauthorized();
    }

    public function test_stats_endpoint_is_forbidden_for_standard_user(): void
    {
        $user = $this->standardUser();

        $this->actingAs($user)
             ->getJson('/api/stats')
             ->assertForbidden();
    }

    public function test_stats_endpoint_accessible_to_full_access_user(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
             ->getJson('/api/stats')
             ->assertOk();
    }

    // =========================================================================
    // Response shape -- all keys must be present
    // =========================================================================

    public function test_response_contains_all_required_top_level_keys(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->getJson('/api/stats');

        $response->assertOk()
                 ->assertJsonStructure([
                     'timeline',
                     'bySource',
                     'scoreDist',
                     'funnel',
                     'runHistory',
                     'summary',
                 ]);
    }

    public function test_summary_contains_expected_keys(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->getJson('/api/stats');

        $response->assertOk()
                 ->assertJsonStructure(['summary' => [
                     'total_in_window',
                     'starred',
                     'applied',
                     'avg_score',
                     'days',
                 ]]);
    }

    public function test_funnel_contains_four_stages(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->getJson('/api/stats');

        $response->assertOk();
        $this->assertCount(4, $response->json('funnel'));
    }

    public function test_funnel_stage_labels_are_correct(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->getJson('/api/stats');

        $stages = collect($response->json('funnel'))->pluck('stage')->all();
        $this->assertSame(['Scraped', 'Kept', 'Starred', 'Applied'], $stages);
    }

    // =========================================================================
    // scoreDist -- all 11 buckets always present
    // =========================================================================

    public function test_score_dist_always_has_eleven_buckets(): void
    {
        $admin = $this->admin();
        // No grants at all -- buckets must still be present and zero
        $response = $this->actingAs($admin)->getJson('/api/stats');

        $response->assertOk();
        $this->assertCount(11, $response->json('scoreDist'));
    }

    public function test_score_dist_bucket_range_covers_0_to_100(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->getJson('/api/stats');

        $buckets = collect($response->json('scoreDist'))->pluck('bucket')->all();
        $this->assertContains('0–9',  $buckets);
        $this->assertContains('100',  $buckets);
    }

    public function test_score_dist_empty_buckets_have_zero_count(): void
    {
        $admin = $this->admin();
        // No grants seeded -- all counts should be 0
        $response = $this->actingAs($admin)->getJson('/api/stats');

        $response->assertOk();
        $counts = collect($response->json('scoreDist'))->pluck('count')->all();
        foreach ($counts as $count) {
            $this->assertSame(0, $count);
        }
    }

    public function test_score_dist_counts_grants_in_correct_buckets(): void
    {
        $admin = $this->admin();
        GrantUnified::factory()->create(['relevance_score' => 45, 'scraped_at' => now()]);
        GrantUnified::factory()->create(['relevance_score' => 47, 'scraped_at' => now()]);
        GrantUnified::factory()->create(['relevance_score' => 90, 'scraped_at' => now()]);

        $response = $this->actingAs($admin)->getJson('/api/stats');

        $dist = collect($response->json('scoreDist'))->keyBy('bucket');

        // The 40–49 bucket should have 2
        $this->assertSame(2, $dist['40–49']['count']);
        // The 90–99 bucket should have 1
        $this->assertSame(1, $dist['90–99']['count']);
    }

    // =========================================================================
    // Funnel counts
    // =========================================================================

    public function test_funnel_scraped_count_equals_total_grants_in_window(): void
    {
        $admin = $this->admin();
        GrantUnified::factory()->count(5)->create(['scraped_at' => now()]);

        $response = $this->actingAs($admin)->getJson('/api/stats');

        $funnel = collect($response->json('funnel'))->keyBy('stage');
        $this->assertSame(5, $funnel['Scraped']['count']);
    }

    public function test_funnel_kept_excludes_ignored_grants(): void
    {
        $admin = $this->admin();
        GrantUnified::factory()->count(3)->create(['scraped_at' => now(), 'ignore' => false]);
        GrantUnified::factory()->count(2)->create(['scraped_at' => now(), 'ignore' => true]);

        $response = $this->actingAs($admin)->getJson('/api/stats');

        $funnel = collect($response->json('funnel'))->keyBy('stage');
        $this->assertSame(3, $funnel['Kept']['count']);
    }

    public function test_funnel_starred_count_is_correct(): void
    {
        $admin = $this->admin();
        GrantUnified::factory()->count(2)->create(['scraped_at' => now(), 'starred' => true]);
        GrantUnified::factory()->count(3)->create(['scraped_at' => now(), 'starred' => false]);

        $response = $this->actingAs($admin)->getJson('/api/stats');

        $funnel = collect($response->json('funnel'))->keyBy('stage');
        $this->assertSame(2, $funnel['Starred']['count']);
    }

    public function test_funnel_applied_count_is_correct(): void
    {
        $admin = $this->admin();
        GrantUnified::factory()->count(1)->create(['scraped_at' => now(), 'applied' => true]);
        GrantUnified::factory()->count(4)->create(['scraped_at' => now(), 'applied' => false]);

        $response = $this->actingAs($admin)->getJson('/api/stats');

        $funnel = collect($response->json('funnel'))->keyBy('stage');
        $this->assertSame(1, $funnel['Applied']['count']);
    }

    // =========================================================================
    // days query param -- lookback window
    // =========================================================================

    public function test_default_window_is_30_days(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->getJson('/api/stats');

        $response->assertOk();
        $this->assertSame(30, $response->json('summary.days'));
    }

    public function test_days_param_is_respected_in_summary(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->getJson('/api/stats?days=7');

        $response->assertOk();
        $this->assertSame(7, $response->json('summary.days'));
    }

    public function test_grants_outside_window_are_excluded_from_counts(): void
    {
        $admin = $this->admin();
        // This grant was scraped 60 days ago -- outside a 30-day window
        GrantUnified::factory()->create(['scraped_at' => now()->subDays(60)]);
        // This grant is recent
        GrantUnified::factory()->create(['scraped_at' => now()]);

        $response = $this->actingAs($admin)->getJson('/api/stats?days=30');

        $funnel = collect($response->json('funnel'))->keyBy('stage');
        $this->assertSame(1, $funnel['Scraped']['count']);
    }

    // =========================================================================
    // runHistory
    // =========================================================================

    public function test_run_history_is_empty_when_no_runs_exist(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->getJson('/api/stats');

        $response->assertOk();
        $this->assertIsArray($response->json('runHistory'));
        $this->assertCount(0, $response->json('runHistory'));
    }

    public function test_run_history_returns_seeded_runs(): void
    {
        $admin = $this->admin();
        $this->seedRun();
        $this->seedRun();

        $response = $this->actingAs($admin)->getJson('/api/stats');

        $response->assertOk();
        $this->assertCount(2, $response->json('runHistory'));
    }

    public function test_run_history_capped_at_20_entries(): void
    {
        $admin = $this->admin();
        for ($i = 0; $i < 25; $i++) {
            $this->seedRun(['run_at' => now()->subSeconds($i)->toDateTimeString()]);
        }

        $response = $this->actingAs($admin)->getJson('/api/stats');

        $response->assertOk();
        $this->assertCount(20, $response->json('runHistory'));
    }

    public function test_run_history_entry_has_expected_keys(): void
    {
        $admin = $this->admin();
        $this->seedRun();

        $response = $this->actingAs($admin)->getJson('/api/stats');

        $response->assertOk()
                 ->assertJsonStructure(['runHistory' => [['run_at', 'total_api_hits',
                     'newly_processed', 'cash_grants_found', 'elapsed_seconds', 'theme']]]);
    }
}
