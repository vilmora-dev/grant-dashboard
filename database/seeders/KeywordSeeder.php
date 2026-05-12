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

        // Priority scale: 1 = High
        //                 2 = Mid
        //                 3 = Low

        $keywords = [

            // --- AI Climate Tools
            // Focus: AI/software tools for carbon measurement, MRV, climate data
            ['keyword' => 'carbon market',              'initiative_id' => $ai, 'priority' => 1],
            ['keyword' => 'MRV technology',             'initiative_id' => $ai, 'priority' => 1],
            ['keyword' => 'climate AI',                 'initiative_id' => $ai, 'priority' => 1],
            ['keyword' => 'carbon verification',        'initiative_id' => $ai, 'priority' => 1],
            ['keyword' => 'nature-based solutions',     'initiative_id' => $ai, 'priority' => 2],
            ['keyword' => 'environmental data',         'initiative_id' => $ai, 'priority' => 2],
            ['keyword' => 'climate technology',         'initiative_id' => $ai, 'priority' => 2],
            ['keyword' => 'carbon monitoring',          'initiative_id' => $ai, 'priority' => 2],
            ['keyword' => 'reporting and verification', 'initiative_id' => $ai, 'priority' => 3],
            ['keyword' => 'remote sensing',             'initiative_id' => $ai, 'priority' => 3],
            ['keyword' => 'geospatial data',            'initiative_id' => $ai, 'priority' => 3],

            // --- Resilience Nursery
            // Focus: propagating native/drought-resistant plants, community distribution,
            //        habitat restoration planting — NOT urban farming or food security
            ['keyword' => 'native plants',              'initiative_id' => $nursery, 'priority' => 1],
            ['keyword' => 'drought resistant',          'initiative_id' => $nursery, 'priority' => 1],
            ['keyword' => 'pollinator habitat',         'initiative_id' => $nursery, 'priority' => 1],
            ['keyword' => 'plant propagation',          'initiative_id' => $nursery, 'priority' => 1],
            ['keyword' => 'native species',             'initiative_id' => $nursery, 'priority' => 2],
            ['keyword' => 'seed library',               'initiative_id' => $nursery, 'priority' => 2],
            ['keyword' => 'habitat restoration',        'initiative_id' => $nursery, 'priority' => 2],
            ['keyword' => 'restoration planting',       'initiative_id' => $nursery, 'priority' => 2],
            ['keyword' => 'community nursery',          'initiative_id' => $nursery, 'priority' => 2],
            ['keyword' => 'native landscaping',         'initiative_id' => $nursery, 'priority' => 3],
            ['keyword' => 'climate resilient plants',   'initiative_id' => $nursery, 'priority' => 3],

            // --- More Shade for More People
            // Focus: urban tree canopy, heat island mitigation, shade infrastructure
            //        in underserved communities
            ['keyword' => 'urban shade',                'initiative_id' => $shade, 'priority' => 1],
            ['keyword' => 'heat island',                'initiative_id' => $shade, 'priority' => 1],
            ['keyword' => 'urban canopy',               'initiative_id' => $shade, 'priority' => 1],
            ['keyword' => 'tree canopy',                'initiative_id' => $shade, 'priority' => 1],
            ['keyword' => 'community cooling',          'initiative_id' => $shade, 'priority' => 2],
            ['keyword' => 'urban forestry',             'initiative_id' => $shade, 'priority' => 2],
            ['keyword' => 'shade structure',            'initiative_id' => $shade, 'priority' => 2],
            ['keyword' => 'tree planting',              'initiative_id' => $shade, 'priority' => 2],
            ['keyword' => 'heat vulnerability',         'initiative_id' => $shade, 'priority' => 3],
            ['keyword' => 'urban heat',                 'initiative_id' => $shade, 'priority' => 3],
            ['keyword' => 'green infrastructure',       'initiative_id' => $shade, 'priority' => 3],

            // --- CBECN
            // Focus: community/indigenous-led carbon projects, biodiversity networks,
            //        agroforestry, nature-based carbon with equity lens
            ['keyword' => 'indigenous communities',           'initiative_id' => $cbecn, 'priority' => 1],
            ['keyword' => 'agroforestry',                     'initiative_id' => $cbecn, 'priority' => 1],
            ['keyword' => 'carbon credits',                   'initiative_id' => $cbecn, 'priority' => 1],
            ['keyword' => 'nature-based carbon',              'initiative_id' => $cbecn, 'priority' => 1],
            ['keyword' => 'biodiversity conservation',        'initiative_id' => $cbecn, 'priority' => 2],
            ['keyword' => 'IPLC',                             'initiative_id' => $cbecn, 'priority' => 2],
            ['keyword' => 'traditional ecological knowledge', 'initiative_id' => $cbecn, 'priority' => 2],
            ['keyword' => 'community-led conservation',       'initiative_id' => $cbecn, 'priority' => 2],
            ['keyword' => 'forest carbon',                    'initiative_id' => $cbecn, 'priority' => 3],
            ['keyword' => 'land stewardship',                 'initiative_id' => $cbecn, 'priority' => 3],
            ['keyword' => 'tribal land',                      'initiative_id' => $cbecn, 'priority' => 3],
        ];

        // --- Cross-cutting keywords
        // Applied to all 4 initiatives. Kept tight — no duplicates of the same concept.
        // Removed: antiracism, social justice, circular economy (too broad/off-mission),
        //          underrepresented communities (covered by environmental justice framing).
        $crossCutting = [
            ['keyword' => 'environmental justice',   'priority' => 1],
            ['keyword' => 'climate adaptation',      'priority' => 1],
            ['keyword' => 'underserved communities', 'priority' => 2],
            ['keyword' => 'equity',                  'priority' => 2],
            ['keyword' => 'community resilience',    'priority' => 2],
            ['keyword' => 'sustainable development', 'priority' => 3],
            ['keyword' => 'climate resilience',      'priority' => 3],
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
