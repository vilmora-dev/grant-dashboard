<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // --- Default admin account
        // Created only if no users exist, so re-running the seeder is safe.
        if (User::count() === 0) {
            User::create([
                'name'                 => 'Admin',
                'email'                => 'admin@deltarisingfoundation.org',
                'password'             => Hash::make('ChangeMe123!'),
                'role'                 => 'full',
                'must_change_password' => true,
                'is_active'            => true,
            ]);
        }

        $this->call([
            InitiativeSeeder::class,
            KeywordSeeder::class,
            OrganizationProfileSeeder::class,
        ]);
    }
}
