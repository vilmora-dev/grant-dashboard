<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * applied/ignore/reviewed are now both filtered (status dropdown) and
     * aggregated (status counts) on every dashboard load - and that load
     * happens every 30s per open tab via the auto-refresh poll, not just
     * on navigation. They were never indexed when added (unlike starred/
     * offers_cash/area_relevant in the original grants migration), so add
     * that here.
     */
    public function up(): void
    {
        // MySQL has no CREATE INDEX IF NOT EXISTS, and each \DB::statement()
        // auto-commits independently - so a failure partway through a
        // previous run (e.g. idx_ignore needing backticks) can leave
        // idx_applied already created while this migration is still marked
        // as not-yet-run. Guard each one via information_schema so re-runs
        // are safe.
        $this->createIndexIfMissing('idx_applied', 'CREATE INDEX idx_applied ON grants (applied)');
        // `ignore` is a MySQL reserved word - must be backtick-quoted as an identifier.
        $this->createIndexIfMissing('idx_ignore', 'CREATE INDEX idx_ignore ON grants (`ignore`)');
        $this->createIndexIfMissing('idx_reviewed', 'CREATE INDEX idx_reviewed ON grants (reviewed)');
    }

    private function createIndexIfMissing(string $indexName, string $sql): void
    {
        $exists = \DB::table('information_schema.statistics')
            ->where('table_schema', \DB::getDatabaseName())
            ->where('table_name', 'grants')
            ->where('index_name', $indexName)
            ->exists();

        if (! $exists) {
            \DB::statement($sql);
        }
    }

    public function down(): void
    {
        $this->dropIndexIfExists('idx_applied');
        $this->dropIndexIfExists('idx_ignore');
        $this->dropIndexIfExists('idx_reviewed');
    }

    private function dropIndexIfExists(string $indexName): void
    {
        $exists = \DB::table('information_schema.statistics')
            ->where('table_schema', \DB::getDatabaseName())
            ->where('table_name', 'grants')
            ->where('index_name', $indexName)
            ->exists();

        if ($exists) {
            \DB::statement("DROP INDEX {$indexName} ON grants");
        }
    }
};
