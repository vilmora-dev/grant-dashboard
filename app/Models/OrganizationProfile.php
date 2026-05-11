<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrganizationProfile extends Model
{
    protected $table = 'organization_profile';

    // Only updated_at exists — no created_at column
    public $timestamps = false;

    protected $fillable = [
        'name', 'website', 'founded_year', 'irs_status', 'mission', 'org_type',
        'target_states', 'target_counties', 'target_cities',
        'budget_range', 'staff_count', 'volunteer_count', 'notes',
        'ddg_searching', 'ddg_sites',
    ];

    protected $casts = [
        'target_states'   => 'array',
        'target_counties' => 'array',
        'target_cities'   => 'array',
        'ddg_searching'   => 'array',
        'ddg_sites'       => 'array',
        'founded_year'    => 'integer',
        'staff_count'     => 'integer',
        'volunteer_count' => 'integer',
        'updated_at'      => 'datetime',
    ];

    // Touch updated_at manually on save since $timestamps = false
    public static function boot(): void
    {
        parent::boot();
        static::saving(function (self $model) {
            $model->updated_at = now();
        });
    }
}
