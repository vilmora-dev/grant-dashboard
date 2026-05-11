<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OrganizationProfile extends Model
{
    protected $table = 'organization_profile';

    public $timestamps = false;

    protected $fillable = [
        'name', 'website', 'founded_year', 'irs_status',
        'mission', 'org_type',
        'target_states', 'target_counties', 'target_cities',
        'budget_range', 'staff_count', 'volunteer_count',
        'notes', 'ddg_searching', 'ddg_sites', 'updated_at',
    ];

    /**
     * PostgreSQL TEXT[] columns are returned as "{val,val}" strings.
     * Cast them to PHP arrays transparently.
     */
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

    /**
     * Always return the first (and only expected) profile row.
     */
    public static function first(): ?self
    {
        return static::query()->orderBy('id')->first();
    }
}
