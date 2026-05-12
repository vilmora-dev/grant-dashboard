<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ddg_search_combos', function (Blueprint $table) {
            $table->unsignedTinyInteger('priority')->default(3)
                  ->after('keyword')
                  ->comment('1=high 2=mid 3=low — mirrors keywords.priority');
        });

        \DB::statement('CREATE INDEX idx_ddg_combos_priority ON ddg_search_combos (priority)');
    }

    public function down(): void
    {
        Schema::table('ddg_search_combos', function (Blueprint $table) {
            $table->dropColumn('priority');
        });
    }
};
