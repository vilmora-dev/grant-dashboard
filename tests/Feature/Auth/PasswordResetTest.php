<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Credential recovery tests — reflects the actual workflow.
 *
 * This app has no self-service forgot-password flow (those routes are
 * commented out). Password resets are performed by a full-access admin
 * via POST /api/team/{id}/reset-password. The user then must set a new
 * permanent password on their next login via the /set-password screen.
 */
class PasswordResetTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Admin resets a user's password
    // -------------------------------------------------------------------------

    public function test_admin_can_reset_another_users_password(): void
    {
        $admin  = User::factory()->fullAccess()->create();
        $target = User::factory()->standardAccess()->create();

        $response = $this->actingAs($admin)
            ->postJson("/api/team/{$target->id}/reset-password", [
                'password' => 'TempReset1!',
            ]);

        $response->assertOk()
                 ->assertJsonStructure(['temp_password', 'name', 'email']);
    }

    public function test_reset_returns_plaintext_password_once(): void
    {
        $admin  = User::factory()->fullAccess()->create();
        $target = User::factory()->standardAccess()->create();

        $response = $this->actingAs($admin)
            ->postJson("/api/team/{$target->id}/reset-password", [
                'password' => 'TempReset1!',
            ]);

        $this->assertSame('TempReset1!', $response->json('temp_password'));
    }

    public function test_reset_updates_the_password_hash_in_the_database(): void
    {
        $admin  = User::factory()->fullAccess()->create();
        $target = User::factory()->standardAccess()->create();

        $this->actingAs($admin)
            ->postJson("/api/team/{$target->id}/reset-password", [
                'password' => 'TempReset1!',
            ]);

        $this->assertTrue(Hash::check('TempReset1!', $target->fresh()->password));
    }

    public function test_reset_forces_user_to_change_password_on_next_login(): void
    {
        $admin  = User::factory()->fullAccess()->create();
        $target = User::factory()->standardAccess()->create();

        $this->actingAs($admin)
            ->postJson("/api/team/{$target->id}/reset-password", [
                'password' => 'TempReset1!',
            ]);

        $this->assertTrue($target->fresh()->must_change_password);
    }

    public function test_standard_user_cannot_reset_another_users_password(): void
    {
        $standard = User::factory()->standardAccess()->create();
        $target   = User::factory()->standardAccess()->create();

        $response = $this->actingAs($standard)
            ->postJson("/api/team/{$target->id}/reset-password", [
                'password' => 'TempReset1!',
            ]);

        $response->assertForbidden();
    }

    public function test_reset_password_requires_minimum_length(): void
    {
        $admin  = User::factory()->fullAccess()->create();
        $target = User::factory()->standardAccess()->create();

        $response = $this->actingAs($admin)
            ->postJson("/api/team/{$target->id}/reset-password", [
                'password' => 'short',
            ]);

        $response->assertUnprocessable()
                 ->assertJsonValidationErrors('password');
    }

    public function test_reset_on_nonexistent_user_returns_404(): void
    {
        $admin = User::factory()->fullAccess()->create();

        $response = $this->actingAs($admin)
            ->postJson('/api/team/99999/reset-password', [
                'password' => 'TempReset1!',
            ]);

        $response->assertNotFound();
    }

    // -------------------------------------------------------------------------
    // After reset: user completes the forced set-password flow
    // -------------------------------------------------------------------------

    public function test_user_with_reset_password_is_redirected_to_set_password_screen(): void
    {
        // Simulates a user who has just had their password reset by an admin
        $user = User::factory()->mustChangePassword()->create();

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertRedirect(route('password.set'));
    }

    public function test_set_password_screen_is_accessible_after_reset(): void
    {
        $user = User::factory()->mustChangePassword()->create();

        $response = $this->actingAs($user)->get('/set-password');

        $response->assertOk();
    }

    public function test_user_can_set_new_password_after_admin_reset(): void
    {
        $user = User::factory()->mustChangePassword()->create();

        $response = $this->actingAs($user)->post('/set-password', [
            'password'              => 'MyNewPass99!',
            'password_confirmation' => 'MyNewPass99!',
        ]);

        $response->assertRedirect(route('dashboard'));

        $user->refresh();
        $this->assertFalse($user->must_change_password);
        $this->assertTrue(Hash::check('MyNewPass99!', $user->password));
    }

    public function test_user_cannot_reuse_an_obviously_weak_password(): void
    {
        $user = User::factory()->mustChangePassword()->create();

        // Laravel Password::min(8) rejects anything under 8 characters
        $response = $this->actingAs($user)->post('/set-password', [
            'password'              => 'abc',
            'password_confirmation' => 'abc',
        ]);

        $response->assertSessionHasErrors('password');
        $this->assertTrue($user->fresh()->must_change_password);
    }
}
