<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('grants', function (Blueprint $table) {
            // Explicit "a human has looked this over" flag, independent of
            // applied/ignore/claimed. Set/unset via PATCH like the other
            // boolean toggles (starred, applied, ignore).
            $table->boolean('reviewed')
                  ->default(false)
                  ->after('ignore');
        });
    }

    public function down(): void
    {
        Schema::table('grants', function (Blueprint $table) {
            $table->dropColumn('reviewed');
        });
    }
};
