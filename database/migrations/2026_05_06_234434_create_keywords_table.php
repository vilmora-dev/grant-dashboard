<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('keywords', function (Blueprint $table) {
            $table->id();
            $table->string('keyword', 200);
            $table->foreignId('initiative_id')->nullable()->constrained('initiatives')->nullOnDelete();
            $table->smallInteger('priority')->default(3);
            // 1=High / 2=Mid / 3=Low
            $table->float('success_score')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Unique on (keyword, initiative_id) — MySQL treats NULLs as distinct
            // so duplicate nulls are possible; this mirrors Postgres behavior closely enough.
            $table->unique(['keyword', 'initiative_id']);
        });

        \DB::statement('CREATE INDEX idx_keywords_initiative ON keywords (initiative_id)');
        \DB::statement('CREATE INDEX idx_keywords_active ON keywords (is_active)');
    }

    public function down(): void
    {
        Schema::dropIfExists('keywords');
    }
};
