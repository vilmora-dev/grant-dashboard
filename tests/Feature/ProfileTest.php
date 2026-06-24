<?php

namespace Tests\Feature;

use App\Models\GrantActionLog;
use App\Models\GrantUnified;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/profile');

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('test@example.com', $user->email);
        $this->assertNull($user->email_verified_at);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => $user->email,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_user_can_delete_their_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete('/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());
    }

    public function test_user_with_claimed_grants_and_action_history_can_delete_their_account(): void
    {
        // Regression test for a bug where grant_action_logs.user_id was wired
        // with restrictOnDelete() instead of nullOnDelete(), even though the
        // column is nullable specifically to support this case. Any user who
        // had claimed a grant (which always writes an action_log row) could
        // never delete their account — $user->delete() threw an uncaught
        // QueryException (MySQL 1451), surfaced to the user as a generic 500.
        $user = User::factory()->create();
        $userName = $user->name;
        $grant = GrantUnified::factory()->create([
            'claimed_by_user_id' => $user->id,
            'claimed_at' => now(),
        ]);

        $log = GrantActionLog::create([
            'grant_id' => $grant->id,
            'user_id' => $user->id,
            'action' => GrantActionLog::ACTION_CLAIMED,
            'old_value' => null,
            'new_value' => ['claimed_by_user_id' => $user->id],
            'ip_address' => '127.0.0.1',
            'user_agent' => 'phpunit',
            'created_at' => now(),
        ]);

        $response = $this
            ->actingAs($user)
            ->delete('/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/');

        $this->assertGuest();
        $this->assertNull($user->fresh());

        // The grant itself survives, with the claim cleared (nullOnDelete on grants.claimed_by_user_id)
        $this->assertNotNull($grant->fresh());
        $this->assertNull($grant->fresh()->claimed_by_user_id);

        // The audit log row survives too, now detached from the deleted user
        // (nullOnDelete on grant_action_logs.user_id — the actual fix under test)
        $this->assertNotNull($log->fresh());
        $this->assertNull($log->fresh()->user_id);

        // The user's name was snapshotted onto the log before deletion, so
        // their history doesn't collapse into the generic "System" label
        // alongside real scraper/AI rows (see GrantDataController::logs()).
        $this->assertSame($userName, $log->fresh()->deleted_user_name);

        // An admin viewing this grant's history sees the deleted user's name,
        // not "System".
        $admin = User::factory()->create(['role' => 'full']);
        $logsResponse = $this
            ->actingAs($admin)
            ->getJson("/api/grants/{$grant->id}/logs");

        $logsResponse->assertOk();
        $returnedLog = collect($logsResponse->json('logs'))->firstWhere('id', $log->id);
        $this->assertNotNull($returnedLog);
        $this->assertSame("{$userName} (deleted)", $returnedLog['user_name']);
        $this->assertFalse($returnedLog['is_me']);
    }

    public function test_correct_password_must_be_provided_to_delete_account(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->delete('/profile', [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertSessionHasErrors('password')
            ->assertRedirect('/profile');

        $this->assertNotNull($user->fresh());
    }
}
