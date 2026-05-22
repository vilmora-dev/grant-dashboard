<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Tests for PUT /password (PasswordController::update).
 *
 * This is the in-profile "change your own password" flow — the user must
 * supply their current password plus a confirmed new one.
 * It is separate from the admin-driven reset (POST /api/team/{id}/reset-password)
 * and the forced first-login flow (POST /set-password).
 */
class PasswordUpdateTest extends TestCase
{
    use RefreshDatabase;

    // =========================================================================
    // Helpers
    // =========================================================================

    /** A fully active user whose factory-default password is 'password'. */
    private function activeUser(): User
    {
        return User::factory()->standardAccess()->create();
    }

    // =========================================================================
    // Success
    // =========================================================================

    public function test_password_can_be_updated_with_correct_current_password(): void
    {
        $user = $this->activeUser();

        $response = $this->actingAs($user)
                         ->from('/profile')
                         ->put('/password', [
                             'current_password'      => 'password',
                             'password'              => 'NewStr0ng!Pass',
                             'password_confirmation' => 'NewStr0ng!Pass',
                         ]);

        $response->assertSessionHasNoErrors()
                 ->assertRedirect();

        $this->assertTrue(Hash::check('NewStr0ng!Pass', $user->refresh()->password));
    }

    public function test_password_update_does_not_affect_other_user_fields(): void
    {
        $user = $this->activeUser();
        $originalName  = $user->name;
        $originalEmail = $user->email;
        $originalRole  = $user->role;

        $this->actingAs($user)
             ->from('/profile')
             ->put('/password', [
                 'current_password'      => 'password',
                 'password'              => 'NewStr0ng!Pass',
                 'password_confirmation' => 'NewStr0ng!Pass',
             ]);

        $user->refresh();
        $this->assertSame($originalName,  $user->name);
        $this->assertSame($originalEmail, $user->email);
        $this->assertSame($originalRole,  $user->role);
    }

    public function test_password_update_works_for_full_access_user(): void
    {
        $user = User::factory()->fullAccess()->create();

        $response = $this->actingAs($user)
                         ->from('/profile')
                         ->put('/password', [
                             'current_password'      => 'password',
                             'password'              => 'NewStr0ng!Pass',
                             'password_confirmation' => 'NewStr0ng!Pass',
                         ]);

        $response->assertSessionHasNoErrors();
        $this->assertTrue(Hash::check('NewStr0ng!Pass', $user->refresh()->password));
    }

    // =========================================================================
    // Wrong current password
    // =========================================================================

    public function test_wrong_current_password_is_rejected(): void
    {
        $user = $this->activeUser();

        $response = $this->actingAs($user)
                         ->from('/profile')
                         ->put('/password', [
                             'current_password'      => 'totally-wrong',
                             'password'              => 'NewStr0ng!Pass',
                             'password_confirmation' => 'NewStr0ng!Pass',
                         ]);

        $response->assertSessionHasErrors('current_password')
                 ->assertRedirect('/profile');

        // Password must not have changed
        $this->assertTrue(Hash::check('password', $user->refresh()->password));
    }

    // =========================================================================
    // New-password validation
    // =========================================================================

    public function test_password_confirmation_mismatch_is_rejected(): void
    {
        $user = $this->activeUser();

        $response = $this->actingAs($user)
                         ->from('/profile')
                         ->put('/password', [
                             'current_password'      => 'password',
                             'password'              => 'NewStr0ng!Pass',
                             'password_confirmation' => 'DifferentPass!',
                         ]);

        $response->assertSessionHasErrors('password');
        $this->assertTrue(Hash::check('password', $user->refresh()->password));
    }

    public function test_new_password_must_meet_minimum_length(): void
    {
        $user = $this->activeUser();

        $response = $this->actingAs($user)
                         ->from('/profile')
                         ->put('/password', [
                             'current_password'      => 'password',
                             'password'              => 'short',
                             'password_confirmation' => 'short',
                         ]);

        $response->assertSessionHasErrors('password');
        $this->assertTrue(Hash::check('password', $user->refresh()->password));
    }

    public function test_new_password_field_is_required(): void
    {
        $user = $this->activeUser();

        $this->actingAs($user)
             ->from('/profile')
             ->put('/password', [
                 'current_password' => 'password',
             ])
             ->assertSessionHasErrors('password');
    }

    public function test_current_password_field_is_required(): void
    {
        $user = $this->activeUser();

        $this->actingAs($user)
             ->from('/profile')
             ->put('/password', [
                 'password'              => 'NewStr0ng!Pass',
                 'password_confirmation' => 'NewStr0ng!Pass',
             ])
             ->assertSessionHasErrors('current_password');
    }

    // =========================================================================
    // Authentication
    // =========================================================================

    public function test_unauthenticated_user_cannot_update_password(): void
    {
        $this->put('/password', [
            'current_password'      => 'password',
            'password'              => 'NewStr0ng!Pass',
            'password_confirmation' => 'NewStr0ng!Pass',
        ])->assertRedirect('/login');
    }
}
