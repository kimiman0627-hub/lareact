<?php

namespace Tests\Feature;

use App\Models\Admin\Admin;
use App\Models\Board\Board;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminBoardTest extends TestCase
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

    private function boardPayload(array $overrides = []): array
    {
        return array_merge([
            'board_name'   => '테스트게시판',
            'board_order'  => 0,
            'board_type'   => 'NORMAL',
            'board_layout' => 'GENERAL',
            'board_status' => 'ACTIVE',
            'category'     => 'test_board',
        ], $overrides);
    }

    // ────────────────────────────────────────────────
    // 인증 보호
    // ────────────────────────────────────────────────

    public function test_비인증_게시판_생성_차단(): void
    {
        $response = $this->post('/admin/boards', $this->boardPayload());

        $response->assertRedirect();
    }

    // ────────────────────────────────────────────────
    // 게시판 생성
    // ────────────────────────────────────────────────

    public function test_게시판_생성_성공(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'admin')
            ->post('/admin/boards', $this->boardPayload());

        $response->assertRedirect();
        $this->assertDatabaseHas('boards', ['category' => 'test_board']);
    }

    public function test_게시판_생성_필수값_누락_422(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'admin')
            ->post('/admin/boards', $this->boardPayload(['board_name' => '']));

        $response->assertSessionHasErrors('board_name');
    }

    public function test_게시판_생성_잘못된_board_type_422(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'admin')
            ->post('/admin/boards', $this->boardPayload(['board_type' => 'INVALID_TYPE']));

        $response->assertSessionHasErrors('board_type');
    }

    public function test_게시판_생성_category_특수문자_422(): void
    {
        $admin = $this->makeAdmin();

        $response = $this->actingAs($admin, 'admin')
            ->post('/admin/boards', $this->boardPayload(['category' => '한글카테고리!']));

        $response->assertSessionHasErrors('category');
    }

    // ────────────────────────────────────────────────
    // 게시판 수정
    // ────────────────────────────────────────────────

    public function test_게시판_수정_성공(): void
    {
        $admin = $this->makeAdmin();
        $board = Board::factory()->create(['board_name' => '수정전']);

        $response = $this->actingAs($admin, 'admin')
            ->put("/admin/boards/{$board->board_id}", $this->boardPayload([
                'board_name' => '수정후',
                'category'   => $board->category,
            ]));

        $response->assertRedirect();
        $this->assertDatabaseHas('boards', [
            'board_id'   => $board->board_id,
            'board_name' => '수정후',
        ]);
    }

    // ────────────────────────────────────────────────
    // 게시판 삭제
    // ────────────────────────────────────────────────

    public function test_게시판_삭제_성공(): void
    {
        $admin = $this->makeAdmin();
        $board = Board::factory()->create();

        $response = $this->actingAs($admin, 'admin')
            ->delete("/admin/boards/{$board->board_id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('boards', ['board_id' => $board->board_id]);
    }
}
