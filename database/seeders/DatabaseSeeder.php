<?php

namespace Database\Seeders;

use App\Models\Initiative;
use App\Models\Keyword;
use App\Models\OrganizationProfile;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            InitiativeSeeder::class,
            KeywordSeeder::class,
            OrganizationProfileSeeder::class,
        ]);
    }
}
