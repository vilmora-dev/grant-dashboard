<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Follow-up to 2026_06_24_000003 (grant_action_logs.user_id -> nullOnDelete()).
     *
     * Once a deleted user's logs have user_id = null, GrantDataController::logs()
     * can no longer tell their actions apart from real system/scraper/AI rows —
     * both fall back to the same generic label ("System"), which is misleading
     * in an audit trail (a real person's claim/review/discard history would read
     * as if the system did it).
     *
     * Fix: snapshot the user's name onto their own log rows right before the
     * account is deleted (see ProfileController::destroy()), so history can
     * still say "Jane Doe (deleted)" instead of collapsing into "System".
     */
    public function up(): void
    {
        Schema::table('grant_action_logs', function (Blueprint $table) {
            $table->string('deleted_user_name', 255)
                  ->nullable()
                  ->after('user_id')
                  ->comment('Snapshot of the acting user\'s name, set just before their account is deleted. Null for active users and for true system/scraper/AI rows.');
        });
    }

    public function down(): void
    {
        Schema::table('grant_action_logs', function (Blueprint $table) {
            $table->dropColumn('deleted_user_name');
        });
    }
};
