<?php

namespace Tests\Feature\Grants;

use App\Models\GrantActionLog;
use App\Models\GrantUnified;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for the grant audit trail (Priority 1).
 *
 * Every PATCH to /api/grants/{id} must:
 *   1. Update the grant row correctly.
 *   2. Create exactly one GrantActionLog row.
 *   3. Store the correct action label, old_value, new_value, and user_id.
 *   4. Truncate long-text fields in the log (the grant row keeps the full value).
 *
 * The logs endpoint enforces role-based visibility:
 *   - Full-access users see every log entry for a grant.
 *   - Standard users see only entries they authored themselves.
 */
class GrantAuditLogTest extends TestCase
{
    use RefreshDatabase;

    // =========================================================================
    // Helpers
    // =========================================================================

    /** Authenticated standard-access user. */
    private function standardUser(): User
    {
        return User::factory()->standardAccess()->create();
    }

    /** Authenticated full-access user. */
    private function fullUser(): User
    {
        return User::factory()->fullAccess()->create();
    }

    /** A plain unreviewed grant. */
    private function grant(array $overrides = []): GrantUnified
    {
        return GrantUnified::factory()->create($overrides);
    }

    /** PATCH /api/grants/{id} as the given user. */
    private function patchGrant(User $user, GrantUnified $grant, array $data)
    {
        return $this->actingAs($user)
                    ->patchJson("/api/grants/{$grant->id}", $data);
    }

    // =========================================================================
    // Basic request behaviour
    // =========================================================================

    public function test_unauthenticated_request_is_rejected(): void
    {
        $grant = $this->grant();

        $this->patchJson("/api/grants/{$grant->id}", ['starred' => true])
             ->assertUnauthorized();
    }

    public function test_empty_payload_returns_400(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant();

        $this->patchGrant($user, $grant, [])
             ->assertStatus(400)
             ->assertJson(['error' => 'No fields to update']);
    }

    public function test_patch_to_nonexistent_grant_returns_404(): void
    {
        $user = $this->standardUser();

        $this->patchGrant($user, new GrantUnified(['id' => 99999]), ['starred' => true])
             ->assertNotFound();
    }

    // =========================================================================
    // One log row per PATCH
    // =========================================================================

    public function test_each_patch_creates_exactly_one_log_entry(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant();

        $this->patchGrant($user, $grant, ['starred' => true]);
        $this->patchGrant($user, $grant, ['starred' => false]);

        $this->assertSame(2, GrantActionLog::where('grant_id', $grant->id)->count());
    }

    // =========================================================================
    // Action label resolution
    // =========================================================================

    public function test_starring_a_grant_writes_starred_action(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['starred' => false]);

        $this->patchGrant($user, $grant, ['starred' => true])->assertOk();

        $this->assertDatabaseHas('grant_action_logs', [
            'grant_id' => $grant->id,
            'user_id'  => $user->id,
            'action'   => 'starred',
        ]);
    }

    public function test_unstarring_a_grant_writes_unstarred_action(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['starred' => true]);

        $this->patchGrant($user, $grant, ['starred' => false])->assertOk();

        $this->assertDatabaseHas('grant_action_logs', [
            'grant_id' => $grant->id,
            'action'   => 'unstarred',
        ]);
    }

    public function test_marking_grant_applied_writes_applied_action(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['applied' => false]);

        $this->patchGrant($user, $grant, ['applied' => true])->assertOk();

        $this->assertDatabaseHas('grant_action_logs', [
            'grant_id' => $grant->id,
            'action'   => 'applied',
        ]);
    }

    public function test_unmarking_grant_applied_writes_unapplied_action(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['applied' => true]);

        $this->patchGrant($user, $grant, ['applied' => false])->assertOk();

        $this->assertDatabaseHas('grant_action_logs', [
            'grant_id' => $grant->id,
            'action'   => 'unapplied',
        ]);
    }

    public function test_setting_ignore_true_writes_discarded_action(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['ignore' => false]);

        $this->patchGrant($user, $grant, ['ignore' => true])->assertOk();

        $this->assertDatabaseHas('grant_action_logs', [
            'grant_id' => $grant->id,
            'action'   => 'discarded',
        ]);
    }

    public function test_setting_ignore_false_writes_restored_action(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['ignore' => true]);

        $this->patchGrant($user, $grant, ['ignore' => false])->assertOk();

        $this->assertDatabaseHas('grant_action_logs', [
            'grant_id' => $grant->id,
            'action'   => 'restored',
        ]);
    }

    public function test_discarding_with_reason_writes_discarded_action(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['ignore' => false]);

        $this->patchGrant($user, $grant, [
            'ignore'         => true,
            'discard_reason' => 'Out of funding area',
        ])->assertOk();

        $this->assertDatabaseHas('grant_action_logs', [
            'grant_id' => $grant->id,
            'action'   => 'discarded',
        ]);
    }

    public function test_updating_notes_writes_notes_updated_action(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['notes' => null]);

        $this->patchGrant($user, $grant, ['notes' => 'Submitted the LOI.'])->assertOk();

        $this->assertDatabaseHas('grant_action_logs', [
            'grant_id' => $grant->id,
            'action'   => 'notes_updated',
        ]);
    }

    public function test_updating_amount_writes_amount_edited_action(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['amount' => '$10,000']);

        $this->patchGrant($user, $grant, ['amount' => '$25,000'])->assertOk();

        $this->assertDatabaseHas('grant_action_logs', [
            'grant_id' => $grant->id,
            'action'   => 'amount_edited',
        ]);
    }

    public function test_updating_deadline_writes_deadline_edited_action(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['deadline' => '2026-06-01']);

        $this->patchGrant($user, $grant, ['deadline' => '2026-09-30'])->assertOk();

        $this->assertDatabaseHas('grant_action_logs', [
            'grant_id' => $grant->id,
            'action'   => 'deadline_edited',
        ]);
    }

    public function test_patching_multiple_fields_writes_updated_action(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['starred' => false, 'area_relevant' => true]);

        $this->patchGrant($user, $grant, [
            'starred'      => true,
            'area_relevant' => false,
        ])->assertOk();

        $this->assertDatabaseHas('grant_action_logs', [
            'grant_id' => $grant->id,
            'action'   => 'updated',
        ]);
    }

    // =========================================================================
    // Before / after snapshots in old_value / new_value
    // =========================================================================

    public function test_log_stores_old_value_and_new_value_for_boolean_field(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['starred' => false]);

        $this->patchGrant($user, $grant, ['starred' => true]);

        $log = GrantActionLog::where('grant_id', $grant->id)->latest('created_at')->first();

        $this->assertNotNull($log);
        $this->assertFalse($log->old_value['starred']);
        $this->assertTrue($log->new_value['starred']);
    }

    public function test_log_stores_old_value_and_new_value_for_notes_field(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['notes' => 'Old note']);

        $this->patchGrant($user, $grant, ['notes' => 'New note']);

        $log = GrantActionLog::where('grant_id', $grant->id)->latest('created_at')->first();

        $this->assertNotNull($log);
        $this->assertSame('Old note', $log->old_value['notes']);
        $this->assertSame('New note', $log->new_value['notes']);
    }

    public function test_log_captures_old_value_before_update_not_after(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['starred' => false]);

        // Freeze time so the two patches land at distinct timestamps, then order by
        // id (auto-increment) which is always strictly insertion-ordered.
        $this->travelTo(now());
        $this->patchGrant($user, $grant, ['starred' => true]);

        $this->travelTo(now()->addSecond());
        $this->patchGrant($user, $grant, ['starred' => false]);

        $logs = GrantActionLog::where('grant_id', $grant->id)->orderBy('id')->get();

        $this->assertCount(2, $logs);
        $this->assertFalse($logs[0]->old_value['starred']); // was false before first patch
        $this->assertTrue($logs[1]->old_value['starred']);  // was true before second patch
    }

    public function test_log_snapshot_only_contains_changed_fields_not_full_row(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant();

        $this->patchGrant($user, $grant, ['starred' => true]);

        $log = GrantActionLog::where('grant_id', $grant->id)->first();

        // Only 'starred' should be in the snapshots — not unrelated fields like 'title'
        $this->assertArrayHasKey('starred', $log->old_value);
        $this->assertArrayNotHasKey('title', $log->old_value);
        $this->assertArrayNotHasKey('description', $log->old_value);
    }

    // =========================================================================
    // Long-text truncation
    // =========================================================================

    public function test_long_notes_are_truncated_in_log_but_grant_row_keeps_full_value(): void
    {
        $user      = $this->standardUser();
        $longNotes = str_repeat('Z', 600);
        $grant     = $this->grant(['notes' => null]);

        $this->patchGrant($user, $grant, ['notes' => $longNotes])->assertOk();

        // The grant row must have the full 600-char value
        $grant->refresh();
        $this->assertSame(600, mb_strlen($grant->notes));

        // The log new_value must be truncated
        $log = GrantActionLog::where('grant_id', $grant->id)->first();
        $this->assertStringEndsWith('… [truncated]', $log->new_value['notes']);
        $this->assertLessThan(600, mb_strlen($log->new_value['notes']));
    }

    public function test_short_notes_are_not_truncated_in_log(): void
    {
        $user       = $this->standardUser();
        $shortNotes = 'Just a quick note.';
        $grant      = $this->grant(['notes' => null]);

        $this->patchGrant($user, $grant, ['notes' => $shortNotes])->assertOk();

        $log = GrantActionLog::where('grant_id', $grant->id)->first();
        $this->assertSame($shortNotes, $log->new_value['notes']);
    }

    // =========================================================================
    // user_id attribution
    // =========================================================================

    public function test_log_records_the_authenticated_user_id(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant();

        $this->patchGrant($user, $grant, ['starred' => true]);

        $this->assertDatabaseHas('grant_action_logs', [
            'grant_id' => $grant->id,
            'user_id'  => $user->id,
        ]);
    }

    public function test_log_for_one_user_does_not_show_another_users_id(): void
    {
        $userA = $this->standardUser();
        $userB = $this->standardUser();
        $grant = $this->grant();

        $this->patchGrant($userA, $grant, ['starred' => true]);

        $log = GrantActionLog::where('grant_id', $grant->id)->first();
        $this->assertSame($userA->id, $log->user_id);
        $this->assertNotSame($userB->id, $log->user_id);
    }

    // =========================================================================
    // Grant row is actually updated
    // =========================================================================

    public function test_grant_row_is_updated_after_patch(): void
    {
        $user  = $this->standardUser();
        $grant = $this->grant(['starred' => false, 'notes' => null]);

        $this->patchGrant($user, $grant, ['starred' => true, 'notes' => 'Looks promising'])->assertOk();

        $grant->refresh();
        $this->assertTrue($grant->starred);
        $this->assertSame('Looks promising', $grant->notes);
    }

    // =========================================================================
    // GET /api/grants/{id}/logs — role-based visibility
    // =========================================================================

    public function test_full_access_user_sees_all_log_entries_for_a_grant(): void
    {
        $userA     = $this->standardUser();
        $userB     = $this->standardUser();
        $fullUser  = $this->fullUser();
        $grant     = $this->grant();

        // Two different users each make a change
        $this->patchGrant($userA, $grant, ['starred' => true]);
        $this->patchGrant($userB, $grant, ['notes' => 'UserB note']);

        $response = $this->actingAs($fullUser)
                         ->getJson("/api/grants/{$grant->id}/logs");

        $response->assertOk();
        // Response is wrapped: { "logs": [...] }
        $this->assertCount(2, $response->json('logs'));
    }

    public function test_standard_user_sees_only_their_own_log_entries(): void
    {
        $userA = $this->standardUser();
        $userB = $this->standardUser();
        $grant = $this->grant();

        $this->patchGrant($userA, $grant, ['starred' => true]);
        $this->patchGrant($userB, $grant, ['notes' => 'UserB note']);

        $response = $this->actingAs($userA)
                         ->getJson("/api/grants/{$grant->id}/logs");

        $response->assertOk();
        $logs = $response->json('logs');

        // userA should see only their own entry; the map sets is_me=true for their rows
        $this->assertCount(1, $logs);
        $this->assertTrue($logs[0]['is_me']);
    }

    public function test_standard_user_with_no_entries_sees_empty_logs(): void
    {
        $userA = $this->standardUser();
        $userB = $this->standardUser();
        $grant = $this->grant();

        // Only userB touches the grant
        $this->patchGrant($userB, $grant, ['starred' => true]);

        $response = $this->actingAs($userA)
                         ->getJson("/api/grants/{$grant->id}/logs");

        $response->assertOk();
        $this->assertCount(0, $response->json('logs'));
    }

    public function test_logs_endpoint_requires_authentication(): void
    {
        $grant = $this->grant();

        $this->getJson("/api/grants/{$grant->id}/logs")
             ->assertUnauthorized();
    }

    public function test_logs_response_includes_user_name(): void
    {
        $user  = $this->fullUser();
        $grant = $this->grant();

        $this->patchGrant($user, $grant, ['starred' => true]);

        $response = $this->actingAs($user)
                         ->getJson("/api/grants/{$grant->id}/logs");

        $response->assertOk();
        $entry = $response->json('logs.0');

        // The controller maps user name to the flat 'user_name' key
        $this->assertArrayHasKey('user_name', $entry);
        $this->assertSame($user->name, $entry['user_name']);
    }
}
