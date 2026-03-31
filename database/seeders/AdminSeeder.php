<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Admin\Admin; // 관리자 모델 경로 확인
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        //
                // 기존 데이터가 있다면 삭제 후 생성 (중복 방지)
        Admin::truncate();

        Admin::create([
            'name'     => '최고관리자',
            'email'    => 'admin@gmail.com',
            'password' => Hash::make('admin1234'), 
        ]);

    }
}
