<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('initiatives', function (Blueprint $table) {
            $table->unsignedInteger('ddg_combo_offset')->default(0)
                  ->after('is_deleted')
                  ->comment('Tracks DDG combo rotation position for this initiative');
        });
    }

    public function down(): void
    {
        Schema::table('initiatives', function (Blueprint $table) {
            $table->dropColumn('ddg_combo_offset');
        });
    }
};
