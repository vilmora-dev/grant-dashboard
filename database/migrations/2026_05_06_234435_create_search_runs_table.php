<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('search_runs', function (Blueprint $table) {
            $table->id();
            $table->timestamp('run_at')->useCurrent();
            $table->string('theme', 50)->nullable();
            $table->integer('total_api_hits')->default(0);
            $table->integer('already_reviewed')->default(0);
            $table->integer('newly_processed')->default(0);
            $table->integer('cash_grants_found')->default(0);
            $table->integer('area_relevant_found')->default(0);
            $table->integer('ai_analyzed')->default(0);
            $table->integer('pages_crawled')->default(0);
            $table->boolean('upload_ok')->default(false);
            $table->decimal('elapsed_seconds', 8, 1)->nullable();
            $table->text('notes')->nullable();
        });

        \DB::statement('CREATE INDEX idx_search_runs_run_at ON search_runs (run_at)');
        \DB::statement('CREATE INDEX idx_search_runs_theme ON search_runs (theme)');
    }

    public function down(): void
    {
        Schema::dropIfExists('search_runs');
    }
};
