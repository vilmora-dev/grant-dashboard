<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * grant_action_logs.user_id was created nullable specifically "to support
     * scraper/system writes" (see 2026_05_15_000001_create_grant_action_logs_table.php),
     * but its foreign key was wired as restrictOnDelete() instead of nullOnDelete().
     *
     * Effect of the bug: any user who has ever claimed/unclaimed/reassigned a grant
     * (or made any other logged action) has at least one grant_action_logs row
     * referencing them. Deleting that user's account (ProfileController::destroy())
     * then hits MySQL error 1451 — "Cannot delete or update a parent row: a foreign
     * key constraint fails" — which Laravel's default handler renders as a generic
     * 500 page.
     *
     * Fix: switch the constraint to nullOnDelete(), matching the column's original
     * intent. Deleting a user now detaches their action-log history (sets user_id
     * to null, preserving the log rows themselves) instead of blocking the delete.
     */
    public function up(): void
    {
        Schema::table('grant_action_logs', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('grant_action_logs', function (Blueprint $table) {
            $table->foreign('user_id')
                  ->references('id')->on('users')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('grant_action_logs', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        Schema::table('grant_action_logs', function (Blueprint $table) {
            $table->foreign('user_id')
                  ->references('id')->on('users')
                  ->restrictOnDelete();
        });
    }
};
