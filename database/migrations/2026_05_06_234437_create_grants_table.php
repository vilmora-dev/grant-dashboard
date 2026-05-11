<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grants', function (Blueprint $table) {
            $table->id();
            $table->string('title', 500);
            $table->string('url', 767)->unique();
            $table->text('description')->nullable();
            $table->boolean('applied')->default(false);
            $table->boolean('ignore')->default(false);
            $table->string('source', 50)->nullable();
            $table->string('search_query', 500)->nullable();
            $table->boolean('offers_cash')->default(true);
            $table->string('amount', 200)->nullable();
            $table->string('deadline', 200)->nullable();
            $table->text('eligibility')->nullable();
            $table->text('summary')->nullable();
            $table->boolean('ai_analyzed')->default(false);
            $table->boolean('area_relevant')->default(true);
            $table->smallInteger('relevance_score')->default(0);
            $table->boolean('starred')->default(false);
            $table->text('notes')->nullable();
            $table->string('discard_reason', 300)->nullable();
            $table->timestamp('scraped_at')->useCurrent();
            $table->timestamps();
        });

        \DB::statement('CREATE INDEX idx_offers_cash ON grants (offers_cash)');
        \DB::statement('CREATE INDEX idx_source ON grants (source)');
        \DB::statement('CREATE INDEX idx_scraped_at ON grants (scraped_at)');
        \DB::statement('CREATE INDEX idx_relevance ON grants (relevance_score DESC)');
        \DB::statement('CREATE INDEX idx_grants_starred ON grants (starred)');
    }

    public function down(): void
    {
        Schema::dropIfExists('grants');
    }
};
