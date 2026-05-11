<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DdgSearchCombo extends Model
{
    protected $table = 'ddg_search_combos';

    protected $fillable = [
        'keyword', 'area', 'term', 'query',
        'combo_type', 'is_active', 'starred', 'last_run_at', 'run_count',
    ];

    protected $casts = [
        'is_active'   => 'boolean',
        'starred'     => 'boolean',
        'run_count'   => 'integer',
        'last_run_at' => 'datetime',
    ];
}
