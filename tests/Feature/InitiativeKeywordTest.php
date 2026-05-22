<?php

namespace Tests\Feature;

use App\Models\Initiative;
use App\Models\Keyword;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests for initiative and keyword management (Priority 3 — part 2).
 *
 * Covers: initiative CRUD, soft-delete, notDeleted scope, duplicate slug,
 * keyword CRUD, duplicate 409, hard-delete, nullOnDelete cascade,
 * and priority/initiative_id validation.
 */
class InitiativeKeywordTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->fullAccess()->create();
    }

    // =========================================================================
    // Initiatives — index
    // =========================================================================

    public function test_index_returns_only_non_deleted_initiatives_by_default(): void
    {
        $admin = $this->admin();
        Initiative::factory()->count(2)->create();
        Initiative::factory()->deleted()->create();

        $response = $this->actingAs($admin)->getJson('/api/initiatives');

        $response->assertOk();
        $this->assertCount(2, $response->json());
    }

    public function test_index_includes_deleted_when_flag_is_set(): void
    {
        $admin = $this->admin();
        Initiative::factory()->count(2)->create();
        Initiative::factory()->deleted()->create();

        $response = $this->actingAs($admin)->getJson('/api/initiatives?include_deleted=true');

        $response->assertOk();
        $this->assertCount(3, $response->json());
    }

    public function test_index_includes_active_keyword_count(): void
    {
        $admin      = $this->admin();
        $initiative = Initiative::factory()->create();
        Keyword::factory()->forInitiative($initiative->id)->count(3)->create();
        Keyword::factory()->forInitiative($initiative->id)->inactive()->create(); // not counted

        $response = $this->actingAs($admin)->getJson('/api/initiatives');

        $response->assertOk();
        $item = collect($response->json())->firstWhere('id', $initiative->id);
        $this->assertSame(3, $item['active_keyword_count']);
    }

    // =========================================================================
    // Initiatives — create
    // =========================================================================

    public function test_admin_can_create_an_initiative(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->postJson('/api/initiatives', [
            'slug'         => 'youth-grants',
            'display_name' => 'Youth Grants',
            'description'  => 'Grants for youth programs',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('initiatives', ['slug' => 'youth-grants']);
    }

    public function test_duplicate_slug_is_rejected_with_422(): void
    {
        $admin = $this->admin();
        Initiative::factory()->create(['slug' => 'existing-slug']);

        $response = $this->actingAs($admin)->postJson('/api/initiatives', [
            'slug'         => 'existing-slug',
            'display_name' => 'Another Initiative',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('slug');
    }

    public function test_new_initiative_is_active_by_default(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->postJson('/api/initiatives', [
            'slug'         => 'new-initiative',
            'display_name' => 'New Initiative',
        ]);

        $this->assertDatabaseHas('initiatives', [
            'slug'      => 'new-initiative',
            'is_active' => true,
        ]);
    }

    // =========================================================================
    // Initiatives — soft-delete
    // =========================================================================

    public function test_deleting_an_initiative_soft_deletes_it(): void
    {
        $admin      = $this->admin();
        $initiative = Initiative::factory()->create();

        $this->actingAs($admin)
            ->deleteJson("/api/initiatives/{$initiative->id}")
            ->assertNoContent();

        // Row must still exist — it's a soft delete
        $this->assertDatabaseHas('initiatives', ['id' => $initiative->id]);
    }

    public function test_soft_deleted_initiative_has_is_deleted_true_and_is_active_false(): void
    {
        $admin      = $this->admin();
        $initiative = Initiative::factory()->create();

        $this->actingAs($admin)
            ->deleteJson("/api/initiatives/{$initiative->id}");

        $initiative->refresh();
        $this->assertTrue($initiative->is_deleted);
        $this->assertFalse($initiative->is_active);
    }

    public function test_soft_deleted_initiative_disappears_from_default_index(): void
    {
        $admin      = $this->admin();
        $initiative = Initiative::factory()->create();

        $this->actingAs($admin)->deleteJson("/api/initiatives/{$initiative->id}");

        $response = $this->actingAs($admin)->getJson('/api/initiatives');
        $ids = array_column($response->json(), 'id');
        $this->assertNotContains($initiative->id, $ids);
    }

    public function test_delete_nonexistent_initiative_returns_404(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)
            ->deleteJson('/api/initiatives/99999')
            ->assertNotFound();
    }

    // =========================================================================
    // Initiatives — update
    // =========================================================================

    public function test_admin_can_update_initiative_display_name(): void
    {
        $admin      = $this->admin();
        $initiative = Initiative::factory()->create(['display_name' => 'Old Name']);

        $this->actingAs($admin)->patchJson("/api/initiatives/{$initiative->id}", [
            'display_name' => 'New Name',
        ])->assertOk();

        $this->assertSame('New Name', $initiative->fresh()->display_name);
    }

    public function test_slug_update_must_remain_unique(): void
    {
        $admin = $this->admin();
        Initiative::factory()->create(['slug' => 'taken-slug']);
        $other = Initiative::factory()->create(['slug' => 'other-slug']);

        $response = $this->actingAs($admin)->patchJson("/api/initiatives/{$other->id}", [
            'slug' => 'taken-slug',
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('slug');
    }

    public function test_slug_update_can_use_same_slug_on_same_record(): void
    {
        $admin      = $this->admin();
        $initiative = Initiative::factory()->create(['slug' => 'my-slug']);

        // Re-sending the same slug on the same record must not trigger unique violation
        $response = $this->actingAs($admin)->patchJson("/api/initiatives/{$initiative->id}", [
            'slug' => 'my-slug',
        ]);

        $response->assertOk();
    }

    // =========================================================================
    // Keywords — create
    // =========================================================================

    public function test_admin_can_create_a_keyword(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->postJson('/api/keywords', [
            'keyword'  => 'housing grant',
            'priority' => 2,
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('keywords', ['keyword' => 'housing grant']);
    }

    public function test_duplicate_keyword_same_initiative_returns_409(): void
    {
        $admin      = $this->admin();
        $initiative = Initiative::factory()->create();
        Keyword::factory()->forInitiative($initiative->id)->create(['keyword' => 'environment']);

        $response = $this->actingAs($admin)->postJson('/api/keywords', [
            'keyword'       => 'environment',
            'initiative_id' => $initiative->id,
        ]);

        $response->assertStatus(409)
                 ->assertJsonFragment(['error' => "Keyword 'environment' already exists for this initiative"]);
    }

    public function test_same_keyword_different_initiatives_is_allowed(): void
    {
        $admin  = $this->admin();
        $initA  = Initiative::factory()->create();
        $initB  = Initiative::factory()->create();
        Keyword::factory()->forInitiative($initA->id)->create(['keyword' => 'arts']);

        $response = $this->actingAs($admin)->postJson('/api/keywords', [
            'keyword'       => 'arts',
            'initiative_id' => $initB->id,
        ]);

        $response->assertCreated();
    }

    public function test_same_keyword_with_no_initiative_can_only_exist_once(): void
    {
        $admin = $this->admin();
        Keyword::factory()->create(['keyword' => 'unassigned', 'initiative_id' => null]);

        $response = $this->actingAs($admin)->postJson('/api/keywords', [
            'keyword'       => 'unassigned',
            'initiative_id' => null,
        ]);

        $response->assertStatus(409);
    }

    public function test_priority_must_be_between_1_and_10(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->postJson('/api/keywords', [
            'keyword'  => 'bad priority',
            'priority' => 11,
        ])->assertUnprocessable()->assertJsonValidationErrors('priority');

        $this->actingAs($admin)->postJson('/api/keywords', [
            'keyword'  => 'bad priority',
            'priority' => 0,
        ])->assertUnprocessable()->assertJsonValidationErrors('priority');
    }

    public function test_initiative_id_must_exist_in_initiatives_table(): void
    {
        $admin = $this->admin();

        $response = $this->actingAs($admin)->postJson('/api/keywords', [
            'keyword'       => 'orphan keyword',
            'initiative_id' => 99999,
        ]);

        $response->assertUnprocessable()->assertJsonValidationErrors('initiative_id');
    }

    public function test_keyword_defaults_to_priority_5_when_not_specified(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin)->postJson('/api/keywords', [
            'keyword' => 'default priority',
        ]);

        $this->assertDatabaseHas('keywords', [
            'keyword'  => 'default priority',
            'priority' => 5,
        ]);
    }

    // =========================================================================
    // Keywords — hard-delete and nullOnDelete cascade
    // =========================================================================

    public function test_deleting_a_keyword_removes_it_from_the_database(): void
    {
        $admin   = $this->admin();
        $keyword = Keyword::factory()->create();

        $this->actingAs($admin)
            ->deleteJson("/api/keywords/{$keyword->id}")
            ->assertNoContent();

        $this->assertDatabaseMissing('keywords', ['id' => $keyword->id]);
    }

    public function test_deleting_an_initiative_sets_keyword_initiative_id_to_null(): void
    {
        $admin      = $this->admin();
        $initiative = Initiative::factory()->create();
        $keyword    = Keyword::factory()->forInitiative($initiative->id)->create();

        // Soft-delete the initiative — the migration uses nullOnDelete() on the FK
        $this->actingAs($admin)
            ->deleteJson("/api/initiatives/{$initiative->id}");

        // The keyword must survive, but its initiative_id should be null
        $this->assertDatabaseHas('keywords', [
            'id'            => $keyword->id,
            'initiative_id' => null,
        ]);
    }

    // =========================================================================
    // Keywords — update
    // =========================================================================

    public function test_admin_can_update_keyword_priority(): void
    {
        $admin   = $this->admin();
        $keyword = Keyword::factory()->create(['priority' => 5]);

        $this->actingAs($admin)->patchJson("/api/keywords/{$keyword->id}", [
            'priority' => 1,
        ])->assertOk();

        $this->assertSame(1, $keyword->fresh()->priority);
    }

    public function test_admin_can_deactivate_a_keyword(): void
    {
        $admin   = $this->admin();
        $keyword = Keyword::factory()->create(['is_active' => true]);

        $this->actingAs($admin)->patchJson("/api/keywords/{$keyword->id}", [
            'is_active' => false,
        ])->assertOk();

        $this->assertFalse($keyword->fresh()->is_active);
    }
}
