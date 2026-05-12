<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ddg_search_combos', function (Blueprint $table) {
            $table->tinyInteger('consecutive_zero_runs')->default(0)->after('run_count');
        });
    }

    public function down(): void
    {
        Schema::table('ddg_search_combos', function (Blueprint $table) {
            $table->dropColumn('consecutive_zero_runs');
        });
    }
};
