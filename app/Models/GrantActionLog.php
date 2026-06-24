<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GrantActionLog extends Model
{
    // Audit rows are immutable — only created_at, no updated_at
    public $timestamps = false;

    protected $fillable = [
        'grant_id',
        'user_id',
        'action',
        'old_value',
        'new_value',
        'ip_address',
        'user_agent',
        'created_at',
    ];

    protected $casts = [
        'old_value'  => 'array',
        'new_value'  => 'array',
        'created_at' => 'datetime',
    ];

    // ── Allowed action vocabulary ─────────────────────────────────────────────
    // Keep this list as the single source of truth. Add new actions here first.

    const ACTION_STARRED        = 'starred';
    const ACTION_UNSTARRED      = 'unstarred';
    const ACTION_APPLIED        = 'applied';
    const ACTION_UNAPPLIED      = 'unapplied';
    const ACTION_DISCARDED      = 'discarded';
    const ACTION_RESTORED       = 'restored';
    const ACTION_NOTES_UPDATED  = 'notes_updated';
    const ACTION_AMOUNT_EDITED  = 'amount_edited';
    const ACTION_DEADLINE_EDITED = 'deadline_edited';
    const ACTION_FIELD_UPDATED  = 'field_updated';
    const ACTION_UPDATED        = 'updated';       // multi-field patch fallback
    const ACTION_SCRAPED        = 'scraped';       // written by the scraper pipeline
    const ACTION_AI_ANALYZED    = 'ai_analyzed';   // written by the AI pipeline
    const ACTION_CLAIMED        = 'claimed';       // user claimed (started working) a grant
    const ACTION_UNCLAIMED      = 'unclaimed';     // user released a grant they had claimed
    const ACTION_REASSIGNED     = 'reassigned';    // claim was taken over from another user

    // ── Long-text fields that get truncated in the log ────────────────────────
    // These fields already live in full on the grants row; the log only needs
    // a short preview so it stays readable without bloating storage.

    const TEXT_FIELDS   = ['notes', 'description', 'summary', 'eligibility', 'eligibility_text'];
    const TEXT_MAX_LEN  = 500;

    // ── Relations ─────────────────────────────────────────────────────────────

    public function grant(): BelongsTo
    {
        return $this->belongsTo(GrantUnified::class, 'grant_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // ── Static helpers ────────────────────────────────────────────────────────

    /**
     * Truncate long-text field values before they are stored in the log.
     * Short fields (booleans, amounts, dates) are passed through unchanged.
     */
    public static function truncateForLog(array $data): array
    {
        return collect($data)->map(function ($value, string $key) {
            if (
                in_array($key, self::TEXT_FIELDS, true)
                && is_string($value)
                && mb_strlen($value) > self::TEXT_MAX_LEN
            ) {
                return mb_substr($value, 0, self::TEXT_MAX_LEN) . '… [truncated]';
            }

            return $value;
        })->all();
    }

    /**
     * Derive a human-readable action label from the patched fields.
     * Single-field patches get a specific name; multi-field patches fall back
     * to the generic 'updated' label.
     */
    public static function resolveAction(array $data): string
    {
        if (count($data) === 1) {
            $key = array_key_first($data);
            $val = $data[$key];

            return match (true) {
                $key === 'starred'        => $val ? self::ACTION_STARRED         : self::ACTION_UNSTARRED,
                $key === 'applied'        => $val ? self::ACTION_APPLIED          : self::ACTION_UNAPPLIED,
                $key === 'ignore'         => $val ? self::ACTION_DISCARDED        : self::ACTION_RESTORED,
                $key === 'notes'          => self::ACTION_NOTES_UPDATED,
                $key === 'amount'         => self::ACTION_AMOUNT_EDITED,
                $key === 'deadline'       => self::ACTION_DEADLINE_EDITED,
                $key === 'discard_reason' => self::ACTION_DISCARDED,
                default                  => self::ACTION_FIELD_UPDATED,
            };
        }

        // ignore + discard_reason arrive together — treat as a single discard
        if (isset($data['ignore'], $data['discard_reason']) && $data['ignore']) {
            return self::ACTION_DISCARDED;
        }

        return self::ACTION_UPDATED;
    }
}
