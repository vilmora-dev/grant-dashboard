<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Single-row table that persists round-robin state across scraper runs.
     * initiative_offset: which initiative gets "first slot" in the next run.
     */
    public function up(): void
    {
        Schema::create('scraper_state', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('initiative_offset')->default(0)
                  ->comment('Index into the active-initiatives list; incremented each run');
            $table->timestamps();
        });

        // Seed the one row
        \DB::table('scraper_state')->insert([
            'initiative_offset' => 0,
            'created_at'        => now(),
            'updated_at'        => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('scraper_state');
    }
};
