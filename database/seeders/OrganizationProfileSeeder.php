<?php

namespace Database\Seeders;

use App\Models\OrganizationProfile;
use Illuminate\Database\Seeder;

class OrganizationProfileSeeder extends Seeder
{
    public function run(): void
    {
        // Only seed if no profile exists yet
        if (OrganizationProfile::exists()) {
            return;
        }

        OrganizationProfile::create([
            'name'            => 'Delta Rising Foundation',
            'website'         => 'https://www.deltarisingfoundation.org/',
            'irs_status'      => '501(c)(3)',
            'org_type'        => 'Environmental nonprofit',
            'mission'         => 'Advancing sustainable communities through green infrastructure, biodiversity preservation, and social entrepreneurship.',
            'target_states'   => ['California'],
            'target_counties' => ['Orange County', 'Los Angeles'],
            'budget_range'    => '100k-500k',
            'ddg_searching'   => [
                'grant program',
                'grant opportunity',
                'grant application',
                'nonprofit funding',
            ],
            'ddg_sites'       => [
                'calrecycle.ca.gov',
                'energy.ca.gov',
                'calepa.ca.gov',
                'dot.ca.gov',
                'calfund.org',
                'annenberg.org',
                'rosehillsfoundation.org',
                'wildlife.ca.gov',
                'resources.ca.gov',
                'climatejusticealliance.org',
            ],
        ]);
    }
}
