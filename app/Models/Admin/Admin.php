<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Auth\User as Authenticatable; // Authenticatable 상속
use Illuminate\Notifications\Notifiable;

class Admin extends Authenticatable
{
    use Notifiable;
    protected $guarded = ['id'];
    // protected $fillable = ['name', 'email', 'password'];
    protected $hidden = ['password', 'remember_token'];
}
