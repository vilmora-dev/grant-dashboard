<?php

namespace Database\Factories;

use App\Models\Keyword;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Keyword>
 */
class KeywordFactory extends Factory
{
    protected $model = Keyword::class;

    public function definition(): array
    {
        return [
            'keyword'       => fake()->unique()->words(2, true),
            'initiative_id' => null,
            'priority'      => fake()->numberBetween(1, 10),
            'success_score' => null,
            'is_active'     => true,
        ];
    }

    /** Keyword linked to a specific initiative. */
    public function forInitiative(int $initiativeId): static
    {
        return $this->state(['initiative_id' => $initiativeId]);
    }

    /** High-priority keyword (priority 1). */
    public function highPriority(): static
    {
        return $this->state(['priority' => 1]);
    }

    /** Inactive keyword. */
    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
