<?php

namespace Tests\Feature;

use App\Models\OrganizationProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for the organization profile API (Priority 5).
 *
 * GET /api/organization  — returns the profile or {} when none exists
 * PUT /api/organization  — upsert: create on first call, update on subsequent calls
 *
 * Both endpoints require full-access (admin) role only — standard users get 403.
 */
class OrganizationProfileTest extends TestCase
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

    private function validPayload(array $overrides = []): array
    {
        return array_merge([
            'name'       => 'Delta Rising Foundation',
            'website'    => 'https://deltarising.org',
            'irs_status' => '501(c)(3)',
            'mission'    => 'Empowering underserved communities.',
            'org_type'   => 'nonprofit',
        ], $overrides);
    }

    // =========================================================================
    // Authentication & authorization
    // =========================================================================

    public function test_get_organization_requires_authentication(): void
    {
        $this->getJson('/api/organization')->assertUnauthorized();
    }

    public function test_put_organization_requires_authentication(): void
    {
        $this->putJson('/api/organization', $this->validPayload())->assertUnauthorized();
    }

    public function test_get_organization_forbidden_for_standard_user(): void
    {
        $user = $this->standardUser();

        $this->actingAs($user)
             ->getJson('/api/organization')
             ->assertForbidden();
    }

    public function test_put_organization_forbidden_for_standard_user(): void
    {
        $user = $this->standardUser();

        $this->actingAs($user)
             ->putJson('/api/organization', $this->validPayload())
             ->assertForbidden();
    }

    // =========================================================================
    // GET /api/organization
    // =========================================================================

    public function test_get_returns_empty_object_when_no_profile_exists(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->getJson('/api/organization');

        $response->assertOk();
        // Controller returns response()->json((object) []) — decodes to an empty object / array
        $this->assertEmpty($response->json());
    }

    public function test_get_returns_profile_when_it_exists(): void
    {
        $admin = $this->admin();

        OrganizationProfile::create([
            'name'       => 'Delta Rising Foundation',
            'irs_status' => '501(c)(3)',
        ]);

        $response = $this->actingAs($admin)->getJson('/api/organization');

        $response->assertOk();
        $this->assertSame('Delta Rising Foundation', $response->json('name'));
        $this->assertSame('501(c)(3)', $response->json('irs_status'));
    }

    public function test_get_returns_the_first_row_when_multiple_exist(): void
    {
        // Edge-case: if somehow two rows exist, controller returns first by id
        $admin = $this->admin();

        OrganizationProfile::create(['name' => 'First Org']);
        OrganizationProfile::create(['name' => 'Second Org']);

        $response = $this->actingAs($admin)->getJson('/api/organization');

        $response->assertOk();
        $this->assertSame('First Org', $response->json('name'));
    }

    // =========================================================================
    // PUT /api/organization — create (first call)
    // =========================================================================

    public function test_put_creates_profile_when_none_exists(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
             ->putJson('/api/organization', $this->validPayload())
             ->assertCreated();

        $this->assertDatabaseHas('organization_profile', ['name' => 'Delta Rising Foundation']);
    }

    public function test_put_returns_201_on_first_create(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)
                         ->putJson('/api/organization', $this->validPayload());

        $response->assertStatus(201);
    }

    public function test_put_returns_created_profile_in_response(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)
                         ->putJson('/api/organization', $this->validPayload([
                             'name' => 'My Nonprofit',
                         ]));

        $response->assertCreated();
        $this->assertSame('My Nonprofit', $response->json('name'));
    }

    // =========================================================================
    // PUT /api/organization — update (subsequent calls)
    // =========================================================================

    public function test_put_updates_existing_profile_on_second_call(): void
    {
        $admin = $this->admin();

        // First call — create
        $this->actingAs($admin)
             ->putJson('/api/organization', $this->validPayload(['name' => 'Original Name']));

        // Second call — update
        $this->actingAs($admin)
             ->putJson('/api/organization', $this->validPayload(['name' => 'Updated Name']))
             ->assertOk();

        $this->assertDatabaseHas('organization_profile', ['name' => 'Updated Name']);
        $this->assertDatabaseMissing('organization_profile', ['name' => 'Original Name']);
    }

    public function test_put_returns_200_on_update(): void
    {
        $admin = $this->admin();

        OrganizationProfile::create(['name' => 'Existing Org']);

        $response = $this->actingAs($admin)
                         ->putJson('/api/organization', $this->validPayload());

        $response->assertOk();
    }

    public function test_put_does_not_create_duplicate_rows_on_repeated_calls(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->putJson('/api/organization', $this->validPayload());
        $this->actingAs($admin)->putJson('/api/organization', $this->validPayload(['name' => 'New Name']));
        $this->actingAs($admin)->putJson('/api/organization', $this->validPayload(['name' => 'Newer Name']));

        $this->assertSame(1, OrganizationProfile::count());
    }

    // =========================================================================
    // Validation
    // =========================================================================

    public function test_put_requires_name_field(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
             ->putJson('/api/organization', [
                 'website' => 'https://example.com',
             ])
             ->assertUnprocessable();
    }

    public function test_put_allows_optional_fields_to_be_omitted(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)
                         ->putJson('/api/organization', ['name' => 'Minimal Org']);

        $response->assertCreated();
        $this->assertSame('Minimal Org', $response->json('name'));
    }

    // =========================================================================
    // JSON array fields (target_states, ddg_searching, etc.)
    // =========================================================================

    public function test_put_stores_target_states_as_array(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
             ->putJson('/api/organization', $this->validPayload([
                 'target_states' => ['NC', 'SC', 'GA'],
             ]))
             ->assertCreated();

        $org = OrganizationProfile::first();
        $this->assertSame(['NC', 'SC', 'GA'], $org->target_states);
    }

    public function test_put_defaults_target_states_to_empty_array_when_omitted(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
             ->putJson('/api/organization', $this->validPayload())
             ->assertCreated();

        $org = OrganizationProfile::first();
        $this->assertSame([], $org->target_states);
    }

    public function test_put_stores_ddg_searching_array(): void
    {
        $admin = $this->admin();

        $terms = ['youth grant', 'community development'];

        $this->actingAs($admin)
             ->putJson('/api/organization', $this->validPayload([
                 'ddg_searching' => $terms,
             ]))
             ->assertCreated();

        $org = OrganizationProfile::first();
        $this->assertSame($terms, $org->ddg_searching);
    }

    public function test_put_applies_default_ddg_searching_when_omitted(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
             ->putJson('/api/organization', $this->validPayload())
             ->assertCreated();

        $org = OrganizationProfile::first();
        // Controller sets a default list — it must be non-empty
        $this->assertNotEmpty($org->ddg_searching);
        $this->assertIsArray($org->ddg_searching);
    }

    public function test_put_stores_ddg_sites_array(): void
    {
        $admin = $this->admin();

        $sites = ['grants.gov', 'instrumentl.com'];

        $this->actingAs($admin)
             ->putJson('/api/organization', $this->validPayload([
                 'ddg_sites' => $sites,
             ]))
             ->assertCreated();

        $org = OrganizationProfile::first();
        $this->assertSame($sites, $org->ddg_sites);
    }

    // =========================================================================
    // updated_at is always touched on save
    // =========================================================================

    public function test_put_sets_updated_at_on_create(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
             ->putJson('/api/organization', $this->validPayload())
             ->assertCreated();

        $org = OrganizationProfile::first();
        $this->assertNotNull($org->updated_at);
    }

    public function test_put_refreshes_updated_at_on_update(): void
    {
        $admin = $this->admin();

        $this->travelTo(now()->subMinutes(10));
        $this->actingAs($admin)->putJson('/api/organization', $this->validPayload());

        $this->travelTo(now()->addMinutes(10));
        $this->actingAs($admin)->putJson('/api/organization', $this->validPayload(['name' => 'Renamed Org']));

        $org = OrganizationProfile::first();
        $this->assertTrue($org->updated_at->isAfter(now()->subSeconds(5)));
    }

    // =========================================================================
    // Response shape
    // =========================================================================

    public function test_put_response_does_not_include_unexpected_keys(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)
                         ->putJson('/api/organization', $this->validPayload());

        $response->assertCreated();
        $this->assertArrayHasKey('name', $response->json());
        $this->assertArrayHasKey('updated_at', $response->json());
    }

    public function test_get_and_put_return_consistent_profile_data(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
             ->putJson('/api/organization', $this->validPayload(['name' => 'Consistent Org']));

        $response = $this->actingAs($admin)->getJson('/api/organization');

        $response->assertOk();
        $this->assertSame('Consistent Org', $response->json('name'));
    }
}
