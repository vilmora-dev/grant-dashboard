<?php

namespace Database\Seeders;

use App\Models\Initiative;
use Illuminate\Database\Seeder;

class InitiativeSeeder extends Seeder
{
    public function run(): void
    {
        $initiatives = [
            [
                'slug'         => 'ai-climate-tools',
                'display_name' => 'AI Climate Tools',
                'description'  => 'AI-powered MRV, carbon market verification, and environmental data platforms',
            ],
            [
                'slug'         => 'resilience-nursery',
                'display_name' => 'Resilience Nursery',
                'description'  => 'Native plant propagation, food forests, seed libraries, and urban agriculture',
            ],
            [
                'slug'         => 'more-shade',
                'display_name' => 'More Shade for More People',
                'description'  => 'Urban canopy expansion, heat island mitigation, and community cooling infrastructure',
            ],
            [
                'slug'         => 'cbecn',
                'display_name' => 'Community Biodiversity Energy Carbon Network',
                'description'  => 'Indigenous-led carbon stewardship, agroforestry, and community carbon programs',
            ],
        ];

        foreach ($initiatives as $data) {
            Initiative::firstOrCreate(['slug' => $data['slug']], $data);
        }
    }
}
