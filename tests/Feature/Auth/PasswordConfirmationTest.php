<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Tests for the password-confirmation gate (GET/POST /confirm-password).
 *
 * Laravel's built-in password.confirm middleware re-prompts the user to
 * re-enter their current password before allowing access to sensitive actions
 * (e.g. deleting an account, changing security settings). On success it stores
 * a timestamp in the session so the user is not prompted again for ~3 hours.
 *
 * This is NOT email verification, NOT the admin reset flow, and NOT the
 * forced first-login set-password flow -- it is purely the re-confirm prompt.
 */
class PasswordConfirmationTest extends TestCase
{
    use RefreshDatabase;

    // =========================================================================
    // Helpers
    // =========================================================================

    private function activeUser(): User
    {
        return User::factory()->standardAccess()->create();
    }

    // =========================================================================
    // GET /confirm-password -- screen rendering
    // =========================================================================

    public function test_confirm_password_screen_renders_for_authenticated_user(): void
    {
        $user = $this->activeUser();

        $this->actingAs($user)
             ->get('/confirm-password')
             ->assertOk();
    }

    public function test_confirm_password_screen_redirects_unauthenticated_user_to_login(): void
    {
        $this->get('/confirm-password')
             ->assertRedirect('/login');
    }

    // =========================================================================
    // POST /confirm-password -- success
    // =========================================================================

    public function test_correct_password_passes_confirmation(): void
    {
        $user = $this->activeUser();

        $response = $this->actingAs($user)
                         ->post('/confirm-password', ['password' => 'password']);

        $response->assertRedirect()
                 ->assertSessionHasNoErrors();
    }

    public function test_successful_confirmation_stores_timestamp_in_session(): void
    {
        $user = $this->activeUser();

        $this->actingAs($user)
             ->post('/confirm-password', ['password' => 'password']);

        // Laravel stores auth.password_confirmed_at in the session on success
        $this->assertNotNull(session('auth.password_confirmed_at'));
    }

    public function test_confirmation_works_for_full_access_user(): void
    {
        $user = User::factory()->fullAccess()->create();

        $this->actingAs($user)
             ->post('/confirm-password', ['password' => 'password'])
             ->assertRedirect()
             ->assertSessionHasNoErrors();
    }

    // =========================================================================
    // POST /confirm-password -- failure
    // =========================================================================

    public function test_wrong_password_fails_confirmation(): void
    {
        $user = $this->activeUser();

        $this->actingAs($user)
             ->post('/confirm-password', ['password' => 'wrong-password'])
             ->assertSessionHasErrors('password');
    }

    public function test_wrong_password_does_not_store_session_timestamp(): void
    {
        $user = $this->activeUser();

        $this->actingAs($user)
             ->post('/confirm-password', ['password' => 'wrong-password']);

        $this->assertNull(session('auth.password_confirmed_at'));
    }

    public function test_empty_password_fails_confirmation(): void
    {
        $user = $this->activeUser();

        $this->actingAs($user)
             ->post('/confirm-password', ['password' => ''])
             ->assertSessionHasErrors('password');
    }
}
