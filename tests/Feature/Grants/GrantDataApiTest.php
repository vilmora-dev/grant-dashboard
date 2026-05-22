<?php

namespace Tests\Feature\Grants;

use App\Models\GrantUnified;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for the grant data API (Priority 4).
 *
 * Covers:
 *   GET  /api/data             — grant listing + limit param
 *   GET  /api/count            — table row count + allowlist enforcement
 *   PATCH /api/grants/{id}     — field validation edge cases
 *   PATCH /api/grants_gov/{id} — alias route (same underlying action)
 */
class GrantDataApiTest extends TestCase
{
    use RefreshDatabase;

    // =========================================================================
    // Helpers
    // =========================================================================

    private function standardUser(): User
    {
        return User::factory()->standardAccess()->create();
    }

    private function fullUser(): User
    {
        return User::factory()->fullAccess()->create();
    }

    private function grant(array $overrides = []): GrantUnified
    {
        return GrantUnified::factory()->create($overrides);
    }

    // =========================================================================
    // GET /api/data — authentication
    // =========================================================================

    public function test_data_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/data')->assertUnauthorized();
    }

    public function test_data_endpoint_accessible_to_standard_user(): void
    {
        $user = $this->standardUser();
        $this->actingAs($user)->getJson('/api/data')->assertOk();
    }

    public function test_data_endpoint_accessible_to_full_access_user(): void
    {
        $user = $this->fullUser();
        $this->actingAs($user)->getJson('/api/data')->assertOk();
    }

    // =========================================================================
    // GET /api/data — response structure
    // =========================================================================

    public function test_data_endpoint_returns_grants_and_status_keys(): void
    {
        $user = $this->standardUser();
        $this->grant();

        $response = $this->actingAs($user)->getJson('/api/data');

        $response->assertOk()
                 ->assertJsonStructure(['grants', 'status']);
    }

    public function test_data_endpoint_returns_true_status(): void
    {
        $user = $this->standardUser();

        $response = $this->actingAs($user)->getJson('/api/data');

        $response->assertOk();
        $this->assertTrue($response->json('status'));
    }

    public function test_data_endpoint_returns_all_grants_when_under_limit(): void
    {
        $user = $this->standardUser();
        GrantUnified::factory()->count(3)->create();

        $response = $this->actingAs($user)->getJson('/api/data');

        $response->assertOk();
        $this->assertCount(3, $response->json('grants'));
    }

    public function test_data_endpoint_respects_limit_query_param(): void
    {
        $user = $this->standardUser();
        GrantUnified::factory()->count(10)->create();

        $response = $this->actingAs($user)->getJson('/api/data?limit=3');

        $response->assertOk();
        $this->assertCount(3, $response->json('grants'));
    }

    public function test_data_endpoint_returns_empty_grants_array_when_no_grants(): void
    {
        $user = $this->standardUser();

        $response = $this->actingAs($user)->getJson('/api/data');

        $response->assertOk();
        $this->assertIsArray($response->json('grants'));
        $this->assertCount(0, $response->json('grants'));
    }

    // =========================================================================
    // GET /api/count — authentication and allowed tables
    // =========================================================================

    public function test_count_endpoint_requires_authentication(): void
    {
        $this->getJson('/api/count')->assertUnauthorized();
    }

    public function test_count_endpoint_returns_count_for_grants_table(): void
    {
        $user = $this->standardUser();
        GrantUnified::factory()->count(4)->create();

        $response = $this->actingAs($user)->getJson('/api/count?table=grants');

        $response->assertOk();
        $this->assertSame(4, $response->json('count'));
    }

    public function test_count_endpoint_defaults_to_grants_table(): void
    {
        $user = $this->standardUser();
        GrantUnified::factory()->count(2)->create();

        $response = $this->actingAs($user)->getJson('/api/count');

        $response->assertOk();
        $this->assertSame(2, $response->json('count'));
    }

    public function test_count_endpoint_returns_403_for_disallowed_table(): void
    {
        $user = $this->standardUser();

        $this->actingAs($user)
             ->getJson('/api/count?table=users')
             ->assertForbidden();
    }

    public function test_count_endpoint_returns_403_for_unknown_table(): void
    {
        $user = $this->standardUser();

        $this->actingAs($user)
             ->getJson('/api/count?table=secret_table')
             ->assertForbidden();
    }

    public function test_count_endpoint_accessible_to_standard_user(): void
    {
        $user = $this->standardUser();

        $this->actingAs($user)
             ->getJson('/api/count?table=grants')
             ->assertOk();
    }

    // =========================================================================
    // PATCH /api/grants/{id} — validation edge cases
    // =========================================================================

    public function test_patch_rejects_invalid_boolean_field(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant();

        $this->actingAs($user)
             ->patchJson("/api/grants/{$grant->id}", ['starred' => 'not-a-bool'])
             ->assertUnprocessable();
    }

    public function test_patch_accepts_null_for_nullable_string_fields(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['notes' => 'Some note', 'amount' => '$5,000']);

        $this->actingAs($user)
             ->patchJson("/api/grants/{$grant->id}", ['notes' => null, 'amount' => null])
             ->assertOk();

        $grant->refresh();
        $this->assertNull($grant->notes);
        $this->assertNull($grant->amount);
    }

    public function test_patch_rejects_unknown_field_as_no_fields_to_update(): void
    {
        // Unknown fields are stripped by validate(), leaving $data empty → 400
        $user  = $this->standardUser();
        $grant = $this->grant();

        $this->actingAs($user)
             ->patchJson("/api/grants/{$grant->id}", ['completely_unknown_field' => 'value'])
             ->assertStatus(400)
             ->assertJson(['error' => 'No fields to update']);
    }

    public function test_patch_returns_updated_grant_in_response(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['starred' => false]);

        $response = $this->actingAs($user)
                         ->patchJson("/api/grants/{$grant->id}", ['starred' => true]);

        $response->assertOk();
        $this->assertTrue($response->json('starred'));
    }

    public function test_patch_allows_partial_update_leaving_other_fields_unchanged(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['starred' => false, 'applied' => true]);

        $this->actingAs($user)
             ->patchJson("/api/grants/{$grant->id}", ['starred' => true])
             ->assertOk();

        $grant->refresh();
        $this->assertTrue($grant->starred);
        $this->assertTrue($grant->applied);  // untouched
    }

    public function test_patch_requires_authentication(): void
    {
        $grant = $this->grant();

        $this->patchJson("/api/grants/{$grant->id}", ['starred' => true])
             ->assertUnauthorized();
    }

    public function test_patch_returns_404_for_nonexistent_grant(): void
    {
        $user = $this->standardUser();

        $this->actingAs($user)
             ->patchJson('/api/grants/99999', ['starred' => true])
             ->assertNotFound();
    }

    // =========================================================================
    // PATCH /api/grants_gov/{id} — alias
    // =========================================================================

    public function test_grants_gov_alias_updates_same_grant_row(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['starred' => false]);

        $this->actingAs($user)
             ->patchJson("/api/grants_gov/{$grant->id}", ['starred' => true])
             ->assertOk();

        $grant->refresh();
        $this->assertTrue($grant->starred);
    }

    public function test_grants_gov_alias_creates_audit_log_entry(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['starred' => false]);

        $this->actingAs($user)
             ->patchJson("/api/grants_gov/{$grant->id}", ['starred' => true]);

        $this->assertDatabaseHas('grant_action_logs', [
            'grant_id' => $grant->id,
            'action'   => 'starred',
        ]);
    }

    public function test_grants_gov_alias_returns_404_for_nonexistent_grant(): void
    {
        $user = $this->standardUser();

        $this->actingAs($user)
             ->patchJson('/api/grants_gov/99999', ['starred' => true])
             ->assertNotFound();
    }

    public function test_grants_gov_alias_requires_authentication(): void
    {
        $grant = $this->grant();

        $this->patchJson("/api/grants_gov/{$grant->id}", ['starred' => true])
             ->assertUnauthorized();
    }
}
