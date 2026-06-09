<?php

namespace Tests\Feature;

use App\Models\Admin\Admin;
use App\Models\User\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminUserTest extends TestCase
{
    use RefreshDatabase;

    private function makeAdmin(): Admin
    {
        return Admin::create([
            'name'     => '테스트관리자',
            'email'    => 'admin@example.com',
            'password' => Hash::make('admin1234'),
            'is_super' => true,
        ]);
    }

    // ────────────────────────────────────────────────
    // 인증 보호
    // ────────────────────────────────────────────────

    public function test_비인증_유저_검색_차단(): void
    {
        $response = $this->get('/admin/users/search?keyword=test');

        $response->assertRedirect();
    }

    // ────────────────────────────────────────────────
    // 유저 검색 (JSON)
    // ────────────────────────────────────────────────

    public function test_유저_검색_결과_반환(): void
    {
        $admin = $this->makeAdmin();
        User::factory()->create(['name' => '김철수', 'email' => 'kim@example.com']);

        $response = $this->actingAs($admin, 'admin')
            ->get('/admin/users/search?keyword=김철수');

        $response->assertOk()
                 ->assertJsonPath('success', true)
                 ->assertJsonStructure(['success', 'data' => [['id', 'name', 'email']]]);
    }

    public function test_유저_검색_키워드_없으면_에러(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'admin')
            ->get('/admin/users/search');

        $response->assertSessionHasErrors('keyword');
    }

    // ────────────────────────────────────────────────
    // 유저 상세 (JSON)
    // ────────────────────────────────────────────────

    public function test_유저_상세_조회(): void
    {
        $admin = $this->makeAdmin();
        $user  = User::factory()->create();

        $response = $this->actingAs($admin, 'admin')
            ->get("/admin/users/{$user->id}");

        $response->assertOk()
                 ->assertJsonStructure(['id', 'name', 'email', 'user_role', 'stats']);
    }

    public function test_존재하지_않는_유저_상세_404(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'admin')
            ->get('/admin/users/99999999');

        $response->assertStatus(404);
    }

    // ────────────────────────────────────────────────
    // 유저 생성
    // ────────────────────────────────────────────────

    public function test_유저_생성_성공(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'admin')->post('/admin/users', [
            'name'     => '신규유저',
            'email'    => 'newuser@example.com',
            'password' => 'password123',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', ['email' => 'newuser@example.com']);
    }

    public function test_유저_생성_이메일_중복_422(): void
    {
        $admin = $this->makeAdmin();
        User::factory()->create(['email' => 'dup@example.com']);

        $response = $this->actingAs($admin, 'admin')->post('/admin/users', [
            'name'     => '중복유저',
            'email'    => 'dup@example.com',
            'password' => 'password123',
        ]);

        $response->assertSessionHasErrors('email');
    }

    // ────────────────────────────────────────────────
    // 유저 수정
    // ────────────────────────────────────────────────

    public function test_유저_수정_성공(): void
    {
        $admin = $this->makeAdmin();
        $user  = User::factory()->create(['name' => '수정전']);

        $response = $this->actingAs($admin, 'admin')->put("/admin/users/{$user->id}", [
            'name'  => '수정후',
            'email' => $user->email,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => '수정후']);
    }

    // ────────────────────────────────────────────────
    // 유저 삭제
    // ────────────────────────────────────────────────

    public function test_유저_삭제_성공(): void
    {
        $admin = $this->makeAdmin();
        $user  = User::factory()->create();

        $response = $this->actingAs($admin, 'admin')
            ->delete("/admin/users/{$user->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_존재하지_않는_유저_삭제_404(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'admin')
            ->delete('/admin/users/99999999');

        $response->assertStatus(404);
    }
}
