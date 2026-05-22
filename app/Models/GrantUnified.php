<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GrantUnified extends Model
{
    // Table renamed from grants_unified → grants (unified schema)
    protected $table = 'grants';

    protected $fillable = [
        'title', 'url', 'description', 'summary', 'amount', 'deadline',
        'eligibility', 'search_query',
        'scrape_method', 'source',
        'applied', 'ignore', 'starred', 'notes', 'discard_reason',
        'offers_cash', 'area_relevant', 'ai_analyzed', 'page_crawled',
        'relevance_score',
        'opportunity_id', 'opportunity_number', 'agency_code', 'agency_name',
        'open_date', 'close_date', 'opp_status', 'doc_type', 'aln_list',
        'award_floor', 'award_ceiling', 'award_floor_fmt', 'award_ceiling_fmt',
        'estimated_total', 'expected_num_awards', 'cost_sharing',
        'applicant_types', 'funding_categories', 'funding_instruments',
        'eligibility_text', 'posting_date', 'last_updated',
        'agency_contact_name', 'agency_contact_email', 'additional_info',
        'scraped_at',
    ];

    protected $casts = [
        'applied'         => 'boolean',
        'ignore'          => 'boolean',
        'starred'         => 'boolean',
        'offers_cash'     => 'boolean',
        'area_relevant'   => 'boolean',
        'ai_analyzed'     => 'boolean',
        'page_crawled'    => 'boolean',
        'relevance_score' => 'integer',
        'scraped_at'      => 'datetime',
    ];

    public function actionLogs(): HasMany
    {
        return $this->hasMany(GrantActionLog::class, 'grant_id')
                    ->orderByDesc('created_at');
    }
}
