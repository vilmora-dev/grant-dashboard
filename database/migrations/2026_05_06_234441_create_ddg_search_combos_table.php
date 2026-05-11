<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ddg_search_combos', function (Blueprint $table) {
            $table->id();
            $table->string('keyword', 200);
            $table->string('area', 200);
            $table->string('term', 200);
            $table->string('query', 600);
            $table->string('combo_type', 20)->default('standard');
            $table->boolean('is_active')->default(true);
            $table->boolean('starred')->default(false);
            $table->timestamp('last_run_at')->nullable();
            $table->integer('run_count')->default(0);
            $table->timestamps();

            $table->unique(['keyword', 'area', 'term', 'combo_type'], 'uq_ddg_combo');
        });

        \DB::statement('CREATE INDEX idx_ddg_combos_active ON ddg_search_combos (is_active)');
        \DB::statement('CREATE INDEX idx_ddg_combos_starred ON ddg_search_combos (starred)');
        \DB::statement('CREATE INDEX idx_ddg_combos_type ON ddg_search_combos (combo_type)');
        \DB::statement('CREATE INDEX idx_ddg_combos_last_run ON ddg_search_combos (last_run_at)');
    }

    public function down(): void
    {
        Schema::dropIfExists('ddg_search_combos');
    }
};
