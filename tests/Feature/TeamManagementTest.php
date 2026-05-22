<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Feature tests for team management (Priority 3 — part 1).
 *
 * Covers: listing users, creating users, updating users,
 * the self-lockout guard, and admin password reset.
 * Role-gating is proven in RequireFullAccessTest; here we focus
 * on the business logic inside the controller methods themselves.
 */
class TeamManagementTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->fullAccess()->create();
    }

    // =========================================================================
    // GET /api/team — list users
    // =========================================================================

    public function test_team_index_returns_all_users(): void
    {
        $admin = $this->admin();
        User::factory()->standardAccess()->count(3)->create();

        $response = $this->actingAs($admin)->getJson('/api/team');

        $response->assertOk();
        // 4 total: 1 admin + 3 standard
        $this->assertCount(4, $response->json());
    }

    public function test_team_index_never_includes_password_hash(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->getJson('/api/team');

        $response->assertOk();
        foreach ($response->json() as $user) {
            $this->assertArrayNotHasKey('password', $user);
            $this->assertArrayNotHasKey('remember_token', $user);
        }
    }

    public function test_team_index_includes_expected_fields(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->getJson('/api/team');

        $response->assertOk();
        $user = $response->json()[0];
        foreach (['id', 'name', 'email', 'role', 'is_active', 'created_at'] as $field) {
            $this->assertArrayHasKey($field, $user, "Missing field: {$field}");
        }
    }

    // =========================================================================
    // POST /api/team — create user
    // =========================================================================

    public function test_admin_can_create_a_new_user(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->postJson('/api/team', [
            'name'     => 'New User',
            'email'    => 'new@example.com',
            'password' => 'TempPass1!',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('users', ['email' => 'new@example.com']);
    }

    public function test_new_user_defaults_to_standard_role(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->postJson('/api/team', [
            'name'     => 'Standard User',
            'email'    => 'standard@example.com',
            'password' => 'TempPass1!',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'standard@example.com',
            'role'  => 'standard',
        ]);
    }

    public function test_admin_can_create_a_full_access_user(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->postJson('/api/team', [
            'name'     => 'Power User',
            'email'    => 'power@example.com',
            'password' => 'TempPass1!',
            'role'     => 'full',
        ]);

        $this->assertDatabaseHas('users', ['email' => 'power@example.com', 'role' => 'full']);
    }

    public function test_invalid_role_is_rejected(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->postJson('/api/team', [
            'name'     => 'Bad Role',
            'email'    => 'bad@example.com',
            'password' => 'TempPass1!',
            'role'     => 'superadmin',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('role');
    }

    public function test_duplicate_email_is_rejected_with_422(): void
    {
        $admin    = $this->admin();
        $existing = User::factory()->create(['email' => 'taken@example.com']);

        $response = $this->actingAs($admin)->postJson('/api/team', [
            'name'     => 'Clone',
            'email'    => 'taken@example.com',
            'password' => 'TempPass1!',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_short_password_is_rejected(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->postJson('/api/team', [
            'name'     => 'Short Pass',
            'email'    => 'short@example.com',
            'password' => 'abc',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    // =========================================================================
    // PATCH /api/team/{id} — update user
    // =========================================================================

    public function test_admin_can_update_another_users_name(): void
    {
        $admin  = $this->admin();
        $target = User::factory()->standardAccess()->create(['name' => 'Old Name']);

        $this->actingAs($admin)->patchJson("/api/team/{$target->id}", [
            'name' => 'New Name',
        ])->assertOk();

        $this->assertSame('New Name', $target->fresh()->name);
    }

    public function test_admin_can_deactivate_another_user(): void
    {
        $admin  = $this->admin();
        $target = User::factory()->standardAccess()->create();

        $this->actingAs($admin)->patchJson("/api/team/{$target->id}", [
            'is_active' => false,
        ])->assertOk();

        $this->assertFalse($target->fresh()->is_active);
    }

    public function test_admin_can_promote_user_to_full_access(): void
    {
        $admin  = $this->admin();
        $target = User::factory()->standardAccess()->create();

        $this->actingAs($admin)->patchJson("/api/team/{$target->id}", [
            'role' => 'full',
        ])->assertOk();

        $this->assertSame('full', $target->fresh()->role);
    }

    // =========================================================================
    // Self-lockout guard
    // =========================================================================

    public function test_admin_cannot_deactivate_their_own_account(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->patchJson("/api/team/{$admin->id}", [
            'is_active' => false,
        ]);

        // Controller silently strips the field and returns 400 (no valid fields left)
        $response->assertStatus(400);
        $this->assertTrue($admin->fresh()->is_active);
    }

    public function test_admin_cannot_demote_their_own_role(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->patchJson("/api/team/{$admin->id}", [
            'role' => 'standard',
        ]);

        $response->assertStatus(400);
        $this->assertSame('full', $admin->fresh()->role);
    }

    public function test_admin_can_still_update_their_own_name(): void
    {
        $admin = $this->admin();

        // name is NOT stripped by the self-lockout guard
        $response = $this->actingAs($admin)->patchJson("/api/team/{$admin->id}", [
            'name' => 'Updated Name',
        ]);

        $response->assertOk();
        $this->assertSame('Updated Name', $admin->fresh()->name);
    }

    public function test_update_with_only_guarded_fields_returns_400(): void
    {
        $admin = $this->admin();

        // Sending only is_active + role for yourself → both stripped → nothing left
        $response = $this->actingAs($admin)->patchJson("/api/team/{$admin->id}", [
            'is_active' => false,
            'role'      => 'standard',
        ]);

        $response->assertStatus(400)
                 ->assertJson(['error' => 'No valid fields to update.']);
    }

    public function test_update_nonexistent_user_returns_404(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->patchJson('/api/team/99999', [
            'name' => 'Ghost',
        ]);

        $response->assertNotFound();
    }

    // =========================================================================
    // POST /api/team/{id}/reset-password
    // =========================================================================

    public function test_admin_can_reset_a_users_password(): void
    {
        $admin  = $this->admin();
        $target = User::factory()->standardAccess()->create();

        $response = $this->actingAs($admin)->postJson("/api/team/{$target->id}/reset-password", [
            'password' => 'NewTemp99!',
        ]);

        $response->assertOk();
        $this->assertTrue(Hash::check('NewTemp99!', $target->fresh()->password));
    }

    public function test_password_reset_forces_must_change_password(): void
    {
        $admin  = $this->admin();
        $target = User::factory()->standardAccess()->create(['must_change_password' => false]);

        $this->actingAs($admin)->postJson("/api/team/{$target->id}/reset-password", [
            'password' => 'NewTemp99!',
        ]);

        $this->assertTrue($target->fresh()->must_change_password);
    }

    public function test_password_reset_returns_name_and_email(): void
    {
        $admin  = $this->admin();
        $target = User::factory()->standardAccess()->create([
            'name'  => 'Target User',
            'email' => 'target@example.com',
        ]);

        $response = $this->actingAs($admin)->postJson("/api/team/{$target->id}/reset-password", [
            'password' => 'NewTemp99!',
        ]);

        $response->assertOk()
                 ->assertJson(['name' => 'Target User', 'email' => 'target@example.com']);
    }
}
