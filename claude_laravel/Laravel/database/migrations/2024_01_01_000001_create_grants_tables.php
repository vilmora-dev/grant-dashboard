<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

/**
 * NOTE: These migrations mirror init.sql exactly.
 * If your Postgres DB was already initialised by Docker using init.sql,
 * you do NOT need to run these migrations — the tables already exist.
 *
 * Run only on a fresh database:
 *   php artisan migrate
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── initiatives ──────────────────────────────────────────────
        Schema::create('initiatives', function (Blueprint $table) {
            $table->id();
            $table->string('slug', 80)->unique();
            $table->string('display_name', 150);
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
        });

        // ── keywords ─────────────────────────────────────────────────
        Schema::create('keywords', function (Blueprint $table) {
            $table->id();
            $table->string('keyword', 200);
            $table->foreignId('initiative_id')->nullable()->constrained('initiatives')->nullOnDelete();
            $table->smallInteger('priority')->default(5);
            $table->float('success_score')->nullable();
            $table->boolean('is_active')->default(true);
            $table->unique(['keyword', 'initiative_id']);
        });

        // ── grants (DDG / web search) ─────────────────────────────────
        Schema::create('grants', function (Blueprint $table) {
            $table->id();
            $table->string('title', 500);
            $table->string('url', 1000)->unique();
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
        });

        // ── grants_gov ───────────────────────────────────────────────
        Schema::create('grants_gov', function (Blueprint $table) {
            $table->id();
            $table->string('opportunity_id', 50)->unique();
            $table->string('opportunity_number', 100)->nullable();
            $table->string('title', 600);
            $table->string('agency_code', 50)->nullable();
            $table->string('agency_name', 300)->nullable();
            $table->string('open_date', 30)->nullable();
            $table->string('close_date', 30)->nullable();
            $table->string('opp_status', 30)->nullable();
            $table->string('doc_type', 30)->nullable();
            $table->string('aln_list', 500)->nullable();
            $table->string('url', 500)->nullable();
            $table->text('description')->nullable();
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
            $table->boolean('is_cash_grant')->default(true);
            $table->string('amount', 200)->nullable();
            $table->string('deadline', 200)->nullable();
            $table->text('eligibility')->nullable();
            $table->boolean('area_relevant')->default(true);
            $table->text('summary')->nullable();
            $table->boolean('ai_analyzed')->default(false);
            $table->boolean('page_crawled')->default(false);
            $table->smallInteger('relevance_score')->default(0);
            $table->boolean('starred')->default(false);
            $table->text('notes')->nullable();
            $table->string('discard_reason', 300)->nullable();
            $table->boolean('applied')->default(false);
            $table->boolean('ignore')->default(false);
            $table->string('source', 50)->default('grants.gov');
            $table->timestamp('scraped_at')->useCurrent();
        });

        // ── organization_profile ──────────────────────────────────────
        Schema::create('organization_profile', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200);
            $table->string('website', 500)->nullable();
            $table->smallInteger('founded_year')->nullable();
            $table->string('irs_status', 50)->nullable();
            $table->text('mission')->nullable();
            $table->string('org_type', 100)->nullable();
            // PostgreSQL TEXT[] arrays — stored as native array type
            $table->timestamp('updated_at')->useCurrent();
        });

        // Add TEXT[] array columns via raw SQL (Blueprint doesn't support PG arrays)
        DB::statement("ALTER TABLE organization_profile
            ADD COLUMN IF NOT EXISTS target_states   TEXT[] NOT NULL DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS target_counties TEXT[] NOT NULL DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS target_cities   TEXT[] NOT NULL DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS budget_range    VARCHAR(50),
            ADD COLUMN IF NOT EXISTS staff_count     SMALLINT,
            ADD COLUMN IF NOT EXISTS volunteer_count SMALLINT,
            ADD COLUMN IF NOT EXISTS notes           TEXT,
            ADD COLUMN IF NOT EXISTS ddg_searching   TEXT[] NOT NULL DEFAULT ARRAY['grant program','grant opportunity','grant application','nonprofit funding'],
            ADD COLUMN IF NOT EXISTS ddg_sites        TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]
        ");

        // ── discarded_urls ────────────────────────────────────────────
        Schema::create('discarded_urls', function (Blueprint $table) {
            $table->id();
            $table->string('url', 1000)->unique();
            $table->string('reason', 200)->nullable();
            $table->timestamp('discarded_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discarded_urls');
        Schema::dropIfExists('organization_profile');
        Schema::dropIfExists('grants_gov');
        Schema::dropIfExists('grants');
        Schema::dropIfExists('keywords');
        Schema::dropIfExists('initiatives');
    }
};
