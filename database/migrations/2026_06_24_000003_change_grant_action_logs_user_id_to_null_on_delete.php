<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * grant_action_logs.user_id is nullable specifically to support scraper/system
     * writes (see 2026_05_15_000001_create_grant_action_logs_table.php). Its foreign
     * key is switched here to nullOnDelete() so deleting a user detaches their
     * action-log history (user_id set to null) instead of restricting the delete.
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
