<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grant_action_logs', function (Blueprint $table) {
            $table->id();

            // Grant that was changed — cascade delete so logs clean up with the grant
            $table->foreignId('grant_id')
                  ->constrained('grants')
                  ->cascadeOnDelete();

            // User who made the change — nullable to support scraper/system writes
            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained('users')
                  ->restrictOnDelete();

            // Short action label — see GrantActionLog::ACTIONS for the vocabulary
            $table->string('action', 40);

            // Only the changed fields, not the full row.
            // Long-text fields (notes, description, summary) are truncated to 500 chars.
            $table->json('old_value')->nullable();
            $table->json('new_value')->nullable();

            // Request context — helpful for debugging and security review
            $table->string('ip_address', 45)->nullable();   // supports IPv6
            $table->string('user_agent', 300)->nullable();

            // Immutable — no updated_at, rows are never modified after insert
            $table->timestamp('created_at')->useCurrent();
        });

        // "Show me all changes for this grant" — the most common query
        DB::statement('CREATE INDEX idx_gal_grant_time  ON grant_action_logs (grant_id, created_at DESC)');
        // "What did this user do?"
        DB::statement('CREATE INDEX idx_gal_user_time   ON grant_action_logs (user_id,  created_at DESC)');
        // "Show all discards / stars in a date range"
        DB::statement('CREATE INDEX idx_gal_action_time ON grant_action_logs (action,   created_at DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('grant_action_logs');
    }
};
