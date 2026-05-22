<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name'                 => fake()->name(),
            'email'                => fake()->unique()->safeEmail(),
            'email_verified_at'    => now(),
            'password'             => static::$password ??= Hash::make('password'),
            'remember_token'       => Str::random(10),
            'role'                 => 'standard',
            'is_active'            => true,
            'must_change_password' => false,
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }

    /**
     * Full-access user (can access Config, Stats, Team, and all admin API routes).
     */
    public function fullAccess(): static
    {
        return $this->state([
            'role'                 => 'full',
            'is_active'            => true,
            'must_change_password' => false,
        ]);
    }

    /**
     * Standard-access user (dashboard only).
     */
    public function standardAccess(): static
    {
        return $this->state([
            'role'                 => 'standard',
            'is_active'            => true,
            'must_change_password' => false,
        ]);
    }

    /**
     * User who must set a new password on first login.
     */
    public function mustChangePassword(): static
    {
        return $this->state([
            'must_change_password' => true,
        ]);
    }

    /**
     * Deactivated user — cannot log in even with correct credentials.
     */
    public function inactive(): static
    {
        return $this->state([
            'is_active' => false,
        ]);
    }
}
