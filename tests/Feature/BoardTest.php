<?php

namespace Tests\Feature;

use App\Models\Board\Board;
use App\Models\Board\Comment;
use App\Models\Board\Post;
use App\Models\User\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BoardTest extends TestCase
{
    use RefreshDatabase;

    // ────────────────────────────────────────────────
    // 게시글 목록
    // ────────────────────────────────────────────────

    public function test_게시판_목록_200응답(): void
    {
        $board = Board::factory()->create(['category' => 'humor']);
        Post::factory()->count(3)->create([
            'post_category' => $board->category,
            'user_id'       => User::factory()->create()->id,
        ]);

        $response = $this->get('/board/humor');

        $response->assertStatus(200);
    }

    public function test_존재하지_않는_게시판_404(): void
    {
        $response = $this->get('/board/없는게시판');

        $response->assertStatus(404);
    }

    // ────────────────────────────────────────────────
    // 게시글 상세
    // ────────────────────────────────────────────────

    public function test_게시글_상세_200응답(): void
    {
        $user  = User::factory()->create();
        $board = Board::factory()->create();
        $post  = Post::factory()->create([
            'user_id'       => $user->id,
            'post_category' => $board->category,
        ]);

        $response = $this->get('/post/' . $post->post_id);

        $response->assertStatus(200);
    }

    public function test_존재하지_않는_게시글_404(): void
    {
        $response = $this->get('/post/99999999');

        $response->assertStatus(404);
    }

    public function test_게시글_조회시_조회수_증가(): void
    {
        $user  = User::factory()->create();
        $board = Board::factory()->create();
        $post  = Post::factory()->create([
            'user_id'       => $user->id,
            'post_category' => $board->category,
            'hits'          => 0,
        ]);

        $this->get('/post/' . $post->post_id);

        $this->assertDatabaseHas('posts', [
            'post_id' => $post->post_id,
            'hits'    => 1,
        ]);
    }

    // ────────────────────────────────────────────────
    // 게시글 작성
    // ────────────────────────────────────────────────

    public function test_비로그인_글쓰기_리다이렉트(): void
    {
        $response = $this->get('/post/write');

        $response->assertRedirect('/login');
    }

    public function test_로그인_글쓰기_성공(): void
    {
        $user  = User::factory()->create();
        $board = Board::factory()->create();

        $response = $this->actingAs($user)->post('/post/write', [
            'post_category' => $board->category,
            'title'         => '테스트 제목',
            'content'       => '테스트 내용입니다.',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('posts', ['title' => '테스트 제목']);
    }

    public function test_제목_없이_글쓰기_실패(): void
    {
        $user  = User::factory()->create();
        $board = Board::factory()->create();

        $response = $this->actingAs($user)->post('/post/write', [
            'post_category' => $board->category,
            'title'         => '',
            'content'       => '내용',
        ]);

        $response->assertSessionHasErrors('title');
    }

    // ────────────────────────────────────────────────
    // 댓글
    // ────────────────────────────────────────────────

    public function test_댓글_작성_성공(): void
    {
        $user  = User::factory()->create();
        $board = Board::factory()->create();
        $post  = Post::factory()->create([
            'user_id'       => $user->id,
            'post_category' => $board->category,
        ]);

        $response = $this->actingAs($user)->post("/post/{$post->post_id}/comments", [
            'content' => '테스트 댓글입니다.',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('comments', ['content' => '테스트 댓글입니다.']);
    }

    public function test_비로그인_댓글_작성_불가(): void
    {
        $user  = User::factory()->create();
        $board = Board::factory()->create();
        $post  = Post::factory()->create([
            'user_id'       => $user->id,
            'post_category' => $board->category,
        ]);

        $response = $this->post("/post/{$post->post_id}/comments", [
            'content' => '댓글',
        ]);

        $response->assertRedirect('/login');
    }

    public function test_댓글_작성시_댓글수_증가(): void
    {
        $user  = User::factory()->create();
        $board = Board::factory()->create();
        $post  = Post::factory()->create([
            'user_id'       => $user->id,
            'post_category' => $board->category,
            'comment_count' => 0,
        ]);

        $this->actingAs($user)->post("/post/{$post->post_id}/comments", [
            'content' => '댓글',
        ]);

        $this->assertDatabaseHas('posts', [
            'post_id'       => $post->post_id,
            'comment_count' => 1,
        ]);
    }

    public function test_댓글_삭제_성공(): void
    {
        $user    = User::factory()->create();
        $board   = Board::factory()->create();
        $post    = Post::factory()->create([
            'user_id'       => $user->id,
            'post_category' => $board->category,
        ]);
        $comment = Comment::factory()->create([
            'post_id' => $post->post_id,
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($user)->delete("/comment/{$comment->comment_id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('comments', ['comment_id' => $comment->comment_id]);
    }

    public function test_다른_유저_댓글_삭제_불가(): void
    {
        $user    = User::factory()->create();
        $other   = User::factory()->create();
        $board   = Board::factory()->create();
        $post    = Post::factory()->create([
            'user_id'       => $user->id,
            'post_category' => $board->category,
        ]);
        $comment = Comment::factory()->create([
            'post_id' => $post->post_id,
            'user_id' => $user->id,
        ]);

        $response = $this->actingAs($other)->delete("/comment/{$comment->comment_id}");

        $response->assertStatus(403);
    }
}
