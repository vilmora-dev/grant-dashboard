<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * User creation tests — reflects the actual workflow.
 *
 * This app has no public /register route. New accounts are created by a
 * full-access admin via POST /api/team. The new user receives a temporary
 * password, is forced to change it on first login, and then can access the
 * dashboard normally.
 */
class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    // -------------------------------------------------------------------------
    // Admin creates a new team member
    // -------------------------------------------------------------------------

    public function test_full_access_user_can_create_a_new_team_member(): void
    {
        $admin = User::factory()->fullAccess()->create();

        $response = $this->actingAs($admin)->postJson('/api/team', [
            'name'     => 'Jane Doe',
            'email'    => 'jane@example.com',
            'password' => 'Temp1234!',
            'role'     => 'standard',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('users', [
            'email' => 'jane@example.com',
            'role'  => 'standard',
        ]);
    }

    public function test_new_user_is_flagged_to_change_password_on_first_login(): void
    {
        $admin = User::factory()->fullAccess()->create();

        $this->actingAs($admin)->postJson('/api/team', [
            'name'     => 'John Smith',
            'email'    => 'john@example.com',
            'password' => 'Temp1234!',
        ]);

        $this->assertDatabaseHas('users', [
            'email'                => 'john@example.com',
            'must_change_password' => true,
        ]);
    }

    public function test_temp_password_is_returned_once_in_plaintext_and_hashed_in_db(): void
    {
        $admin = User::factory()->fullAccess()->create();

        $response = $this->actingAs($admin)->postJson('/api/team', [
            'name'     => 'Alice',
            'email'    => 'alice@example.com',
            'password' => 'Temp1234!',
        ]);

        $response->assertCreated()->assertJsonStructure(['user', 'temp_password']);
        $this->assertSame('Temp1234!', $response->json('temp_password'));

        // Must be stored as a hash — never plain-text
        $stored = User::where('email', 'alice@example.com')->value('password');
        $this->assertTrue(Hash::check('Temp1234!', $stored));
        $this->assertNotSame('Temp1234!', $stored);
    }

    public function test_duplicate_email_is_rejected(): void
    {
        $admin    = User::factory()->fullAccess()->create();
        $existing = User::factory()->create(['email' => 'taken@example.com']);

        $response = $this->actingAs($admin)->postJson('/api/team', [
            'name'     => 'Copycat',
            'email'    => 'taken@example.com',
            'password' => 'Temp1234!',
        ]);

        $response->assertUnprocessable()
                 ->assertJsonValidationErrors('email');
    }

    public function test_standard_user_cannot_create_team_members(): void
    {
        $standard = User::factory()->standardAccess()->create();

        $response = $this->actingAs($standard)->postJson('/api/team', [
            'name'     => 'Someone',
            'email'    => 'someone@example.com',
            'password' => 'Temp1234!',
        ]);

        $response->assertForbidden();
        $this->assertDatabaseMissing('users', ['email' => 'someone@example.com']);
    }

    public function test_unauthenticated_request_cannot_create_team_members(): void
    {
        $response = $this->postJson('/api/team', [
            'name'     => 'Ghost',
            'email'    => 'ghost@example.com',
            'password' => 'Temp1234!',
        ]);

        $response->assertUnauthorized();
    }

    public function test_role_defaults_to_standard_when_not_specified(): void
    {
        $admin = User::factory()->fullAccess()->create();

        $this->actingAs($admin)->postJson('/api/team', [
            'name'     => 'Default Role User',
            'email'    => 'default@example.com',
            'password' => 'Temp1234!',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'default@example.com',
            'role'  => 'standard',
        ]);
    }

    public function test_full_role_can_be_assigned_at_creation(): void
    {
        $admin = User::factory()->fullAccess()->create();

        $this->actingAs($admin)->postJson('/api/team', [
            'name'     => 'Power User',
            'email'    => 'power@example.com',
            'password' => 'Temp1234!',
            'role'     => 'full',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'power@example.com',
            'role'  => 'full',
        ]);
    }

    // -------------------------------------------------------------------------
    // First-login: new user sets their own permanent password
    // -------------------------------------------------------------------------

    public function test_new_user_is_redirected_to_set_password_before_dashboard(): void
    {
        $user = User::factory()->mustChangePassword()->create();

        $response = $this->actingAs($user)->get('/dashboard');

        $response->assertRedirect(route('password.set'));
    }

    public function test_new_user_can_set_permanent_password_and_reach_dashboard(): void
    {
        $user = User::factory()->mustChangePassword()->create();

        $response = $this->actingAs($user)->post('/set-password', [
            'password'              => 'NewSecure99!',
            'password_confirmation' => 'NewSecure99!',
        ]);

        $response->assertRedirect(route('dashboard'));

        $user->refresh();
        $this->assertFalse($user->must_change_password);
        $this->assertTrue(Hash::check('NewSecure99!', $user->password));
    }

    public function test_set_password_requires_confirmation(): void
    {
        $user = User::factory()->mustChangePassword()->create();

        $response = $this->actingAs($user)->post('/set-password', [
            'password'              => 'NewSecure99!',
            'password_confirmation' => 'Mismatch999!',
        ]);

        $response->assertSessionHasErrors('password');

        // Flag must stay true — they haven't successfully changed it
        $this->assertTrue($user->fresh()->must_change_password);
    }
}
