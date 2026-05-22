<?php

namespace Tests\Unit;

use App\Models\GrantActionLog;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for GrantActionLog static helpers.
 *
 * These tests exercise pure logic only — no database, no HTTP, no framework
 * boot needed. They run fast and act as a specification contract for the
 * action-vocabulary resolution and text-truncation rules.
 */
class GrantActionLogTest extends TestCase
{
    // =========================================================================
    // resolveAction()
    // =========================================================================

    // ── Boolean toggles ───────────────────────────────────────────────────────

    public function test_starring_a_grant_resolves_to_starred(): void
    {
        $this->assertSame('starred', GrantActionLog::resolveAction(['starred' => true]));
    }

    public function test_unstarring_a_grant_resolves_to_unstarred(): void
    {
        $this->assertSame('unstarred', GrantActionLog::resolveAction(['starred' => false]));
    }

    public function test_marking_applied_true_resolves_to_applied(): void
    {
        $this->assertSame('applied', GrantActionLog::resolveAction(['applied' => true]));
    }

    public function test_marking_applied_false_resolves_to_unapplied(): void
    {
        $this->assertSame('unapplied', GrantActionLog::resolveAction(['applied' => false]));
    }

    public function test_setting_ignore_true_resolves_to_discarded(): void
    {
        $this->assertSame('discarded', GrantActionLog::resolveAction(['ignore' => true]));
    }

    public function test_setting_ignore_false_resolves_to_restored(): void
    {
        $this->assertSame('restored', GrantActionLog::resolveAction(['ignore' => false]));
    }

    // ── Text fields ───────────────────────────────────────────────────────────

    public function test_updating_notes_resolves_to_notes_updated(): void
    {
        $this->assertSame('notes_updated', GrantActionLog::resolveAction(['notes' => 'Some notes here']));
    }

    public function test_updating_amount_resolves_to_amount_edited(): void
    {
        $this->assertSame('amount_edited', GrantActionLog::resolveAction(['amount' => '$50,000']));
    }

    public function test_updating_deadline_resolves_to_deadline_edited(): void
    {
        $this->assertSame('deadline_edited', GrantActionLog::resolveAction(['deadline' => '2026-12-31']));
    }

    public function test_updating_discard_reason_alone_resolves_to_discarded(): void
    {
        $this->assertSame('discarded', GrantActionLog::resolveAction(['discard_reason' => 'Out of scope']));
    }

    // ── Unknown / generic single-field ────────────────────────────────────────

    public function test_updating_an_unrecognised_single_field_resolves_to_field_updated(): void
    {
        $this->assertSame('field_updated', GrantActionLog::resolveAction(['area_relevant' => true]));
    }

    // ── Multi-field patches ───────────────────────────────────────────────────

    public function test_patching_multiple_unrelated_fields_resolves_to_updated(): void
    {
        $this->assertSame('updated', GrantActionLog::resolveAction([
            'starred'      => true,
            'area_relevant' => false,
        ]));
    }

    public function test_patching_multiple_fields_that_include_applied_resolves_to_updated(): void
    {
        // Multi-field always wins — even if one of them is 'applied'
        $this->assertSame('updated', GrantActionLog::resolveAction([
            'applied' => true,
            'notes'   => 'Submitted form',
        ]));
    }

    /**
     * ignore + discard_reason arrive together from the UI discard action.
     * The special-case rule treats this pair as a single DISCARDED event.
     */
    public function test_ignore_plus_discard_reason_together_resolves_to_discarded(): void
    {
        $this->assertSame('discarded', GrantActionLog::resolveAction([
            'ignore'         => true,
            'discard_reason' => 'Not eligible',
        ]));
    }

    // =========================================================================
    // truncateForLog()
    // =========================================================================

    public function test_short_text_field_is_passed_through_unchanged(): void
    {
        $data   = ['notes' => 'A short note.'];
        $result = GrantActionLog::truncateForLog($data);

        $this->assertSame('A short note.', $result['notes']);
    }

    public function test_text_field_exactly_at_limit_is_not_truncated(): void
    {
        $data   = ['notes' => str_repeat('X', GrantActionLog::TEXT_MAX_LEN)];
        $result = GrantActionLog::truncateForLog($data);

        $this->assertSame(str_repeat('X', GrantActionLog::TEXT_MAX_LEN), $result['notes']);
    }

    public function test_text_field_over_limit_is_truncated_with_suffix(): void
    {
        $long   = str_repeat('B', 600);
        $result = GrantActionLog::truncateForLog(['notes' => $long]);

        // Must be capped — not 600 chars
        $this->assertLessThan(600, mb_strlen($result['notes']));
        // Must end with the truncation marker
        $this->assertStringEndsWith('… [truncated]', $result['notes']);
        // Must contain the first 500 chars intact
        $this->assertStringStartsWith(str_repeat('B', 500), $result['notes']);
    }

    public function test_all_declared_text_fields_are_truncated(): void
    {
        $longValue = str_repeat('C', 600);

        $data = array_fill_keys(GrantActionLog::TEXT_FIELDS, $longValue);
        $result = GrantActionLog::truncateForLog($data);

        foreach (GrantActionLog::TEXT_FIELDS as $field) {
            $this->assertStringEndsWith(
                '… [truncated]',
                $result[$field],
                "Field '{$field}' should have been truncated"
            );
        }
    }

    public function test_non_text_fields_are_never_truncated(): void
    {
        // Boolean, integer, and short string fields must pass through verbatim
        $data = [
            'starred'        => true,
            'applied'        => false,
            'relevance_score' => 85,
            'amount'         => '$10,000',
            'deadline'       => '2026-06-30',
        ];

        $result = GrantActionLog::truncateForLog($data);

        $this->assertSame($data, $result);
    }

    public function test_null_text_field_value_is_passed_through_unchanged(): void
    {
        $result = GrantActionLog::truncateForLog(['notes' => null]);

        $this->assertNull($result['notes']);
    }

    public function test_description_over_limit_is_truncated(): void
    {
        $long   = str_repeat('D', 600);
        $result = GrantActionLog::truncateForLog(['description' => $long]);

        $this->assertStringEndsWith('… [truncated]', $result['description']);
    }

    public function test_empty_data_array_returns_empty_array(): void
    {
        $this->assertSame([], GrantActionLog::truncateForLog([]));
    }
}
