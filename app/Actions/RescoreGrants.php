<?php

namespace App\Actions;

use App\Models\Grant;
use App\Models\GrantGov;
use App\Models\Keyword;
use App\Models\OrganizationProfile;

class RescoreGrants
{
    /**
     * Re-score all grants in both tables using current active keywords
     * and the organization profile.
     *
     * NOTE: scoreRelevance() is a stub — port your Python score_relevance()
     * logic here when you're ready.
     */
    public function execute(): array
    {
        $startMs = (int) (microtime(true) * 1000);

        $keywords   = Keyword::where('is_active', true)->pluck('keyword')->toArray();
        $orgProfile = OrganizationProfile::orderBy('id')->first()?->toArray() ?? [];

        // Re-score DDG web grants
        $updatedGrants = 0;
        Grant::select(['id', 'title', 'summary', 'description', 'eligibility',
                        'area_relevant', 'offers_cash', 'deadline'])
            ->each(function (Grant $grant) use ($keywords, $orgProfile, &$updatedGrants) {
                $record              = $grant->toArray();
                $record['is_cash_grant'] = $record['offers_cash'] ?? true;
                $score               = $this->scoreRelevance($record, $keywords, $orgProfile);
                $grant->update(['relevance_score' => $score]);
                $updatedGrants++;
            });

        // Re-score Grants.gov grants
        $updatedGov = 0;
        GrantGov::select(['id', 'title', 'summary', 'description', 'eligibility',
                          'eligibility_text', 'funding_categories', 'agency_name',
                          'area_relevant', 'is_cash_grant', 'close_date'])
            ->each(function (GrantGov $grant) use ($keywords, $orgProfile, &$updatedGov) {
                $record             = $grant->toArray();
                $record['deadline'] = $record['close_date'] ?? null;
                $score              = $this->scoreRelevance($record, $keywords, $orgProfile);
                $grant->update(['relevance_score' => $score]);
                $updatedGov++;
            });

        $elapsedMs = (int) (microtime(true) * 1000) - $startMs;

        return [
            'updated_grants' => $updatedGrants,
            'updated_gov'    => $updatedGov,
            'elapsed_ms'     => $elapsedMs,
        ];
    }

    /**
     * Stub — replace with your ported score_relevance logic from scraper.py.
     *
     * @param  array  $grant      Grant record as associative array
     * @param  array  $keywords   Active keyword strings
     * @param  array  $orgProfile Organization profile fields
     * @return float
     */
    private function scoreRelevance(array $grant, array $keywords, array $orgProfile): float
    {
        // TODO: port score_relevance() from scraper.py
        // Basic keyword-hit stub for now:
        $text  = strtolower(implode(' ', array_filter([
            $grant['title']       ?? '',
            $grant['summary']     ?? '',
            $grant['description'] ?? '',
            $grant['eligibility'] ?? '',
        ])));

        $hits = 0;
        foreach ($keywords as $kw) {
            if (str_contains($text, strtolower($kw))) {
                $hits++;
            }
        }

        return $keywords ? round($hits / count($keywords), 4) : 0.0;
    }
}
