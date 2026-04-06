<?php

namespace App\Models\Banner;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Banner extends Model
{
    use SoftDeletes;

    protected $primaryKey = 'banner_id';
    protected $guarded = ['banner_id'];
}
