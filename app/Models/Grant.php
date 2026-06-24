<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grant extends Model
{
    protected $fillable = [
        'title', 'url', 'description', 'applied', 'ignore',
        'source', 'search_query', 'offers_cash', 'amount', 'deadline',
        'eligibility', 'summary', 'ai_analyzed', 'area_relevant',
        'relevance_score', 'starred', 'notes', 'discard_reason', 'scraped_at',
        'claimed_by_user_id', 'claimed_at',
    ];

    protected $casts = [
        'applied'         => 'boolean',
        'ignore'          => 'boolean',
        'offers_cash'     => 'boolean',
        'ai_analyzed'     => 'boolean',
        'area_relevant'   => 'boolean',
        'starred'         => 'boolean',
        'relevance_score' => 'integer',
        'scraped_at'      => 'datetime',
        'claimed_at'      => 'datetime',
    ];

    public function claimedBy()
    {
        return $this->belongsTo(User::class, 'claimed_by_user_id');
    }
}
