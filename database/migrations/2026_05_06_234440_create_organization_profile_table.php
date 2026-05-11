<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('organization_profile', function (Blueprint $table) {
            $table->id();
            $table->string('name', 200);
            $table->string('website', 500)->nullable();
            $table->smallInteger('founded_year')->nullable();
            $table->string('irs_status', 50)->nullable();
            $table->text('mission')->nullable();
            $table->string('org_type', 100)->nullable();
            // MySQL has no native array type — store as JSON, cast to array in model
            $table->json('target_states')->nullable();
            $table->json('target_counties')->nullable();
            $table->json('target_cities')->nullable();
            $table->string('budget_range', 50)->nullable();
            $table->smallInteger('staff_count')->nullable();
            $table->smallInteger('volunteer_count')->nullable();
            $table->text('notes')->nullable();
            $table->json('ddg_searching')->nullable();
            $table->json('ddg_sites')->nullable();
            // Only updated_at exists in the original schema (no created_at)
            $table->timestamp('updated_at')->useCurrent()->useCurrentOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('organization_profile');
    }
};
