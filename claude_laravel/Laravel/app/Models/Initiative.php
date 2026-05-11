<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Initiative extends Model
{
    protected $table = 'initiatives';

    public $timestamps = false;

    protected $fillable = ['slug', 'display_name', 'description', 'is_active'];

    protected $casts = ['is_active' => 'boolean'];

    public function keywords()
    {
        return $this->hasMany(Keyword::class, 'initiative_id');
    }
}
