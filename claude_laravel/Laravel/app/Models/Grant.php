<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * DDG / web-search grants  →  `grants` table
 */
class Grant extends Model
{
    protected $table = 'grants';

    // The table has no updated_at column — only scraped_at.
    public $timestamps = false;

    protected $fillable = [
        'title', 'url', 'description',
        'applied', 'ignore', 'starred',
        'source', 'search_query',
        'offers_cash', 'amount', 'deadline', 'eligibility',
        'summary', 'ai_analyzed', 'area_relevant',
        'relevance_score', 'notes', 'discard_reason',
    ];

    protected $casts = [
        'applied'        => 'boolean',
        'ignore'         => 'boolean',
        'starred'        => 'boolean',
        'offers_cash'    => 'boolean',
        'ai_analyzed'    => 'boolean',
        'area_relevant'  => 'boolean',
        'relevance_score'=> 'integer',
        'scraped_at'     => 'datetime',
    ];
}
