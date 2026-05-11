<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('search_run_results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('run_id')->constrained('search_runs')->cascadeOnDelete();
            $table->string('keyword', 200);
            $table->integer('hits_returned')->default(0);
            $table->integer('new_hits')->default(0);

            $table->unique(['run_id', 'keyword']);
        });

        \DB::statement('CREATE INDEX idx_srr_run ON search_run_results (run_id)');
        \DB::statement('CREATE INDEX idx_srr_keyword ON search_run_results (keyword)');
    }

    public function down(): void
    {
        Schema::dropIfExists('search_run_results');
    }
};
