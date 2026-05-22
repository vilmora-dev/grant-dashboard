<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for the RequireFullAccess middleware (Priority 2).
 *
 * The middleware has two distinct behaviours:
 *   - API routes (expectsJson): return 403 JSON { "error": "Full access required." }
 *   - Web routes: redirect to /dashboard
 *
 * Auth middleware fires before full.access, so unauthenticated requests
 * should never reach the full.access gate — they get 401/redirect from auth first.
 *
 * We test one representative route from each gated group rather than
 * every route (the route tests prove routing; these tests prove the gate).
 */
class RequireFullAccessTest extends TestCase
{
    use RefreshDatabase;

    // =========================================================================
    // Helpers
    // =========================================================================

    private function full(): User
    {
        return User::factory()->fullAccess()->create();
    }

    private function standard(): User
    {
        return User::factory()->standardAccess()->create();
    }

    // =========================================================================
    // API routes — standard user gets 403 JSON
    // =========================================================================

    public function test_standard_user_gets_403_on_gated_api_route(): void
    {
        $response = $this->actingAs($this->standard())
            ->getJson('/api/keywords');

        $response->assertForbidden()
                 ->assertJson(['error' => 'Full access required.']);
    }

    public function test_standard_user_cannot_post_to_initiatives(): void
    {
        $response = $this->actingAs($this->standard())
            ->postJson('/api/initiatives', ['slug' => 'test', 'display_name' => 'Test']);

        $response->assertForbidden()
                 ->assertJson(['error' => 'Full access required.']);
    }

    public function test_standard_user_cannot_access_organization_profile(): void
    {
        $response = $this->actingAs($this->standard())
            ->getJson('/api/organization');

        $response->assertForbidden();
    }

    public function test_standard_user_cannot_access_stats_api(): void
    {
        $response = $this->actingAs($this->standard())
            ->getJson('/api/stats');

        $response->assertForbidden();
    }

    public function test_standard_user_cannot_access_team_api(): void
    {
        $response = $this->actingAs($this->standard())
            ->getJson('/api/team');

        $response->assertForbidden();
    }

    public function test_standard_user_cannot_access_ddg_combos(): void
    {
        $response = $this->actingAs($this->standard())
            ->getJson('/api/ddg-combos');

        $response->assertForbidden();
    }

    // =========================================================================
    // Web routes — standard user gets redirected to dashboard
    // =========================================================================

    public function test_standard_user_is_redirected_from_stats_page(): void
    {
        $response = $this->actingAs($this->standard())
            ->get('/stats');

        // Middleware redirects to dashboard, not a 403
        $response->assertRedirect(route('dashboard'));
    }

    public function test_standard_user_is_redirected_from_config_page(): void
    {
        $response = $this->actingAs($this->standard())
            ->get('/config');

        $response->assertRedirect(route('dashboard'));
    }

    public function test_standard_user_is_redirected_from_team_page(): void
    {
        $response = $this->actingAs($this->standard())
            ->get('/team');

        $response->assertRedirect(route('dashboard'));
    }

    // =========================================================================
    // Full-access user passes through freely
    // =========================================================================

    public function test_full_access_user_can_reach_gated_api_route(): void
    {
        $response = $this->actingAs($this->full())
            ->getJson('/api/keywords');

        // 200 — reaches the controller
        $response->assertOk();
    }

    public function test_full_access_user_can_reach_gated_web_page(): void
    {
        $response = $this->actingAs($this->full())
            ->get('/stats');

        // 200 — Inertia renders the page
        $response->assertOk();
    }

    public function test_full_access_user_can_reach_team_api(): void
    {
        $response = $this->actingAs($this->full())
            ->getJson('/api/team');

        $response->assertOk();
    }

    // =========================================================================
    // Unauthenticated — auth middleware fires first (before full.access)
    // =========================================================================

    public function test_unauthenticated_request_to_api_gets_401_not_403(): void
    {
        $response = $this->getJson('/api/keywords');

        // Auth gate fires before full.access gate
        $response->assertUnauthorized();
    }

    public function test_unauthenticated_request_to_web_page_redirects_to_login(): void
    {
        $response = $this->get('/stats');

        $response->assertRedirect(route('login'));
    }

    // =========================================================================
    // Standard user can still access non-gated API routes
    // =========================================================================

    public function test_standard_user_can_access_grants_data_api(): void
    {
        $response = $this->actingAs($this->standard())
            ->getJson('/api/data');

        $response->assertOk();
    }

    public function test_standard_user_can_access_dashboard(): void
    {
        $response = $this->actingAs($this->standard())
            ->get('/dashboard');

        $response->assertOk();
    }
}
