<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GrantGov extends Model
{
    protected $table = 'grants_gov';

    protected $fillable = [
        'opportunity_id', 'opportunity_number', 'title',
        'agency_code', 'agency_name', 'open_date', 'close_date',
        'opp_status', 'doc_type', 'aln_list', 'url', 'source', 'description',
        'applied', 'ignore',
        'award_floor', 'award_ceiling', 'award_floor_fmt', 'award_ceiling_fmt',
        'estimated_total', 'expected_num_awards', 'cost_sharing',
        'applicant_types', 'funding_categories', 'funding_instruments',
        'eligibility_text', 'posting_date', 'last_updated',
        'agency_contact_name', 'agency_contact_email', 'additional_info',
        'is_cash_grant', 'amount', 'deadline', 'eligibility',
        'area_relevant', 'summary', 'ai_analyzed', 'page_crawled',
        'relevance_score', 'starred', 'notes', 'discard_reason', 'scraped_at',
    ];

    protected $casts = [
        'applied'         => 'boolean',
        'ignore'          => 'boolean',
        'is_cash_grant'   => 'boolean',
        'area_relevant'   => 'boolean',
        'ai_analyzed'     => 'boolean',
        'page_crawled'    => 'boolean',
        'starred'         => 'boolean',
        'relevance_score' => 'integer',
        'scraped_at'      => 'datetime',
    ];
}
