<?php

namespace Database\Factories;

use App\Models\Initiative;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Initiative>
 */
class InitiativeFactory extends Factory
{
    protected $model = Initiative::class;

    public function definition(): array
    {
        return [
            'slug'         => fake()->unique()->slug(3),
            'display_name' => fake()->words(3, true),
            'description'  => fake()->sentence(),
            'is_active'    => true,
            'is_deleted'   => false,
        ];
    }

    /** Soft-deleted initiative. */
    public function deleted(): static
    {
        return $this->state([
            'is_deleted' => true,
            'is_active'  => false,
        ]);
    }

    /** Inactive but not deleted. */
    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }
}
