<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // `notes` was labelled "passed verbatim to AI prompt" — LLM pipeline removed.
        // The field was fetched by db.py but never consumed downstream.
        Schema::table('organization_profile', function (Blueprint $table) {
            $table->dropColumn('notes');
        });
    }

    public function down(): void
    {
        Schema::table('organization_profile', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('volunteer_count');
        });
    }
};
