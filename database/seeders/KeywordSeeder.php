<?php

namespace Database\Seeders;

use App\Models\Initiative;
use App\Models\Keyword;
use Illuminate\Database\Seeder;

class KeywordSeeder extends Seeder
{
    public function run(): void
    {
        $ai      = Initiative::where('slug', 'ai-climate-tools')->value('id');
        $nursery = Initiative::where('slug', 'resilience-nursery')->value('id');
        $shade   = Initiative::where('slug', 'more-shade')->value('id');
        $cbecn   = Initiative::where('slug', 'cbecn')->value('id');

        $keywords = [
            // AI Climate Tools
            ['keyword' => 'carbon market',              'initiative_id' => $ai,      'priority' => 1],
            ['keyword' => 'MRV technology',             'initiative_id' => $ai,      'priority' => 2],
            ['keyword' => 'climate AI',                 'initiative_id' => $ai,      'priority' => 3],
            ['keyword' => 'carbon verification',        'initiative_id' => $ai,      'priority' => 4],
            ['keyword' => 'nature-based solutions',     'initiative_id' => $ai,      'priority' => 5],
            ['keyword' => 'environmental data',         'initiative_id' => $ai,      'priority' => 6],
            ['keyword' => 'climate technology',         'initiative_id' => $ai,      'priority' => 7],
            ['keyword' => 'carbon monitoring',          'initiative_id' => $ai,      'priority' => 8],
            ['keyword' => 'reporting and verification', 'initiative_id' => $ai,      'priority' => 9],

            // Resilience Nursery
            ['keyword' => 'native plants',              'initiative_id' => $nursery, 'priority' => 1],
            ['keyword' => 'drought resistant',          'initiative_id' => $nursery, 'priority' => 2],
            ['keyword' => 'pollinator habitat',         'initiative_id' => $nursery, 'priority' => 3],
            ['keyword' => 'urban agriculture',          'initiative_id' => $nursery, 'priority' => 4],
            ['keyword' => 'community garden',           'initiative_id' => $nursery, 'priority' => 5],
            ['keyword' => 'food forest',                'initiative_id' => $nursery, 'priority' => 6],
            ['keyword' => 'plant propagation',          'initiative_id' => $nursery, 'priority' => 7],
            ['keyword' => 'native species',             'initiative_id' => $nursery, 'priority' => 8],
            ['keyword' => 'seed library',               'initiative_id' => $nursery, 'priority' => 9],
            ['keyword' => 'food security',              'initiative_id' => $nursery, 'priority' => 10],

            // More Shade
            ['keyword' => 'urban shade',                'initiative_id' => $shade,   'priority' => 1],
            ['keyword' => 'heat island',                'initiative_id' => $shade,   'priority' => 2],
            ['keyword' => 'urban resilience',           'initiative_id' => $shade,   'priority' => 3],
            ['keyword' => 'community cooling',          'initiative_id' => $shade,   'priority' => 4],
            ['keyword' => 'shade structure',            'initiative_id' => $shade,   'priority' => 5],
            ['keyword' => 'urban canopy',               'initiative_id' => $shade,   'priority' => 6],
            ['keyword' => 'heat vulnerability',         'initiative_id' => $shade,   'priority' => 7],
            ['keyword' => 'tree canopy',                'initiative_id' => $shade,   'priority' => 8],
            ['keyword' => 'urban forestry',             'initiative_id' => $shade,   'priority' => 9],

            // CBECN
            ['keyword' => 'indigenous communities',           'initiative_id' => $cbecn,   'priority' => 1],
            ['keyword' => 'carbon credits',                   'initiative_id' => $cbecn,   'priority' => 2],
            ['keyword' => 'smallholder farmer',               'initiative_id' => $cbecn,   'priority' => 3],
            ['keyword' => 'biodiversity conservation',        'initiative_id' => $cbecn,   'priority' => 4],
            ['keyword' => 'nature-based carbon',              'initiative_id' => $cbecn,   'priority' => 5],
            ['keyword' => 'IPLC',                             'initiative_id' => $cbecn,   'priority' => 6],
            ['keyword' => 'agroforestry',                     'initiative_id' => $cbecn,   'priority' => 7],
            ['keyword' => 'traditional ecological knowledge', 'initiative_id' => $cbecn,   'priority' => 8],
            ['keyword' => 'community carbon',                 'initiative_id' => $cbecn,   'priority' => 9],
        ];

        // Cross-cutting keywords — same term, all 4 initiatives
        $crossCutting = [
            ['keyword' => 'environmental justice',        'priority' => 1],
            ['keyword' => 'racial equity',                'priority' => 2],
            ['keyword' => 'antiracism',                   'priority' => 3],
            ['keyword' => 'circular economy',             'priority' => 4],
            ['keyword' => 'sustainable development',      'priority' => 5],
            ['keyword' => 'community empowerment',        'priority' => 6],
            ['keyword' => 'climate adaptation',           'priority' => 7],
            ['keyword' => 'underrepresented communities', 'priority' => 8],
            ['keyword' => 'equitable climate',            'priority' => 9],
            ['keyword' => 'social justice',               'priority' => 10],
        ];

        foreach ($crossCutting as $kw) {
            foreach ([$ai, $nursery, $shade, $cbecn] as $initId) {
                $keywords[] = array_merge($kw, ['initiative_id' => $initId]);
            }
        }

        foreach ($keywords as $kw) {
            Keyword::firstOrCreate(
                ['keyword' => $kw['keyword'], 'initiative_id' => $kw['initiative_id']],
                ['priority' => $kw['priority'], 'is_active' => true]
            );
        }
    }
}
