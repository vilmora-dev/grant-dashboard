<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grants', function (Blueprint $table) {
            // Who is currently working this grant. Nullable = unclaimed.
            // set null on delete so removing a user never deletes a grant,
            // it just falls back to unclaimed.
            $table->foreignId('claimed_by_user_id')
                  ->nullable()
                  ->after('notes')
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamp('claimed_at')
                  ->nullable()
                  ->after('claimed_by_user_id')
                  ->comment('When the current claim was made; cleared on release');
        });

        // "Show me grants claimed by me" / "show unclaimed grants" — common dashboard filter
        DB::statement('CREATE INDEX idx_grants_claimed_by ON grants (claimed_by_user_id)');
    }

    public function down(): void
    {
        Schema::table('grants', function (Blueprint $table) {
            $table->dropConstrainedForeignId('claimed_by_user_id');
            $table->dropColumn('claimed_at');
        });
    }
};
