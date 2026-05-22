<?php

namespace Database\Factories;

use App\Models\GrantUnified;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<GrantUnified>
 */
class GrantUnifiedFactory extends Factory
{
    protected $model = GrantUnified::class;

    public function definition(): array
    {
        return [
            'title'          => fake()->sentence(6),
            'url'            => fake()->unique()->url(),
            'description'    => fake()->paragraph(3),
            'summary'        => fake()->paragraph(2),
            'amount'         => '$' . fake()->numberBetween(5_000, 500_000),
            'deadline'       => fake()->dateTimeBetween('+1 month', '+6 months')->format('Y-m-d'),
            'eligibility'    => fake()->sentence(10),
            'search_query'   => fake()->words(3, true),
            'scrape_method'  => 'web',
            'source'         => 'web',

            // User action flags — all false by default (unreviewed grant)
            'applied'        => false,
            'ignore'         => false,
            'starred'        => false,
            'notes'          => null,
            'discard_reason' => null,

            // Scoring flags
            'offers_cash'    => true,
            'area_relevant'  => true,
            'ai_analyzed'    => false,
            'page_crawled'   => false,
            'relevance_score' => fake()->numberBetween(0, 100),

            'scraped_at'     => now(),
        ];
    }

    // ── Named states ─────────────────────────────────────────────────────────

    /** A grant the user has starred. */
    public function starred(): static
    {
        return $this->state(['starred' => true]);
    }

    /** A grant the user has marked as applied. */
    public function applied(): static
    {
        return $this->state(['applied' => true]);
    }

    /** A grant the user has ignored/discarded. */
    public function ignored(): static
    {
        return $this->state([
            'ignore'         => true,
            'discard_reason' => fake()->sentence(4),
        ]);
    }

    /** A grant with a long notes field (> 500 chars) — used to test truncation. */
    public function withLongNotes(): static
    {
        return $this->state([
            'notes' => str_repeat('A', 600),
        ]);
    }

    /** A Grants.gov API grant (has agency / opportunity fields). */
    public function govGrant(): static
    {
        return $this->state([
            'scrape_method'     => 'api',
            'source'            => 'grants_gov',
            'opportunity_id'    => (string) fake()->unique()->numberBetween(100000, 999999),
            'opportunity_number' => 'HHS-' . fake()->numerify('##-###'),
            'agency_code'       => fake()->lexify('???'),
            'agency_name'       => fake()->company() . ' Agency',
            'open_date'         => fake()->dateTimeBetween('-3 months', '-1 month')->format('Y-m-d'),
            'close_date'        => fake()->dateTimeBetween('+1 month', '+4 months')->format('Y-m-d'),
            'opp_status'        => 'posted',
            'award_ceiling'     => (string) fake()->numberBetween(10_000, 1_000_000),
            'award_floor'       => (string) fake()->numberBetween(1_000, 9_999),
        ]);
    }
}
