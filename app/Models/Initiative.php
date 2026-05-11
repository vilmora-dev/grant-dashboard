<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Initiative extends Model
{
    protected $fillable = [
        'slug', 'display_name', 'description', 'is_active', 'is_deleted',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'is_deleted' => 'boolean',
    ];

    public function keywords(): HasMany
    {
        return $this->hasMany(Keyword::class);
    }

    public function scopeNotDeleted($query)
    {
        return $query->where('is_deleted', false);
    }
}
