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

            // ── Core shared fields ──────────────────────────────────────
            $table->string('title', 600);
            $table->string('url', 767)->unique();
            $table->text('description')->nullable();
            $table->text('summary')->nullable();
            $table->string('amount', 200)->nullable();
            $table->string('deadline', 200)->nullable();
            $table->text('eligibility')->nullable();
            $table->string('search_query', 500)->nullable();

            // ── Source tracking ─────────────────────────────────────────
            $table->string('scrape_method', 20)->default('web')
                ->comment('api | rss | web');
            $table->string('source', 50)->default('web')
                ->comment('grants_gov | simpler_grants | ca_portal | fema | terra_viva | federal_register | web');

            // ── User actions ────────────────────────────────────────────
            $table->boolean('applied')->default(false);
            $table->boolean('ignore')->default(false);
            $table->boolean('starred')->default(false);
            $table->text('notes')->nullable();
            $table->string('discard_reason', 300)->nullable();

            // ── Scoring & flags ─────────────────────────────────────────
            $table->boolean('offers_cash')->default(true);
            $table->boolean('area_relevant')->default(true);
            $table->boolean('ai_analyzed')->default(false);
            $table->boolean('page_crawled')->default(false);
            $table->smallInteger('relevance_score')->default(0);

            // ── Gov-specific fields (null for rss/web rows) ─────────────
            $table->string('opportunity_id', 50)->nullable()->unique();
            $table->string('opportunity_number', 100)->nullable();
            $table->string('agency_code', 50)->nullable();
            $table->string('agency_name', 300)->nullable();
            $table->string('open_date', 30)->nullable();
            $table->string('close_date', 30)->nullable();
            $table->string('opp_status', 30)->nullable();
            $table->string('doc_type', 30)->nullable();
            $table->string('aln_list', 500)->nullable();
            $table->string('award_floor', 100)->nullable();
            $table->string('award_ceiling', 100)->nullable();
            $table->string('award_floor_fmt', 100)->nullable();
            $table->string('award_ceiling_fmt', 100)->nullable();
            $table->string('estimated_total', 100)->nullable();
            $table->string('expected_num_awards', 50)->nullable();
            $table->string('cost_sharing', 10)->nullable();
            $table->text('applicant_types')->nullable();
            $table->string('funding_categories', 300)->nullable();
            $table->string('funding_instruments', 200)->nullable();
            $table->text('eligibility_text')->nullable();
            $table->string('posting_date', 50)->nullable();
            $table->string('last_updated', 100)->nullable();
            $table->string('agency_contact_name', 200)->nullable();
            $table->string('agency_contact_email', 200)->nullable();
            $table->string('additional_info', 500)->nullable();

            $table->timestamp('scraped_at')->useCurrent();
            $table->timestamps();
        });

        \DB::statement('CREATE INDEX idx_scrape_method ON grants (scrape_method)');
        \DB::statement('CREATE INDEX idx_source ON grants (source)');
        \DB::statement('CREATE INDEX idx_scraped_at ON grants (scraped_at)');
        \DB::statement('CREATE INDEX idx_relevance ON grants (relevance_score DESC)');
        \DB::statement('CREATE INDEX idx_starred ON grants (starred)');
        \DB::statement('CREATE INDEX idx_offers_cash ON grants (offers_cash)');
        \DB::statement('CREATE INDEX idx_area_relevant ON grants (area_relevant)');
    }

    public function down(): void
    {
        Schema::dropIfExists('grants');
    }
};
