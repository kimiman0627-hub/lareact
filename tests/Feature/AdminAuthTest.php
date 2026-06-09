<?php

namespace Tests\Feature;

use App\Models\Admin\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminAuthTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(array $overrides = []): Admin
    {
        return Admin::create(array_merge([
            'name'       => '테스트관리자',
            'email'      => 'admin@example.com',
            'password'   => Hash::make('admin1234'),
            'is_super'   => true,
        ], $overrides));
    }

    // ────────────────────────────────────────────────
    // 로그인
    // ────────────────────────────────────────────────

    public function test_관리자_로그인_성공(): void
    {
        $this->makeAdmin();

        $response = $this->post('/admin/login', [
            'email'    => 'admin@example.com',
            'password' => 'admin1234',
        ]);

        $response->assertRedirect('/admin');
        $this->assertAuthenticatedAs(Admin::first(), 'admin');
    }

    public function test_관리자_로그인_비밀번호_틀림(): void
    {
        $this->makeAdmin();

        $response = $this->post('/admin/login', [
            'email'    => 'admin@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_관리자_로그인_존재하지_않는_이메일(): void
    {
        $response = $this->post('/admin/login', [
            'email'    => 'nobody@example.com',
            'password' => 'admin1234',
        ]);

        $response->assertSessionHasErrors('email');
    }

    // ────────────────────────────────────────────────
    // 인증 보호
    // ────────────────────────────────────────────────

    public function test_비인증_관리자_대시보드_접근_리다이렉트(): void
    {
        $response = $this->get('/admin');

        $response->assertRedirect();
    }

    public function test_비인증_유저_목록_접근_리다이렉트(): void
    {
        $response = $this->get('/admin/users');

        $response->assertRedirect();
    }

    // ────────────────────────────────────────────────
    // 로그아웃
    // ────────────────────────────────────────────────

    public function test_관리자_로그아웃(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'admin')->post('/admin/logout');

        $response->assertRedirect('/admin/login');
        $this->assertGuest('admin');
    }
}
