<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Keyword extends Model
{
    protected $table = 'keywords';

    public $timestamps = false;

    protected $fillable = [
        'keyword', 'initiative_id', 'priority', 'success_score', 'is_active',
    ];

    protected $casts = [
        'is_active'     => 'boolean',
        'priority'      => 'integer',
        'success_score' => 'float',
    ];

    public function initiative()
    {
        return $this->belongsTo(Initiative::class, 'initiative_id');
    }
}
