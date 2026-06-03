<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('initiatives', function (Blueprint $table) {
            $table->unsignedInteger('ddg_offset_p1')->default(0)
                  ->after('ddg_combo_offset')
                  ->comment('DDG combo rotation offset for priority-1 combos');
            $table->unsignedInteger('ddg_offset_p2')->default(0)
                  ->after('ddg_offset_p1')
                  ->comment('DDG combo rotation offset for priority-2 combos');
            $table->unsignedInteger('ddg_offset_p3')->default(0)
                  ->after('ddg_offset_p2')
                  ->comment('DDG combo rotation offset for priority-3 combos');
        });
    }

    public function down(): void
    {
        Schema::table('initiatives', function (Blueprint $table) {
            $table->dropColumn(['ddg_offset_p1', 'ddg_offset_p2', 'ddg_offset_p3']);
        });
    }
};
