<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Login screen
    // -------------------------------------------------------------------------

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    // -------------------------------------------------------------------------
    // Successful login
    // -------------------------------------------------------------------------

    public function test_active_user_can_log_in_with_correct_credentials(): void
    {
        $user = User::factory()->standardAccess()->create();

        $response = $this->post('/login', [
            'email'    => $user->email,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_login_updates_last_login_at_timestamp(): void
    {
        $user = User::factory()->standardAccess()->create(['last_login_at' => null]);

        $this->post('/login', [
            'email'    => $user->email,
            'password' => 'password',
        ]);

        $this->assertNotNull($user->fresh()->last_login_at);
    }

    // -------------------------------------------------------------------------
    // Failed login — wrong credentials
    // -------------------------------------------------------------------------

    public function test_user_cannot_authenticate_with_wrong_password(): void
    {
        $user = User::factory()->create();

        $this->post('/login', [
            'email'    => $user->email,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_wrong_password_produces_validation_error_on_email_field(): void
    {
        $user = User::factory()->create();

        $response = $this->from('/login')->post('/login', [
            'email'    => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertSessionHasErrors('email');
    }

    // -------------------------------------------------------------------------
    // Inactive account rejection
    // -------------------------------------------------------------------------

    public function test_inactive_user_cannot_log_in_even_with_correct_password(): void
    {
        $user = User::factory()->inactive()->create();

        $this->post('/login', [
            'email'    => $user->email,
            'password' => 'password',
        ]);

        // Auth::attempt() succeeds but the controller logs them out immediately
        $this->assertGuest();
    }

    public function test_inactive_user_login_produces_deactivated_error_message(): void
    {
        $user = User::factory()->inactive()->create();

        $response = $this->from('/login')->post('/login', [
            'email'    => $user->email,
            'password' => 'password',
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertStringContainsString(
            'deactivated',
            session('errors')->first('email')
        );
    }

    // -------------------------------------------------------------------------
    // First-login redirect
    // -------------------------------------------------------------------------

    public function test_user_who_must_change_password_is_redirected_to_set_password(): void
    {
        // Login succeeds, but any subsequent web request hits ForcePasswordChange
        $user = User::factory()->mustChangePassword()->create();

        // Log in
        $this->post('/login', [
            'email'    => $user->email,
            'password' => 'password',
        ]);

        // Next request to a protected page should redirect to /set-password
        $response = $this->actingAs($user)->get('/dashboard');
        $response->assertRedirect(route('password.set'));
    }

    public function test_user_who_must_change_password_can_still_access_set_password_screen(): void
    {
        $user = User::factory()->mustChangePassword()->create();

        $response = $this->actingAs($user)->get('/set-password');

        // Must not loop back to itself
        $response->assertOk();
    }

    // -------------------------------------------------------------------------
    // Logout
    // -------------------------------------------------------------------------

    public function test_authenticated_user_can_log_out(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }
}
