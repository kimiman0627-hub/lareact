<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable; // Authenticatable 상속
use Illuminate\Notifications\Notifiable;

class Admin extends Authenticatable
{
    use Notifiable;
    protected $guarded = ['id'];
    protected $hidden  = ['password', 'remember_token'];
    protected $casts   = [
        'is_super'         => 'boolean',
        'menu_permissions' => 'array',
    ];
}
