<?php

namespace App\Models;

use Database\Factories\KeywordFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Keyword extends Model
{
    /** @use HasFactory<KeywordFactory> */
    use HasFactory;

    protected $fillable = [
        'keyword', 'initiative_id', 'priority', 'success_score', 'is_active',
    ];

    protected $casts = [
        'is_active'     => 'boolean',
        'priority'      => 'integer',
        'success_score' => 'float',
    ];

    public function initiative(): BelongsTo
    {
        return $this->belongsTo(Initiative::class);
    }
}
