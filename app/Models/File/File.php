<?php

namespace App\Models\File;

use Illuminate\Database\Eloquent\Model;

class File extends Model
{
    protected $primaryKey = 'file_id';
    protected $guarded = ['file_id'];
}
