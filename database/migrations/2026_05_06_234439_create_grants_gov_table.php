<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
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
            $table->string('source', 50)->default('grants.gov');
            $table->text('description')->nullable();
            $table->boolean('applied')->default(false);
            $table->boolean('ignore')->default(false);
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
            $table->timestamp('scraped_at')->useCurrent();
            $table->timestamps();
        });

        \DB::statement('CREATE INDEX idx_gg_opp_status ON grants_gov (opp_status)');
        \DB::statement('CREATE INDEX idx_gg_agency_code ON grants_gov (agency_code)');
        \DB::statement('CREATE INDEX idx_gg_scraped_at ON grants_gov (scraped_at)');
        \DB::statement('CREATE INDEX idx_gg_area_relevant ON grants_gov (area_relevant)');
        \DB::statement('CREATE INDEX idx_gg_is_cash ON grants_gov (is_cash_grant)');
        \DB::statement('CREATE INDEX idx_gg_relevance ON grants_gov (relevance_score DESC)');
        \DB::statement('CREATE INDEX idx_gg_starred ON grants_gov (starred)');
    }

    public function down(): void
    {
        Schema::dropIfExists('grants_gov');
    }
};
