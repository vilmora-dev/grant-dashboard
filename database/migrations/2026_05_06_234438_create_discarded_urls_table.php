<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discarded_urls', function (Blueprint $table) {
            $table->id();
            $table->string('url', 767)->unique();
            $table->string('reason', 200)->nullable();
            $table->timestamp('discarded_at')->useCurrent();
        });

        // MySQL requires a prefix length for TEXT/VARCHAR(>191) indexes on InnoDB.
        // SQLite does not support the url(N) prefix-length syntax, so guard this.
        if (\DB::getDriverName() === 'mysql') {
            \DB::statement('CREATE INDEX idx_discarded_urls_url ON discarded_urls (url(255))');
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('discarded_urls');
    }
};
